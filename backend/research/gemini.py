"""Gemini Flash synthesis for cyber threat intelligence."""

from __future__ import annotations

import json
import os
import logging
from typing import Optional

import httpx

from models import (
    SearchResult,
    ResearchBundle,
    ResearchTier,
    ReportSource,
    IOC,
    IOCType,
    AttackTechnique,
    Evidence,
)

logger = logging.getLogger(__name__)

GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
)


def _build_prompt(topic: str, search_results: list[SearchResult]) -> str:
    """Build the structured synthesis prompt."""
    sources_text = ""
    for i, result in enumerate(search_results):
        sources_text += f"\n[{i + 1}] {result.title}\n    URL: {result.url}\n    Snippet: {result.snippet}\n"

    return f"""You are a senior cyber threat intelligence analyst producing a BLUF-format intelligence report.

TOPIC: {topic}

SEARCH RESULTS:
{sources_text}

Produce a comprehensive intelligence report in the following JSON structure. Cite sources by their index number (e.g., [1], [2]).

{{
  "bluf": "Bottom Line Up Front — 2-3 sentence executive summary of the threat",
  "threat_actor": {{
    "name": "Primary threat actor name",
    "aliases": ["alias1", "alias2"],
    "attribution": "Nation-state or group attribution",
    "first_seen": "YYYY or YYYY-MM",
    "last_active": "YYYY or YYYY-MM",
    "tooling": ["tool1", "tool2"],
    "notes": "Additional context"
  }},
  "sections": [
    {{
      "id": "campaign-overview",
      "title": "Campaign Overview",
      "content": "Detailed overview...",
      "citations": ["[1]", "[3]"]
    }},
    {{
      "id": "ttps",
      "title": "Tactics, Techniques & Procedures",
      "content": "TTP analysis...",
      "citations": ["[2]"]
    }},
    {{
      "id": "victimology",
      "title": "Victimology",
      "content": "Target sectors, regions, organizations...",
      "citations": []
    }},
    {{
      "id": "infrastructure",
      "title": "Infrastructure",
      "content": "C2, hosting, domains...",
      "citations": []
    }},
    {{
      "id": "timeline",
      "title": "Timeline",
      "content": "Chronological sequence of events...",
      "citations": []
    }},
    {{
      "id": "attribution",
      "title": "Attribution Assessment",
      "content": "Evidence-based attribution analysis...",
      "citations": []
    }},
    {{
      "id": "impact",
      "title": "Impact Assessment",
      "content": "Business, operational, and strategic impact...",
      "citations": []
    }},
    {{
      "id": "remediation",
      "title": "Remediation Guidance",
      "content": "Actionable mitigation steps...",
      "citations": []
    }},
    {{
      "id": "outlook",
      "title": "Outlook",
      "content": "Future threat projections...",
      "citations": []
    }},
    {{
      "id": "appendix",
      "title": "Appendix",
      "content": "Additional technical details...",
      "citations": []
    }}
  ],
  "iocs": [
    {{
      "type": "ipv4|ipv6|domain|url|md5|sha1|sha256|cve",
      "value": "the indicator value",
      "context": "where/how this IOC was observed"
    }}
  ],
  "attack_techniques": [
    {{
      "technique_id": "T1059.001",
      "name": "PowerShell",
      "tactic": "Execution",
      "description": "How this technique was used",
      "evidence": [
        {{
          "quote": "relevant quote from source",
          "source": "[1]"
        }}
      ]
    }}
  ]
}}

Rules:
1. Extract ALL IOCs mentioned in the sources (IPs, domains, hashes, CVEs, URLs)
2. Map ALL observable techniques to MITRE ATT&CK with technique IDs
3. Cite sources by index number for every factual claim
4. If information is not available from sources, state that explicitly
5. Be precise and analytical — this is for security professionals
6. Return ONLY valid JSON, no markdown formatting or code blocks"""


def _parse_response(raw_text: str, topic: str, search_results: list[SearchResult]) -> dict:
    """Parse the Gemini response JSON, handling common formatting issues.

    Strategies (tried in order):
    1. Direct JSON parse
    2. Strip markdown code fences and retry
    3. Strip trailing commentary after last '}' and retry
    4. Attempt partial JSON recovery (find outermost { ... })
    5. Fall back to structured raw-text sections with parse-fallback markers
    """
    text = raw_text.strip()

    # Strategy 1: Direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strategy 2: Strip markdown code fences
    cleaned = text
    if cleaned.startswith("```"):
        try:
            first_newline = cleaned.index("\n")
            cleaned = cleaned[first_newline + 1:]
        except ValueError:
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

    # Strategy 3: Strip trailing commentary after last '}'
    last_brace = cleaned.rfind("}")
    if last_brace != -1:
        trimmed = cleaned[: last_brace + 1].strip()
        try:
            return json.loads(trimmed)
        except json.JSONDecodeError:
            pass

    # Strategy 4: Extract outermost { ... } block
    first_brace = cleaned.find("{")
    if first_brace != -1 and last_brace > first_brace:
        extracted = cleaned[first_brace: last_brace + 1]
        try:
            return json.loads(extracted)
        except json.JSONDecodeError as e:
            logger.warning(
                "Gemini JSON parse failed after all recovery attempts: %s "
                "(first 200 chars: %s)",
                e,
                extracted[:200],
            )

    # Strategy 5: Structured fallback with parse-failure markers
    logger.error(
        "Gemini response could not be parsed as JSON. "
        "Falling back to raw-text sections. First 500 chars: %s",
        raw_text[:500],
    )

    # Split raw text into paragraphs and create meaningful sections
    paragraphs = [p.strip() for p in raw_text.split("\n\n") if p.strip()]
    fallback_sections = []
    if paragraphs:
        fallback_sections.append({
            "id": "parse-fallback-overview",
            "title": "[PARSE FALLBACK] Research Overview",
            "content": paragraphs[0][:3000],
            "citations": [],
        })
        if len(paragraphs) > 1:
            remaining = "\n\n".join(paragraphs[1:])[:5000]
            fallback_sections.append({
                "id": "parse-fallback-details",
                "title": "[PARSE FALLBACK] Additional Details",
                "content": remaining,
                "citations": [],
            })
    else:
        fallback_sections.append({
            "id": "parse-fallback-raw",
            "title": "[PARSE FALLBACK] Raw Research Content",
            "content": raw_text[:5000],
            "citations": [],
        })

    return {
        "bluf": (
            f"[PARSE FALLBACK] Research synthesis for '{topic}' could not be "
            f"fully parsed from the LLM response. Raw content is preserved below."
        ),
        "threat_actor": {
            "name": topic,
            "aliases": [],
            "attribution": "Unknown",
            "tooling": [],
        },
        "sections": fallback_sections,
        "iocs": [],
        "attack_techniques": [],
    }


async def synthesize_gemini(
    topic: str,
    search_results: list[SearchResult],
    api_key: Optional[str] = None,
) -> ResearchBundle:
    """
    Synthesize search results into a structured research bundle using Gemini Flash.

    Args:
        topic: The research topic.
        search_results: Results from Brave Search.
        api_key: Gemini API key. Falls back to GEMINI_API_KEY env var.

    Returns:
        ResearchBundle with synthesized intelligence.

    Raises:
        ValueError: If no API key or API errors.
    """
    key = api_key or os.environ.get("GEMINI_API_KEY")
    if not key:
        raise ValueError(
            "Gemini API key required. Set GEMINI_API_KEY env var or pass via settings."
        )

    prompt = _build_prompt(topic, search_results)

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "topP": 0.8,
            "maxOutputTokens": 8192,
            "responseMimeType": "application/json",
        },
    }

    url = f"{GEMINI_API_URL}?key={key}"

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
        except httpx.TimeoutException:
            raise ValueError("Gemini synthesis timed out. The topic may be too complex for free tier.")
        except httpx.HTTPStatusError as e:
            status = e.response.status_code
            if status == 400:
                raise ValueError("Invalid request to Gemini API. Check your API key.")
            elif status == 429:
                raise ValueError("Gemini rate limit exceeded. Try again later.")
            elif status == 403:
                raise ValueError("Gemini API key unauthorized. Check permissions.")
            else:
                logger.error("Gemini HTTP error %d: %s", status, e.response.text)
                raise ValueError(f"Gemini synthesis failed with status {status}.")

    response_data = response.json()

    # Extract text from Gemini response
    try:
        raw_text = response_data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as e:
        logger.error("Unexpected Gemini response structure: %s", e)
        raise ValueError("Failed to extract content from Gemini response.")

    parsed = _parse_response(raw_text, topic, search_results)

    # Build sources list from search results
    from datetime import datetime, timezone

    now_iso = datetime.now(timezone.utc).isoformat()
    sources = [
        ReportSource(
            title=sr.title,
            url=sr.url,
            accessed_at=now_iso,
            snippet=sr.snippet[:200] if sr.snippet else None,
        )
        for sr in search_results
    ]

    # Parse IOCs from response
    raw_iocs = parsed.get("iocs", [])
    iocs: list[IOC] = []
    for raw_ioc in raw_iocs:
        try:
            ioc_type = IOCType(raw_ioc.get("type", "domain"))
            iocs.append(
                IOC(
                    type=ioc_type,
                    value=raw_ioc.get("value", ""),
                    context=raw_ioc.get("context"),
                    sources=[],
                )
            )
        except ValueError:
            logger.warning("Unknown IOC type: %s", raw_ioc.get("type"))

    # Parse ATT&CK techniques
    raw_techniques = parsed.get("attack_techniques", [])
    techniques: list[AttackTechnique] = []
    for raw_tech in raw_techniques:
        evidence_list = [
            Evidence(quote=ev.get("quote", ""), source=ev.get("source", ""))
            for ev in raw_tech.get("evidence", [])
        ]
        techniques.append(
            AttackTechnique(
                technique_id=raw_tech.get("technique_id", ""),
                name=raw_tech.get("name", ""),
                tactic=raw_tech.get("tactic", ""),
                description=raw_tech.get("description", ""),
                evidence=evidence_list,
            )
        )

    return ResearchBundle(
        topic=topic,
        tier=ResearchTier.FREE,
        search_results=search_results,
        synthesized_content=raw_text,
        extracted_iocs=iocs,
        suggested_techniques=techniques,
        sources=sources,
        metadata={
            "searchDurationMs": 0,
            "synthesisDurationMs": 0,
            "totalDurationMs": 0,
            "searchProvider": "brave",
            "synthesisModel": "gemini-2.0-flash",
        },
    )
