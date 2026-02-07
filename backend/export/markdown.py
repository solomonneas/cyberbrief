"""Markdown exporter — renders a Report as clean, formatted Markdown.

Outputs include TLP banner, table of contents, all report sections,
footnote superscripts, endnotes, IOC table, and bibliography in
Chicago NB format.
"""

from __future__ import annotations

import re
from typing import Optional

from models import Report, ReportSection, IOC, TLPLevel
from report.chicago_formatter import (
    format_footnote,
    format_bibliography_entry,
    format_sources_as_bibliography,
    format_sources_as_endnotes,
)


# ─── TLP Banners ──────────────────────────────────────────────────────────────

TLP_BANNERS = {
    TLPLevel.CLEAR: "🟢 **TLP:CLEAR** — Disclosure is not limited.",
    TLPLevel.GREEN: "🟢 **TLP:GREEN** — Limited disclosure, community only.",
    TLPLevel.AMBER: "🟡 **TLP:AMBER** — Limited disclosure, restricted to participants' organizations.",
    TLPLevel.AMBER_STRICT: "🟡 **TLP:AMBER+STRICT** — Limited disclosure, restricted to participants only.",
    TLPLevel.RED: "🔴 **TLP:RED** — Not for disclosure. Restricted to participants only.",
}


def _inject_footnote_superscripts(content: str, citations: list[str]) -> str:
    """
    Inject footnote superscript markers at the end of sentences
    in section content based on citation references.

    Citations are in format '[N]' where N is the source number.
    We append superscripts at natural break points.
    """
    if not citations:
        return content

    # Build superscript references
    refs = []
    for cite in citations:
        # Extract number from '[N]' format
        match = re.match(r"\[(\d+)\]", cite)
        if match:
            refs.append(f"<sup>[{match.group(1)}]</sup>")

    if not refs:
        return content

    # Distribute references across sentences
    sentences = re.split(r'(?<=[.!?])\s+', content)
    if not sentences:
        return content

    result_parts = []
    ref_idx = 0
    for i, sentence in enumerate(sentences):
        result_parts.append(sentence)
        # Append a reference to every other sentence, or at least at the end
        if ref_idx < len(refs) and (i % max(1, len(sentences) // len(refs)) == 0 or i == len(sentences) - 1):
            result_parts.append(refs[ref_idx])
            ref_idx += 1

    return " ".join(result_parts)


def _render_ioc_table(iocs: list[IOC]) -> str:
    """Render IOCs as a markdown table."""
    if not iocs:
        return ""

    lines = [
        "| Type | Indicator | Context |",
        "|------|-----------|---------|",
    ]
    for ioc in iocs:
        ioc_type = ioc.type.upper() if isinstance(ioc.type, str) else ioc.type.value.upper()
        context = ioc.context or "—"
        # Escape pipe characters in values
        value = ioc.value.replace("|", "\\|")
        context = context.replace("|", "\\|")
        lines.append(f"| {ioc_type} | `{value}` | {context} |")

    return "\n".join(lines)


def export_markdown(report: Report) -> str:
    """
    Export a Report object as formatted Markdown.

    Includes:
    - TLP banner at top
    - Report metadata header
    - Table of contents
    - BLUF section
    - All report sections with footnote superscripts
    - IOC table
    - ATT&CK mapping
    - Confidence assessments
    - Endnotes
    - Bibliography (Chicago NB)

    Args:
        report: The Report object to export.

    Returns:
        Complete markdown string.
    """
    parts: list[str] = []

    # ── TLP Banner ────────────────────────────────────────────────────────
    tlp_banner = TLP_BANNERS.get(report.tlp, f"**{report.tlp}**")
    parts.append(f"> {tlp_banner}")
    parts.append("")

    # ── Title & Metadata ─────────────────────────────────────────────────
    parts.append(f"# {report.topic}")
    parts.append("")
    parts.append(f"**Generated:** {report.created_at}  ")
    parts.append(f"**Tier:** {report.tier}  ")
    parts.append(f"**Report ID:** `{report.id}`")
    parts.append("")
    parts.append("---")
    parts.append("")

    # ── Table of Contents ─────────────────────────────────────────────────
    parts.append("## Table of Contents")
    parts.append("")
    parts.append("- [BLUF — Bottom Line Up Front](#bluf)")
    if report.threat_actor:
        parts.append("- [Threat Actor Profile](#threat-actor-profile)")
    for section in report.sections:
        anchor = section.id
        parts.append(f"- [{section.title}](#{anchor})")
    if report.iocs:
        parts.append("- [Indicators of Compromise](#indicators-of-compromise)")
    if report.attack_mapping:
        parts.append("- [MITRE ATT&CK Mapping](#mitre-attck-mapping)")
    if report.confidence_assessments:
        parts.append("- [Confidence Assessments](#confidence-assessments)")
    parts.append("- [Endnotes](#endnotes)")
    parts.append("- [Bibliography](#bibliography)")
    parts.append("")
    parts.append("---")
    parts.append("")

    # ── BLUF ──────────────────────────────────────────────────────────────
    parts.append('<a id="bluf"></a>')
    parts.append("")
    parts.append("## BLUF — Bottom Line Up Front")
    parts.append("")
    parts.append(f"> {report.bluf}")
    parts.append("")

    # ── Threat Actor Profile ──────────────────────────────────────────────
    if report.threat_actor:
        parts.append('<a id="threat-actor-profile"></a>')
        parts.append("")
        parts.append("## Threat Actor Profile")
        parts.append("")
        ta = report.threat_actor
        parts.append(f"- **Name:** {ta.name}")
        if ta.aliases:
            parts.append(f"- **Aliases:** {', '.join(ta.aliases)}")
        parts.append(f"- **Attribution:** {ta.attribution}")
        if ta.first_seen:
            parts.append(f"- **First Seen:** {ta.first_seen}")
        if ta.last_active:
            parts.append(f"- **Last Active:** {ta.last_active}")
        if ta.tooling:
            parts.append(f"- **Tooling:** {', '.join(ta.tooling)}")
        if ta.notes:
            parts.append(f"- **Notes:** {ta.notes}")
        parts.append("")

    # ── Report Sections ───────────────────────────────────────────────────
    for section in report.sections:
        parts.append(f'<a id="{section.id}"></a>')
        parts.append("")
        parts.append(f"## {section.title}")
        parts.append("")
        # Inject footnote superscripts
        content_with_refs = _inject_footnote_superscripts(section.content, section.citations)
        parts.append(content_with_refs)
        parts.append("")

    # ── IOC Table (standalone, outside sections) ──────────────────────────
    if report.iocs:
        # Check if IOCs were already in a section
        ioc_section_exists = any(s.id == "iocs" for s in report.sections)
        if not ioc_section_exists:
            parts.append('<a id="indicators-of-compromise"></a>')
            parts.append("")
            parts.append("## Indicators of Compromise")
            parts.append("")
            parts.append(_render_ioc_table(report.iocs))
            parts.append("")

    # ── ATT&CK Mapping ────────────────────────────────────────────────────
    if report.attack_mapping:
        parts.append('<a id="mitre-attck-mapping"></a>')
        parts.append("")
        parts.append("## MITRE ATT&CK Mapping")
        parts.append("")
        parts.append("| Technique ID | Name | Tactic | Description |")
        parts.append("|--------------|------|--------|-------------|")
        def _esc_md(value: object) -> str:
            return str(value).replace("|", "\\|").replace("\n", " ")

        for tech in report.attack_mapping:
            tid = _esc_md(tech.technique_id)
            name = _esc_md(tech.name)
            tactic = _esc_md(tech.tactic)
            desc = _esc_md(tech.description)
            parts.append(f"| {tid} | {name} | {tactic} | {desc} |")
        parts.append("")

    # ── Confidence Assessments ────────────────────────────────────────────
    if report.confidence_assessments:
        parts.append('<a id="confidence-assessments"></a>')
        parts.append("")
        parts.append("## Confidence Assessments")
        parts.append("")
        for assessment in report.confidence_assessments:
            conf = assessment.confidence
            if isinstance(conf, str):
                conf_str = conf
            else:
                conf_str = conf.value
            parts.append(f"- **{conf_str}** — {assessment.finding}")
            parts.append(f"  - {assessment.rationale}")
        parts.append("")

    # ── Endnotes ──────────────────────────────────────────────────────────
    parts.append('<a id="endnotes"></a>')
    parts.append("")
    parts.append("## Endnotes")
    parts.append("")
    if report.sources:
        source_dicts = [
            {
                "title": s.title,
                "url": s.url,
                "accessedAt": s.accessed_at,
                "snippet": s.snippet,
            }
            for s in report.sources
        ]
        endnotes = format_sources_as_endnotes(source_dicts)
        for note in endnotes:
            parts.append(note)
            parts.append("")
    else:
        parts.append("No sources to cite.")
        parts.append("")

    # ── Bibliography ──────────────────────────────────────────────────────
    parts.append('<a id="bibliography"></a>')
    parts.append("")
    parts.append("## Bibliography")
    parts.append("")
    if report.sources:
        source_dicts = [
            {
                "title": s.title,
                "url": s.url,
                "accessedAt": s.accessed_at,
                "snippet": s.snippet,
            }
            for s in report.sources
        ]
        bib_entries = format_sources_as_bibliography(source_dicts)
        for entry in bib_entries:
            parts.append(entry)
            parts.append("")
    else:
        parts.append("No sources.")
        parts.append("")

    parts.append("---")
    parts.append(f"*Report generated by CyberBRIEF • {report.created_at}*")
    parts.append("")

    return "\n".join(parts)
