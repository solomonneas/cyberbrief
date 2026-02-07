"""Perplexity API integration — STANDARD and DEEP tiers (stub)."""

from __future__ import annotations

from models import ResearchBundle, ResearchTier


async def search_perplexity_sonar(
    topic: str,
    api_key: str,
) -> ResearchBundle:
    """
    STANDARD tier: Use Perplexity Sonar for enhanced research.

    Not yet implemented — requires Perplexity API key and STANDARD tier subscription.
    """
    raise NotImplementedError(
        "STANDARD tier (Perplexity Sonar) is not yet implemented. "
        "Use FREE tier with Brave Search + Gemini Flash."
    )


async def deep_research_perplexity(
    topic: str,
    api_key: str,
) -> ResearchBundle:
    """
    DEEP tier: Use Perplexity Deep Research for comprehensive analysis.

    Not yet implemented — requires Perplexity API key and DEEP tier subscription.
    """
    raise NotImplementedError(
        "DEEP tier (Perplexity Deep Research) is not yet implemented. "
        "Use FREE tier with Brave Search + Gemini Flash."
    )
