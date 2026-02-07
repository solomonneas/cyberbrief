"""Brave Search API integration for cyber threat intelligence research."""

from __future__ import annotations

import os
import re
import logging
from typing import Optional

import httpx

from models import SearchResult

logger = logging.getLogger(__name__)

BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search"

# Patterns that indicate cyber-specific topics
APT_PATTERN = re.compile(r"\bAPT\d+\b", re.IGNORECASE)
CVE_PATTERN = re.compile(r"\bCVE-\d{4}-\d{4,}\b", re.IGNORECASE)
THREAT_KEYWORDS = {"malware", "ransomware", "phishing", "exploit", "vulnerability", "campaign"}


def _enhance_query(query: str) -> str:
    """Add cyber-specific search terms to improve results."""
    lower = query.lower()
    additions: list[str] = []

    # If it looks like an APT group, add context terms
    if APT_PATTERN.search(query) or any(
        kw in lower for kw in ("fancy bear", "cozy bear", "sandworm", "lazarus", "volt typhoon")
    ):
        additions.append("threat actor MITRE ATT&CK campaign")

    # If it's a CVE, add exploit context
    elif CVE_PATTERN.search(query):
        additions.append("exploit vulnerability IOC remediation")

    # If it mentions common threat types, enrich
    elif any(kw in lower for kw in THREAT_KEYWORDS):
        additions.append("threat intelligence IOC MITRE")

    # Default enrichment for generic topics
    else:
        additions.append("cyber threat intelligence")

    enhanced = f"{query} {' '.join(additions)}"
    logger.info("Enhanced query: %s", enhanced)
    return enhanced


async def search_brave(
    query: str,
    count: int = 10,
    api_key: Optional[str] = None,
) -> list[SearchResult]:
    """
    Search Brave for cyber threat intelligence.

    Args:
        query: The search topic.
        count: Number of results to return (max 20).
        api_key: Brave Search API key. Falls back to BRAVE_API_KEY env var.

    Returns:
        List of SearchResult objects.

    Raises:
        ValueError: If no API key is provided.
        httpx.HTTPStatusError: On API errors.
    """
    key = api_key or os.environ.get("BRAVE_API_KEY")
    if not key:
        raise ValueError(
            "Brave Search API key required. Set BRAVE_API_KEY env var or pass via settings."
        )

    enhanced_query = _enhance_query(query)

    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": key,
    }

    params = {
        "q": enhanced_query,
        "count": min(count, 20),
        "text_decorations": False,
        "search_lang": "en",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(
                BRAVE_SEARCH_URL,
                headers=headers,
                params=params,
            )
            response.raise_for_status()
        except httpx.TimeoutException:
            logger.error("Brave Search timed out for query: %s", query)
            raise ValueError("Search request timed out. Please try again.")
        except httpx.HTTPStatusError as e:
            status = e.response.status_code
            if status == 401:
                raise ValueError("Invalid Brave Search API key.")
            elif status == 429:
                raise ValueError("Brave Search rate limit exceeded. Try again later.")
            else:
                logger.error("Brave Search HTTP error %d: %s", status, e.response.text)
                raise ValueError(f"Search failed with status {status}.")

    data = response.json()
    web_results = data.get("web", {}).get("results", [])

    results: list[SearchResult] = []
    for item in web_results[:count]:
        results.append(
            SearchResult(
                title=item.get("title", ""),
                url=item.get("url", ""),
                snippet=item.get("description", ""),
                published_date=item.get("page_age", None),
            )
        )

    logger.info("Brave Search returned %d results for: %s", len(results), query)
    return results
