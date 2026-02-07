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
    """Parse the Gemini response JSON, handling common formatting issues."""
    # Strip markdown code fences if present
    text = raw_text.strip()
    if text.startswith("```"):
        # Remove opening fence
        first_newline = text.index("\n")
        text = text[first_newline + 1 :]
        # Remove closing fence
        if text.endswith("```"):
            text = text[:-3].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse Gemini response as JSON: %s", e)
        # Return a minimal valid structure
        return {
            "bluf": f"Research synthesis for '{topic}' could not be fully parsed. Raw content available.",
            "threat_actor": {
                "name": topic,
                "aliases": [],
                "attribution": "Unknown",
                "tooling": [],
            },
            "sections": [
                {
                    "id": "raw-content",
                    "title": "Raw Research Content",
                    "content": raw_text[:5000],
                    "citations": [],
                }
            ],
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
