"""Chicago Manual of Style 17th Ed. Notes-Bibliography citation formatter.

Formats sources into proper Chicago NB citations for footnotes,
short notes, and bibliography entries. Handles web articles,
government reports, vendor whitepapers, and no-author sources.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional


def _format_date(date_str: str) -> str:
    """Convert ISO date string to 'Month Day, Year' format."""
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.strftime("%B %-d, %Y")
    except (ValueError, TypeError):
        # Fall back to the raw string if parsing fails
        return date_str


def _extract_site_name(url: str) -> str:
    """Extract a human-readable site/organization name from a URL."""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        host = parsed.hostname or ""
        # Strip www prefix
        if host.startswith("www."):
            host = host[4:]
        # Capitalize domain parts
        parts = host.split(".")
        if len(parts) >= 2:
            return parts[-2].capitalize()
        return host.capitalize()
    except Exception:
        return "Unknown"


def _split_author(author: str) -> tuple[str, str]:
    """Split 'First Last' into (first, last). Handles single-name authors."""
    parts = author.strip().split()
    if len(parts) == 1:
        return ("", parts[0])
    return (" ".join(parts[:-1]), parts[-1])


def format_footnote(
    source: dict,
    note_number: int,
    *,
    author: Optional[str] = None,
    source_type: str = "web",
) -> str:
    """
    Format a full first-citation footnote in Chicago NB style.

    Args:
        source: Dict with keys: title, url, accessedAt, snippet (optional).
        note_number: The footnote number.
        author: Author name if known. None for no-author sources.
        source_type: One of 'web', 'government', 'vendor'.

    Returns:
        Formatted footnote string, e.g.:
        1. Author First Last, "Page Title," Organization, Month Day, Year, URL.
    """
    title = source.get("title", "Untitled")
    url = source.get("url", "")
    accessed_at = source.get("accessedAt", source.get("accessed_at", ""))
    date_str = _format_date(accessed_at) if accessed_at else ""
    site_name = _extract_site_name(url)

    if source_type == "government":
        # Government/Institutional Report:
        # N. Organization, *Report Title* (Location: Publisher, Year), page.
        org = author or site_name
        return f"{note_number}. {org}, *{title}*, {date_str}, {url}."

    if source_type == "vendor":
        # Vendor whitepaper — treat like web article with org as author
        org = author or site_name
        return f'{note_number}. {org}, "{title}," {date_str}, {url}.'

    # Web source (default)
    if author:
        first, last = _split_author(author)
        author_part = f"{first} {last}" if first else last
        return f'{note_number}. {author_part}, "{title}," {site_name}, {date_str}, {url}.'
    else:
        # No author — title-first format
        return f'{note_number}. "{title}," {site_name}, accessed {date_str}, {url}.'


def format_short_note(
    source: dict,
    note_number: int,
    *,
    author: Optional[str] = None,
) -> str:
    """
    Format a shortened subsequent-citation note.

    Args:
        source: Dict with keys: title, url.
        note_number: The footnote number.
        author: Author name if known.

    Returns:
        Shortened note, e.g.: 6. Last, "Short Title."
    """
    title = source.get("title", "Untitled")
    # Shorten title to first 4 words if long
    words = title.split()
    short_title = " ".join(words[:4]) + ("..." if len(words) > 4 else "")

    if author:
        _, last = _split_author(author)
        return f'{note_number}. {last}, "{short_title}."'
    else:
        return f'{note_number}. "{short_title}."'


def format_bibliography_entry(
    source: dict,
    *,
    author: Optional[str] = None,
    source_type: str = "web",
) -> str:
    """
    Format a bibliography entry in Chicago NB style.

    Args:
        source: Dict with keys: title, url, accessedAt, snippet (optional).
        author: Author name if known.
        source_type: One of 'web', 'government', 'vendor'.

    Returns:
        Bibliography entry string sorted by last name or title.
    """
    title = source.get("title", "Untitled")
    url = source.get("url", "")
    accessed_at = source.get("accessedAt", source.get("accessed_at", ""))
    date_str = _format_date(accessed_at) if accessed_at else ""
    site_name = _extract_site_name(url)

    if source_type == "government":
        org = author or site_name
        return f"{org}. *{title}*. {date_str}. {url}."

    if source_type == "vendor":
        org = author or site_name
        return f'{org}. "{title}." {date_str}. {url}.'

    # Web source
    if author:
        first, last = _split_author(author)
        if first:
            author_part = f"{last}, {first}"
        else:
            author_part = last
        return f'{author_part}. "{title}." {site_name}. {date_str}. {url}.'
    else:
        # No author — alphabetize by title
        return f'"{title}." {site_name}. Accessed {date_str}. {url}.'


def format_sources_as_bibliography(sources: list[dict]) -> list[str]:
    """
    Format a list of source dicts into sorted bibliography entries.

    Args:
        sources: List of source dicts (title, url, accessedAt).

    Returns:
        Alphabetically sorted list of bibliography entry strings.
    """
    entries = []
    for src in sources:
        entry = format_bibliography_entry(src)
        entries.append(entry)

    # Sort alphabetically (Chicago NB requires alpha by author/title)
    entries.sort(key=lambda e: e.lstrip('"').lower())
    return entries


def format_sources_as_endnotes(sources: list[dict]) -> list[str]:
    """
    Format sources as sequentially numbered endnotes.

    First occurrence of each source gets a full note;
    for simplicity, all are treated as first occurrences here.

    Args:
        sources: List of source dicts.

    Returns:
        List of formatted endnote strings.
    """
    notes = []
    for i, src in enumerate(sources, start=1):
        note = format_footnote(src, i)
        notes.append(note)
    return notes
