"""MITRE ATT&CK technique mapping from text and research data.

Provides lookup, text-based extraction (regex T-codes + keyword matching),
and evidence enrichment against a local enterprise ATT&CK dataset.
"""

from __future__ import annotations

import json
import re
import threading
from pathlib import Path
from typing import Optional

from models import AttackTechnique, Evidence

# ─── Load local dataset ──────────────────────────────────────────────────────

_DATA_PATH = Path(__file__).parent / "enterprise_attack.json"
_TECHNIQUE_DB: list[dict] = []
_DB_LOCK = threading.Lock()


def _load_db() -> list[dict]:
    """Lazy-load the enterprise ATT&CK technique database."""
    global _TECHNIQUE_DB
    if not _TECHNIQUE_DB:
        with _DB_LOCK:
            if not _TECHNIQUE_DB:
                with open(_DATA_PATH, "r", encoding="utf-8") as f:
                    _TECHNIQUE_DB = json.load(f)
    return _TECHNIQUE_DB


# ─── T-code regex ─────────────────────────────────────────────────────────────

_TCODE_RE = re.compile(r"\bT\d{4}(?:\.\d{3})?\b")


# ─── Public API ───────────────────────────────────────────────────────────────


def lookup_technique(query: str) -> list[AttackTechnique]:
    """
    Search for ATT&CK techniques by T-code or keyword.

    Args:
        query: A technique ID (e.g. "T1059") or keyword (e.g. "phishing").

    Returns:
        List of matching AttackTechnique objects.
    """
    db = _load_db()
    query_upper = query.strip().upper()
    query_lower = query.strip().lower()
    results: list[AttackTechnique] = []

    for entry in db:
        tid = entry["techniqueId"]
        name = entry["name"]

        # Exact T-code match
        if query_upper == tid.upper():
            results.append(_entry_to_technique(entry))
            continue

        # Partial T-code match (e.g. "T1059" matches "T1059.001")
        if _TCODE_RE.match(query_upper) and tid.upper().startswith(query_upper):
            results.append(_entry_to_technique(entry))
            continue

        # Keyword match in name or description
        if query_lower in name.lower() or query_lower in entry.get("description", "").lower():
            results.append(_entry_to_technique(entry))

    return results


def map_techniques_from_text(text: str) -> list[AttackTechnique]:
    """
    Extract ATT&CK techniques from free text using T-code regex
    and keyword matching against technique names.

    Args:
        text: Free-form text (research content, report body, etc.).

    Returns:
        Deduplicated list of identified AttackTechnique objects.
    """
    db = _load_db()
    found: dict[str, AttackTechnique] = {}

    # 1. Regex-based T-code extraction
    tcodes = set(_TCODE_RE.findall(text))
    for tcode in tcodes:
        for entry in db:
            if entry["techniqueId"].upper() == tcode.upper():
                found[entry["techniqueId"]] = _entry_to_technique(entry)

    # 2. Keyword matching — look for technique names in the text
    text_lower = text.lower()
    for entry in db:
        tid = entry["techniqueId"]
        if tid in found:
            continue
        name_lower = entry["name"].lower()
        # Require the full technique name to appear (case-insensitive)
        # Skip very short names (< 6 chars) to avoid false positives
        if len(name_lower) >= 6 and name_lower in text_lower:
            found[tid] = _entry_to_technique(entry)

    return list(found.values())


def enrich_attack_mapping(
    techniques: list[AttackTechnique],
    research_text: str,
) -> list[AttackTechnique]:
    """
    Enrich existing technique mappings with evidence quotes from research text.

    For each technique, searches the research text for sentences mentioning
    the technique by ID or name, and attaches them as Evidence objects.

    Args:
        techniques: List of techniques to enrich.
        research_text: Full research/synthesis text to extract quotes from.

    Returns:
        The same techniques with evidence lists populated.
    """
    # Split text into sentences for quote extraction
    sentences = _split_sentences(research_text)

    enriched: list[AttackTechnique] = []
    for tech in techniques:
        evidence: list[Evidence] = list(tech.evidence)  # preserve existing
        tid = tech.technique_id
        name_lower = tech.name.lower()

        for sentence in sentences:
            sentence_stripped = sentence.strip()
            if not sentence_stripped or len(sentence_stripped) < 20:
                continue

            sentence_lower = sentence_stripped.lower()
            # Check if this sentence references the technique
            if tid in sentence_stripped or (len(name_lower) >= 6 and name_lower in sentence_lower):
                # Avoid duplicate quotes
                if not any(e.quote == sentence_stripped for e in evidence):
                    evidence.append(
                        Evidence(quote=sentence_stripped, source="Research synthesis")
                    )
                    # Cap at 3 evidence quotes per technique
                    if len(evidence) >= 3:
                        break

        enriched.append(
            AttackTechnique(
                techniqueId=tech.technique_id,
                name=tech.name,
                tactic=tech.tactic,
                description=tech.description,
                evidence=evidence,
            )
        )

    return enriched


# ─── Helpers ──────────────────────────────────────────────────────────────────


def _entry_to_technique(entry: dict) -> AttackTechnique:
    """Convert a raw JSON entry to an AttackTechnique model."""
    return AttackTechnique(
        techniqueId=entry["techniqueId"],
        name=entry["name"],
        tactic=entry["tactic"],
        description=entry.get("description", ""),
        evidence=[],
    )


def _split_sentences(text: str) -> list[str]:
    """Split text into sentences on period/exclamation/question boundaries."""
    # Split on sentence-ending punctuation followed by space or newline
    parts = re.split(r"(?<=[.!?])\s+", text)
    return [p.strip() for p in parts if p.strip()]
