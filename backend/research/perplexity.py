"""Perplexity API integration — STANDARD and DEEP tiers (stub).

These tiers are planned but not yet implemented. Functions raise
PerplexityNotAvailable instead of generic exceptions so the API
layer can return a clean 501 response.
"""

from __future__ import annotations

from models import ResearchBundle, ResearchTier


class PerplexityNotAvailable(Exception):
    """Raised when a Perplexity-dependent tier is requested but not yet implemented."""
    pass


async def search_perplexity_sonar(
    topic: str,
    api_key: str,
) -> ResearchBundle:
    """
    STANDARD tier: Use Perplexity Sonar for enhanced research.

    Not yet implemented — requires Perplexity API key and STANDARD tier subscription.
    """
    raise PerplexityNotAvailable(
        "Perplexity integration coming soon. Use Free tier."
    )


async def deep_research_perplexity(
    topic: str,
    api_key: str,
) -> ResearchBundle:
    """
    DEEP tier: Use Perplexity Deep Research for comprehensive analysis.

    Not yet implemented — requires Perplexity API key and DEEP tier subscription.
    """
    raise PerplexityNotAvailable(
        "Perplexity integration coming soon. Use Free tier."
    )
