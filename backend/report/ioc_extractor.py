"""IOC (Indicator of Compromise) extraction from text using regex patterns."""

from __future__ import annotations

import re
import logging
from typing import Optional

from models import IOC, IOCType

logger = logging.getLogger(__name__)

# ─── Regex Patterns ───────────────────────────────────────────────────────────

# IPv4: dotted quad with octet validation
IPV4_RE = re.compile(
    r"\b(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}"
    r"(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\b"
)

# IPv6: simplified but covers common formats
IPV6_RE = re.compile(
    r"\b(?:"
    r"(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|"  # Full
    r"(?:[0-9a-fA-F]{1,4}:){1,7}:|"  # Trailing ::
    r"(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|"  # :: in middle
    r"::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}|"  # Leading ::
    r"fe80:(?::[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]+|"  # Link-local
    r"::(?:ffff(?::0{1,4})?:)?(?:(?:25[0-5]|(?:2[0-4]|1?[0-9])?[0-9])\.){3}"
    r"(?:25[0-5]|(?:2[0-4]|1?[0-9])?[0-9])"  # IPv4-mapped
    r")\b"
)

# URLs: http/https
URL_RE = re.compile(
    r"https?://[^\s<>\"')\]},;]+",
    re.IGNORECASE,
)

# Domains: basic domain pattern (exclude common false positives)
DOMAIN_RE = re.compile(
    r"\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+(?:com|net|org|io|ru|cn|de|uk|co|info|biz|xyz|top|cc|tk|ml|ga|cf|gq|pw|onion|gov|mil|edu)\b",
    re.IGNORECASE,
)

# Hashes
MD5_RE = re.compile(r"\b[a-fA-F0-9]{32}\b")
SHA1_RE = re.compile(r"\b[a-fA-F0-9]{40}\b")
SHA256_RE = re.compile(r"\b[a-fA-F0-9]{64}\b")

# CVE IDs
CVE_RE = re.compile(r"\bCVE-\d{4}-\d{4,}\b", re.IGNORECASE)

# Known false-positive domains to exclude
EXCLUDED_DOMAINS = {
    "example.com",
    "example.org",
    "example.net",
    "localhost.com",
    "schema.org",
    "w3.org",
    "google.com",
    "github.com",
    "wikipedia.org",
    "microsoft.com",
    "apple.com",
    "mozilla.org",
}

# Known false-positive IPs
EXCLUDED_IPS = {
    "0.0.0.0",
    "127.0.0.1",
    "255.255.255.255",
    "1.1.1.1",
    "8.8.8.8",
    "8.8.4.4",
}


def _get_context(text: str, match_start: int, match_end: int, window: int = 100) -> str:
    """Extract surrounding context (sentence-level) for an IOC match."""
    # Look for sentence boundaries
    start = max(0, match_start - window)
    end = min(len(text), match_end + window)

    # Try to find sentence boundaries
    snippet = text[start:end].strip()

    # Find first sentence start
    for char in (".", "!", "?", "\n"):
        idx = snippet.find(char)
        if idx != -1 and idx < match_start - start:
            snippet = snippet[idx + 1 :].strip()
            break

    # Find last sentence end
    for char in (".", "!", "?", "\n"):
        idx = snippet.rfind(char)
        if idx != -1 and idx > 0:
            snippet = snippet[: idx + 1].strip()
            break

    return snippet[:200]  # Cap at 200 chars


def extract_iocs(text: str) -> list[IOC]:
    """
    Extract and deduplicate IOCs from text.

    Extracts:
    - IPv4 addresses (with octet validation)
    - IPv6 addresses
    - Domains
    - URLs
    - MD5, SHA1, SHA256 hashes
    - CVE identifiers

    Returns:
        Deduplicated list of IOC objects with context.
    """
    seen: set[tuple[str, str]] = set()
    iocs: list[IOC] = []

    def _add(ioc_type: IOCType, value: str, context: Optional[str] = None) -> None:
        key = (ioc_type.value, value)
        if key not in seen:
            seen.add(key)
            iocs.append(
                IOC(type=ioc_type, value=value, context=context, sources=[])
            )

    # Extract SHA256 first (longest hash, to avoid partial matches)
    for m in SHA256_RE.finditer(text):
        value = m.group().lower()
        ctx = _get_context(text, m.start(), m.end())
        _add(IOCType.SHA256, value, ctx)

    # SHA1 — skip if already captured as part of SHA256
    for m in SHA1_RE.finditer(text):
        value = m.group().lower()
        if not any(value in ioc.value for ioc in iocs if ioc.type == IOCType.SHA256):
            ctx = _get_context(text, m.start(), m.end())
            _add(IOCType.SHA1, value, ctx)

    # MD5 — skip if already captured as part of longer hash
    for m in MD5_RE.finditer(text):
        value = m.group().lower()
        if not any(
            value in ioc.value
            for ioc in iocs
            if ioc.type in (IOCType.SHA256, IOCType.SHA1)
        ):
            ctx = _get_context(text, m.start(), m.end())
            _add(IOCType.MD5, value, ctx)

    # CVE IDs
    for m in CVE_RE.finditer(text):
        value = m.group().upper()
        ctx = _get_context(text, m.start(), m.end())
        _add(IOCType.CVE, value, ctx)

    # IPv4
    for m in IPV4_RE.finditer(text):
        value = m.group()
        if value not in EXCLUDED_IPS:
            ctx = _get_context(text, m.start(), m.end())
            _add(IOCType.IPV4, value, ctx)

    # IPv6
    for m in IPV6_RE.finditer(text):
        value = m.group().lower()
        ctx = _get_context(text, m.start(), m.end())
        _add(IOCType.IPV6, value, ctx)

    # URLs
    for m in URL_RE.finditer(text):
        value = m.group().rstrip(".,;:)")
        ctx = _get_context(text, m.start(), m.end())
        _add(IOCType.URL, value, ctx)

    # Domains (skip if part of already-extracted URL)
    extracted_urls = {ioc.value for ioc in iocs if ioc.type == IOCType.URL}
    for m in DOMAIN_RE.finditer(text):
        value = m.group().lower().rstrip(".")
        if value not in EXCLUDED_DOMAINS:
            # Check if this domain is part of an already-extracted URL
            in_url = any(value in url for url in extracted_urls)
            if not in_url:
                ctx = _get_context(text, m.start(), m.end())
                _add(IOCType.DOMAIN, value, ctx)

    logger.info("Extracted %d IOCs from text (%d chars)", len(iocs), len(text))
    return iocs
