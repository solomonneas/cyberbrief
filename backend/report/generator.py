"""Report generator — transforms a ResearchBundle into a structured Report.

Produces intelligence-style reports following BLUF methodology with
Chicago NB citations, confidence assessments, and IOC extraction.
"""

from __future__ import annotations

import hashlib
import logging
import re
from datetime import datetime, timezone
from typing import Optional

from models import (
    AttackTechnique,
    ConfidenceAssessment,
    ConfidenceLevel,
    IOC,
    Report,
    ReportSection,
    ReportSource,
    ResearchBundle,
    ResearchTier,
    ThreatActorProfile,
    TLPLevel,
)
from report.chicago_formatter import (
    format_footnote,
    format_short_note,
    format_bibliography_entry,
    format_sources_as_bibliography,
    format_sources_as_endnotes,
)
from report.ioc_extractor import extract_iocs
from attack.mapper import map_techniques_from_text, lookup_technique, enrich_attack_mapping

logger = logging.getLogger(__name__)


def _generate_report_id(topic: str) -> str:
    """Generate a deterministic but unique report ID."""
    timestamp = datetime.now(timezone.utc).isoformat()
    raw = f"{topic}:{timestamp}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def _assess_confidence(
    source_count: int,
    finding: str,
) -> ConfidenceAssessment:
    """Assign confidence level based on source count heuristics."""
    if source_count >= 5:
        return ConfidenceAssessment(
            finding=finding,
            confidence=ConfidenceLevel.HIGH,
            rationale=(
                f"High — based on {source_count} converging sources "
                "with consistent reporting across multiple vendors and outlets."
            ),
        )
    elif source_count >= 3:
        return ConfidenceAssessment(
            finding=finding,
            confidence=ConfidenceLevel.MODERATE,
            rationale=(
                f"Moderate — {source_count} sources provide partial corroboration; "
                "some gaps in independent verification remain."
            ),
        )
    else:
        return ConfidenceAssessment(
            finding=finding,
            confidence=ConfidenceLevel.LOW,
            rationale=(
                f"Low — limited to {source_count} source(s); insufficient "
                "independent corroboration for high confidence."
            ),
        )


def _build_bluf(topic: str, content: str, source_count: int) -> str:
    """
    Generate a BLUF (Bottom Line Up Front) following the BLUF_STYLE_GUIDE.md.

    Structure:
    1. Bottom line (1-2 sentences with timeframe + confidence)
    2. Why (2-4 key drivers/evidence)
    3. Implications/so-what
    4. Indicators to watch
    """
    # Determine confidence and timeframe based on source convergence
    if source_count >= 5:
        timeframe = "near-term (0–3 months)"
        confidence_tag = "High"
        confidence_reason = (
            f"convergent reporting across {source_count} sources "
            "with consistent findings from multiple vendors"
        )
    elif source_count >= 3:
        timeframe = "mid-term (3–12 months)"
        confidence_tag = "Moderate"
        confidence_reason = (
            f"{source_count} sources provide partial corroboration; "
            "some gaps in independent verification remain"
        )
    else:
        timeframe = "near-term"
        confidence_tag = "Low"
        confidence_reason = (
            f"limited to {source_count} source(s); insufficient "
            "independent corroboration"
        )

    # Extract substantive sentences for drivers, implications, and indicators
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', content) if len(s.strip()) > 30]

    # Classify sentences into categories by keyword heuristics
    driver_sentences: list[str] = []
    implication_sentences: list[str] = []
    indicator_sentences: list[str] = []

    for s in sentences:
        s_lower = s.lower()
        if any(kw in s_lower for kw in [
            "because", "due to", "driven by", "result of", "caused by",
            "exploit", "vulnerab", "campaign", "attack", "target", "observed",
            "discovered", "reported", "identified", "compromis",
        ]):
            driver_sentences.append(s)
        elif any(kw in s_lower for kw in [
            "impact", "affect", "consequence", "risk", "damage", "disrupt",
            "significan", "critical", "operation", "business", "sector",
            "implication", "this means", "therefore",
        ]):
            implication_sentences.append(s)
        elif any(kw in s_lower for kw in [
            "indicator", "watch", "monitor", "signal", "suggest", "if ",
            "increase", "decrease", "escalat", "continu", "future", "expect",
            "predict", "likely to", "trend",
        ]):
            indicator_sentences.append(s)

    # Build drivers (2-4 key evidence points)
    drivers = driver_sentences[:4] if driver_sentences else sentences[:3]
    driver_text = ""
    if drivers:
        truncated = []
        for d in drivers:
            d = d.rstrip(".")
            if len(d) > 150:
                d = d[:147] + "..."
            truncated.append(d)
        driver_text = "; ".join(truncated) + "."

    # Build implications
    if implication_sentences:
        impl = implication_sentences[0]
        if len(impl) > 200:
            impl = impl[:197] + "..."
        implications_text = impl
    else:
        implications_text = (
            f"Organizations in affected sectors should evaluate their exposure "
            f"to threats related to {topic} and prioritize defensive measures."
        )

    # Build indicators to watch
    if indicator_sentences:
        ind = indicator_sentences[0]
        if len(ind) > 200:
            ind = ind[:197] + "..."
        indicators_text = ind
    else:
        indicators_text = (
            f"Increased targeting activity, new exploit disclosures, "
            f"or additional vendor reporting would raise confidence in this assessment."
        )

    # Assemble the full BLUF per style guide
    parts = []

    # 1. Bottom line with timeframe + confidence
    parts.append(
        f"We assess that threats related to {topic} are likely to persist "
        f"in the {timeframe}."
    )

    # 2. Key drivers
    if driver_text:
        parts.append(f"\n\nKey drivers: {driver_text}")
    else:
        parts.append(
            f"\n\nKey drivers: available open-source reporting indicates "
            f"ongoing activity related to {topic}."
        )

    # 3. Implications
    _impl_start = implications_text[0].lower() + implications_text[1:] if implications_text and implications_text[0].isupper() else implications_text
    parts.append(f"\n\nThis matters because {_impl_start}")

    # 4. Indicators to watch
    parts.append(f"\n\nIndicators to watch: {indicators_text}")

    # 5. Confidence tag with rationale
    parts.append(f"\n\nConfidence: {confidence_tag} — {confidence_reason}.")

    return "".join(parts)


def _extract_threat_actor(topic: str, content: str) -> ThreatActorProfile:
    """Extract or infer threat actor profile from synthesized content."""
    # Use the topic as the actor name baseline
    name = topic.strip()
    aliases: list[str] = []
    attribution = "Unknown"
    tooling: list[str] = []

    # Try to extract aliases from content (patterns like "also known as X, Y")
    aka_match = re.search(
        r"(?:also known as|a\.?k\.?a\.?|aliases?[:\s]+)([^.]+)",
        content,
        re.IGNORECASE,
    )
    if aka_match:
        raw_aliases = aka_match.group(1)
        aliases = [a.strip().strip(",").strip() for a in re.split(r"[,;/]|and\b", raw_aliases) if a.strip()]
        aliases = [a for a in aliases if len(a) > 1 and len(a) < 60][:10]

    # Try to extract attribution (country/group)
    attr_match = re.search(
        r"(?:attributed to|linked to|associated with|backed by|sponsored by)\s+([^.,:;]+)",
        content,
        re.IGNORECASE,
    )
    if attr_match:
        attribution = attr_match.group(1).strip()[:100]

    # Try to extract tools/malware
    tool_patterns = [
        r"(?:using|deploys?|utiliz(?:es?|ing)|leverag(?:es?|ing)|tools?\s+(?:include|such as))\s+([^.]+)",
    ]
    for pattern in tool_patterns:
        tool_match = re.search(pattern, content, re.IGNORECASE)
        if tool_match:
            raw_tools = tool_match.group(1)
            tooling = [t.strip().strip(",").strip() for t in re.split(r"[,;]|and\b", raw_tools) if t.strip()]
            tooling = [t for t in tooling if len(t) > 1 and len(t) < 60][:10]
            break

    return ThreatActorProfile(
        name=name,
        aliases=aliases,
        attribution=attribution,
        tooling=tooling,
    )


def _build_sections(
    topic: str,
    content: str,
    sources: list[ReportSource],
    iocs: list[IOC],
    techniques: list[AttackTechnique],
    report_type: str = "full",
) -> list[ReportSection]:
    """Build report sections from synthesized content."""
    sections: list[ReportSection] = []

    # Split content into paragraphs for distribution across sections
    paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = [content]

    # Source citation references
    source_refs = [f"[{i+1}]" for i in range(len(sources))]

    # ── Executive Summary ─────────────────────────────────────────────────
    exec_summary = paragraphs[0] if paragraphs else f"Analysis of {topic}."
    sections.append(ReportSection(
        id="executive-summary",
        title="Executive Summary",
        content=exec_summary,
        citations=source_refs[:3],
    ))

    # ── Threat Actor Profile ──────────────────────────────────────────────
    actor_content = ""
    for p in paragraphs:
        if any(kw in p.lower() for kw in ["actor", "group", "apt", "threat", "attributed", "campaign"]):
            actor_content = p
            break
    if not actor_content and len(paragraphs) > 1:
        actor_content = paragraphs[1]
    sections.append(ReportSection(
        id="actors",
        title="Threat Actors",
        content=actor_content or f"Threat actor analysis for {topic}.",
        citations=source_refs[:4],
    ))

    # ── Targets / Victimology ─────────────────────────────────────────────
    targets_content = ""
    for p in paragraphs:
        if any(kw in p.lower() for kw in ["target", "victim", "sector", "industry", "organization"]):
            targets_content = p
            break
    sections.append(ReportSection(
        id="targets",
        title="Targets & Victimology",
        content=targets_content or "Target information was not explicitly identified in available sources.",
        citations=source_refs[:3],
    ))

    # ── Intentions / Motivation ───────────────────────────────────────────
    intentions_content = ""
    for p in paragraphs:
        if any(kw in p.lower() for kw in ["intent", "motiv", "objective", "goal", "purpose", "espionage", "financial"]):
            intentions_content = p
            break
    sections.append(ReportSection(
        id="intentions",
        title="Intentions & Motivations",
        content=intentions_content or "Motivations inferred from observed behavior and targeting patterns.",
        citations=source_refs[:2],
    ))

    if report_type in ("full", "both"):
        # ── TTPs ──────────────────────────────────────────────────────────
        if techniques:
            ttp_lines = []
            for tech in techniques:
                ttp_lines.append(
                    f"**{tech.technique_id} — {tech.name}** ({tech.tactic}): {tech.description}"
                )
            ttp_content = "\n\n".join(ttp_lines)
        else:
            ttp_content = ""
            for p in paragraphs:
                if any(kw in p.lower() for kw in ["technique", "tactic", "procedure", "ttp", "attack"]):
                    ttp_content = p
                    break
            if not ttp_content:
                ttp_content = "Detailed TTPs require further analysis from primary source material."
        sections.append(ReportSection(
            id="ttps",
            title="Tactics, Techniques & Procedures (TTPs)",
            content=ttp_content,
            citations=source_refs,
        ))

        # ── Tools & Malware ───────────────────────────────────────────────
        tools_content = ""
        for p in paragraphs:
            if any(kw in p.lower() for kw in ["malware", "tool", "implant", "backdoor", "payload", "ransomware"]):
                tools_content = p
                break
        sections.append(ReportSection(
            id="tools-malware",
            title="Tools & Malware",
            content=tools_content or "Specific tooling details were not identified in the current research scope.",
            citations=source_refs[:3],
        ))

        # ── IOCs ──────────────────────────────────────────────────────────
        if iocs:
            ioc_lines = [f"| {ioc.type.upper()} | `{ioc.value}` | {ioc.context or '—'} |" for ioc in iocs[:20]]
            ioc_content = (
                "| Type | Value | Context |\n"
                "|------|-------|---------|\n"
                + "\n".join(ioc_lines)
            )
        else:
            ioc_content = "No indicators of compromise were automatically extracted from the available sources."
        sections.append(ReportSection(
            id="iocs",
            title="Indicators of Compromise (IOCs)",
            content=ioc_content,
            citations=source_refs[:2],
        ))

    # ── Assessment ────────────────────────────────────────────────────────
    assessment_content = ""
    remaining = [p for p in paragraphs if p not in [
        exec_summary, actor_content, targets_content, intentions_content
    ]]
    if remaining:
        assessment_content = remaining[-1]
    sections.append(ReportSection(
        id="assessment",
        title="Assessment & Outlook",
        content=assessment_content or f"Continued monitoring of {topic} is recommended.",
        citations=source_refs,
    ))

    # ── Remediation ───────────────────────────────────────────────────────
    remediation_content = ""
    for p in paragraphs:
        if any(kw in p.lower() for kw in ["mitigat", "remediat", "patch", "recommend", "defend", "protect"]):
            remediation_content = p
            break
    sections.append(ReportSection(
        id="remediation",
        title="Remediation & Recommendations",
        content=remediation_content or (
            "Organizations should monitor for associated IOCs, apply relevant patches, "
            "and review network telemetry for signs of compromise. Consult vendor advisories "
            "for specific mitigation guidance."
        ),
        citations=source_refs[:3],
    ))

    return sections


async def generate_report(
    bundle: ResearchBundle,
    *,
    report_type: str = "full",
    tlp: TLPLevel = TLPLevel.GREEN,
) -> Report:
    """
    Generate a structured intelligence report from a research bundle.

    Args:
        bundle: The research bundle containing search results and synthesis.
        report_type: 'full', 'weekly', or 'both'.
        tlp: Traffic Light Protocol marking for the report.

    Returns:
        A fully structured Report object.
    """
    report_id = _generate_report_id(bundle.topic)
    now = datetime.now(timezone.utc).isoformat()

    # Extract IOCs from synthesized content
    content_iocs = extract_iocs(bundle.synthesized_content)
    # Merge with any IOCs already in the bundle
    all_iocs = list(bundle.extracted_iocs) + content_iocs
    # Deduplicate by (type, value)
    seen_iocs: set[tuple[str, str]] = set()
    unique_iocs: list[IOC] = []
    for ioc in all_iocs:
        key = (ioc.type, ioc.value)
        if key not in seen_iocs:
            seen_iocs.add(key)
            unique_iocs.append(ioc)

    # Build BLUF
    bluf = _build_bluf(bundle.topic, bundle.synthesized_content, len(bundle.sources))

    # Extract threat actor profile
    threat_actor = _extract_threat_actor(bundle.topic, bundle.synthesized_content)

    # Build sections
    sections = _build_sections(
        topic=bundle.topic,
        content=bundle.synthesized_content,
        sources=bundle.sources,
        iocs=unique_iocs,
        techniques=list(bundle.suggested_techniques),
        report_type=report_type,
    )

    # Generate confidence assessments
    assessments = [
        _assess_confidence(len(bundle.sources), f"Overall assessment for {bundle.topic}"),
    ]
    # Add per-section confidence where relevant
    if len(bundle.sources) > 0:
        assessments.append(
            _assess_confidence(
                min(len(bundle.sources), 3),
                "Attribution and threat actor identification",
            )
        )
    if unique_iocs:
        assessments.append(
            _assess_confidence(
                len([ioc for ioc in unique_iocs if len(ioc.sources) > 0]) or 1,
                "Indicator of Compromise validity",
            )
        )

    # ── ATT&CK mapper: validate and augment techniques ─────────────────
    llm_techniques = list(bundle.suggested_techniques)

    # Find techniques in the research text that the LLM may have missed
    text_techniques = map_techniques_from_text(bundle.synthesized_content)

    # Merge: LLM techniques take priority, add any new ones from text scan
    seen_tids: set[str] = {t.technique_id for t in llm_techniques}
    merged_techniques = list(llm_techniques)
    for t in text_techniques:
        if t.technique_id not in seen_tids:
            seen_tids.add(t.technique_id)
            merged_techniques.append(t)

    # Validate technique IDs against the local ATT&CK DB
    validated_techniques: list[AttackTechnique] = []
    for tech in merged_techniques:
        matches = lookup_technique(tech.technique_id)
        if matches:
            # Technique ID is valid — keep it
            validated_techniques.append(tech)
        else:
            logger.warning(
                "Dropping invalid ATT&CK technique ID: %s (%s)",
                tech.technique_id, tech.name,
            )

    # Enrich validated techniques with evidence quotes
    enriched_techniques = enrich_attack_mapping(
        validated_techniques, bundle.synthesized_content
    )

    # ── Chicago NB citations: footnotes and bibliography ─────────────────
    footnotes: list[str] = []
    bibliography: list[str] = []
    cited_urls: set[str] = set()  # Track first-cite vs short-note

    source_dicts = [
        {
            "title": src.title,
            "url": src.url,
            "accessed_at": src.accessed_at,
            "snippet": src.snippet or "",
        }
        for src in bundle.sources
    ]

    # Build footnotes with first-cite / short-note logic
    for i, src_dict in enumerate(source_dicts, start=1):
        url = src_dict["url"]
        if url not in cited_urls:
            # First citation — full footnote
            cited_urls.add(url)
            footnotes.append(format_footnote(src_dict, i))
        else:
            # Subsequent citation — short note
            footnotes.append(format_short_note(src_dict, i))

    # Build bibliography entries (alphabetically sorted)
    bibliography = format_sources_as_bibliography(source_dicts)

    # ── Build the Report ─────────────────────────────────────────────────
    report = Report(
        id=report_id,
        topic=bundle.topic,
        created_at=now,
        tier=bundle.tier,
        tlp=tlp,
        bluf=bluf,
        threat_actor=threat_actor,
        sections=sections,
        iocs=unique_iocs,
        attack_mapping=enriched_techniques,
        sources=list(bundle.sources),
        footnotes=footnotes,
        bibliography=bibliography,
        confidence_assessments=assessments,
    )

    logger.info(
        "Generated report %s: %d sections, %d IOCs, %d techniques "
        "(%d from LLM, %d from text scan), %d sources, %d footnotes",
        report_id,
        len(sections),
        len(unique_iocs),
        len(enriched_techniques),
        len(llm_techniques),
        len(text_techniques),
        len(bundle.sources),
        len(footnotes),
    )

    return report
