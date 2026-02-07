"""HTML exporter — renders a Report as a self-contained HTML page.

Produces a dark-themed, print-friendly HTML document with inline CSS,
TLP banner, all report sections, footnotes, bibliography, IOC table,
ATT&CK technique table, and confidence assessments.
"""

from __future__ import annotations

import html
from datetime import datetime

from models import Report, TLPLevel
from report.chicago_formatter import (
    format_footnote,
    format_bibliography_entry,
)


# ─── TLP Config ───────────────────────────────────────────────────────────────

_TLP_CONFIG: dict[TLPLevel, dict] = {
    TLPLevel.CLEAR: {
        "label": "TLP:CLEAR",
        "text": "Disclosure is not limited.",
        "color": "#22c55e",
        "bg": "rgba(34, 197, 94, 0.1)",
        "border": "rgba(34, 197, 94, 0.3)",
    },
    TLPLevel.GREEN: {
        "label": "TLP:GREEN",
        "text": "Limited disclosure, community only.",
        "color": "#22c55e",
        "bg": "rgba(34, 197, 94, 0.1)",
        "border": "rgba(34, 197, 94, 0.3)",
    },
    TLPLevel.AMBER: {
        "label": "TLP:AMBER",
        "text": "Limited disclosure, restricted to participants' organizations.",
        "color": "#f59e0b",
        "bg": "rgba(245, 158, 11, 0.1)",
        "border": "rgba(245, 158, 11, 0.3)",
    },
    TLPLevel.AMBER_STRICT: {
        "label": "TLP:AMBER+STRICT",
        "text": "Limited disclosure, restricted to participants only.",
        "color": "#f59e0b",
        "bg": "rgba(245, 158, 11, 0.1)",
        "border": "rgba(245, 158, 11, 0.3)",
    },
    TLPLevel.RED: {
        "label": "TLP:RED",
        "text": "Not for disclosure. Restricted to participants only.",
        "color": "#ef4444",
        "bg": "rgba(239, 68, 68, 0.1)",
        "border": "rgba(239, 68, 68, 0.3)",
    },
}


def _esc(text: str) -> str:
    """HTML-escape a string."""
    return html.escape(text, quote=True)


def export_html(report: Report) -> str:
    """
    Export a Report object as a self-contained HTML page.

    Features:
    - Dark theme with inline CSS
    - TLP banner at top and bottom
    - All report sections with footnote references
    - IOC table
    - ATT&CK technique table
    - Confidence assessments
    - Endnotes and bibliography
    - Print-friendly @media rules

    Args:
        report: The Report object to export.

    Returns:
        Complete HTML string.
    """
    tlp = _TLP_CONFIG.get(report.tlp, _TLP_CONFIG[TLPLevel.GREEN])

    parts: list[str] = []

    # ── HTML Head ─────────────────────────────────────────────────────────
    parts.append(f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{_esc(report.topic)} — CyberBRIEF</title>
<style>
  :root {{
    --bg-primary: #0f1117;
    --bg-secondary: #1a1d27;
    --bg-tertiary: #252830;
    --text-primary: #e5e7eb;
    --text-secondary: #9ca3af;
    --text-muted: #6b7280;
    --accent: #06b6d4;
    --accent-dim: rgba(6, 182, 212, 0.15);
    --border: #374151;
    --tlp-color: {tlp['color']};
    --tlp-bg: {tlp['bg']};
    --tlp-border: {tlp['border']};
  }}

  * {{ margin: 0; padding: 0; box-sizing: border-box; }}

  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.7;
    padding: 2rem;
    max-width: 900px;
    margin: 0 auto;
  }}

  .tlp-banner {{
    background: var(--tlp-bg);
    border: 1px solid var(--tlp-border);
    color: var(--tlp-color);
    padding: 0.75rem 1rem;
    border-radius: 8px;
    text-align: center;
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 2rem;
  }}

  .report-header {{
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 1.5rem;
  }}

  h1 {{
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }}

  .meta {{
    font-size: 0.85rem;
    color: var(--text-muted);
  }}

  .meta code {{
    font-size: 0.75rem;
    color: var(--text-muted);
    background: var(--bg-tertiary);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
  }}

  .bluf {{
    background: var(--accent-dim);
    border: 1px solid rgba(6, 182, 212, 0.25);
    border-radius: 8px;
    padding: 1rem 1.25rem;
    margin-top: 1.5rem;
  }}

  .bluf-label {{
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 0.4rem;
  }}

  .bluf p {{
    color: var(--text-primary);
    line-height: 1.6;
  }}

  .section {{
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem 2rem;
    margin-bottom: 1rem;
  }}

  h2 {{
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border);
  }}

  .section-content {{
    color: var(--text-secondary);
    line-height: 1.8;
    white-space: pre-wrap;
  }}

  .footnote-ref {{
    color: var(--accent);
    font-size: 0.7rem;
    vertical-align: super;
    text-decoration: none;
    cursor: pointer;
  }}

  .footnote-ref:hover {{ text-decoration: underline; }}

  /* Tables */
  table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }}

  th {{
    text-align: left;
    padding: 0.6rem 0.8rem;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border);
    font-weight: 600;
    font-size: 0.8rem;
  }}

  td {{
    padding: 0.6rem 0.8rem;
    border-bottom: 1px solid rgba(55, 65, 81, 0.3);
    color: var(--text-secondary);
    vertical-align: top;
  }}

  .ioc-type {{
    display: inline-block;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-family: monospace;
    text-transform: uppercase;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
  }}

  .ioc-value {{
    font-family: monospace;
    color: var(--accent);
    font-size: 0.8rem;
    word-break: break-all;
  }}

  .attack-id {{
    font-family: monospace;
    font-size: 0.85rem;
    color: var(--accent);
    text-decoration: none;
  }}

  .attack-id:hover {{ text-decoration: underline; }}

  .tactic-badge {{
    display: inline-block;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    font-size: 0.7rem;
    background: var(--bg-tertiary);
    color: var(--text-muted);
    border: 1px solid var(--border);
  }}

  .evidence-block {{
    margin-top: 0.4rem;
    padding-left: 0.75rem;
    border-left: 2px solid rgba(6, 182, 212, 0.3);
    font-size: 0.8rem;
  }}

  .evidence-quote {{
    color: var(--text-secondary);
    font-style: italic;
  }}

  .evidence-source {{
    color: var(--text-muted);
    font-size: 0.75rem;
  }}

  .confidence-row {{
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 6px;
    background: rgba(37, 40, 48, 0.5);
    margin-bottom: 0.5rem;
  }}

  .conf-badge {{
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    flex-shrink: 0;
  }}

  .conf-high {{ background: rgba(34, 197, 94, 0.1); color: #22c55e; }}
  .conf-moderate {{ background: rgba(245, 158, 11, 0.1); color: #f59e0b; }}
  .conf-low {{ background: rgba(239, 68, 68, 0.1); color: #ef4444; }}

  .endnote {{
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-bottom: 0.6rem;
    padding-left: 1.5rem;
    text-indent: -1.5rem;
  }}

  .endnote a {{
    color: var(--accent);
    text-decoration: none;
    word-break: break-all;
  }}

  .endnote a:hover {{ text-decoration: underline; }}

  .bib-entry {{
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-bottom: 0.8rem;
    padding-left: 2rem;
    text-indent: -2rem;
  }}

  .bib-entry a {{
    color: var(--accent);
    text-decoration: none;
    word-break: break-all;
  }}

  .bib-entry a:hover {{ text-decoration: underline; }}

  .ta-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem 1.5rem;
    font-size: 0.9rem;
  }}

  .ta-label {{ color: var(--text-muted); }}
  .ta-value {{ color: var(--text-primary); }}

  .tool-tag {{
    display: inline-block;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid var(--border);
    margin: 0.15rem 0.15rem 0 0;
  }}

  .footer {{
    text-align: center;
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }}

  /* Print styles */
  @media print {{
    body {{
      background: #fff;
      color: #1a1a1a;
      padding: 1rem;
      max-width: 100%;
    }}

    .tlp-banner {{
      background: #fff;
      border: 2px solid var(--tlp-color);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }}

    .report-header, .section {{
      background: #fff;
      border: 1px solid #ddd;
      break-inside: avoid;
    }}

    .bluf {{
      background: #f0f9ff;
      border: 1px solid #bae6fd;
    }}

    h1, h2 {{ color: #111; }}
    .section-content, td {{ color: #333; }}
    .meta, .ta-label, .tactic-badge {{ color: #666; }}

    .attack-id, .ioc-value, .endnote a, .bib-entry a, .footnote-ref {{
      color: #0369a1;
    }}

    table {{ font-size: 0.8rem; }}
    th {{ border-bottom: 2px solid #333; color: #333; }}
    td {{ border-bottom: 1px solid #ddd; }}
  }}
</style>
</head>
<body>
""")

    # ── TLP Banner ────────────────────────────────────────────────────────
    parts.append(f'<div class="tlp-banner">{_esc(tlp["label"])} — {_esc(tlp["text"])}</div>')

    # ── Header + BLUF ─────────────────────────────────────────────────────
    parts.append('<div class="report-header">')
    parts.append(f'<h1>{_esc(report.topic)}</h1>')
    parts.append(f'<p class="meta">Generated {_esc(report.created_at)} · {_esc(report.tier)} Tier · <code>{_esc(report.id)}</code></p>')
    parts.append('<div class="bluf">')
    parts.append('<div class="bluf-label">BLUF — Bottom Line Up Front</div>')
    parts.append(f'<p>{_esc(report.bluf)}</p>')
    parts.append('</div>')
    parts.append('</div>')

    # ── Threat Actor ──────────────────────────────────────────────────────
    if report.threat_actor:
        ta = report.threat_actor
        parts.append('<div class="section">')
        parts.append('<h2>Threat Actor Profile</h2>')
        parts.append('<div class="ta-grid">')
        parts.append(f'<span class="ta-label">Name</span><span class="ta-value">{_esc(ta.name)}</span>')
        parts.append(f'<span class="ta-label">Attribution</span><span class="ta-value">{_esc(ta.attribution)}</span>')
        if ta.aliases:
            parts.append(f'<span class="ta-label">Aliases</span><span class="ta-value">{_esc(", ".join(ta.aliases))}</span>')
        if ta.first_seen:
            parts.append(f'<span class="ta-label">First Seen</span><span class="ta-value">{_esc(ta.first_seen)}</span>')
        if ta.last_active:
            parts.append(f'<span class="ta-label">Last Active</span><span class="ta-value">{_esc(ta.last_active)}</span>')
        parts.append('</div>')
        if ta.tooling:
            parts.append('<div style="margin-top: 0.75rem;">')
            parts.append('<span class="ta-label">Tooling: </span>')
            for tool in ta.tooling:
                parts.append(f'<span class="tool-tag">{_esc(tool)}</span>')
            parts.append('</div>')
        parts.append('</div>')

    # ── Report Sections ───────────────────────────────────────────────────
    for section in report.sections:
        parts.append(f'<div class="section" id="{_esc(section.id)}">')
        parts.append(f'<h2>{_esc(section.title)}</h2>')
        content = _render_footnotes(section.content, section.citations)
        parts.append(f'<div class="section-content">{content}</div>')
        parts.append('</div>')

    # ── IOC Table ─────────────────────────────────────────────────────────
    if report.iocs:
        parts.append('<div class="section">')
        parts.append('<h2>Indicators of Compromise</h2>')
        parts.append('<table>')
        parts.append('<thead><tr><th>Type</th><th>Indicator</th><th>Context</th></tr></thead>')
        parts.append('<tbody>')
        for ioc in report.iocs:
            ioc_type = ioc.type.value.upper() if hasattr(ioc.type, "value") else str(ioc.type).upper()
            context = ioc.context or "—"
            parts.append(f'<tr><td><span class="ioc-type">{_esc(ioc_type)}</span></td>')
            parts.append(f'<td><span class="ioc-value">{_esc(ioc.value)}</span></td>')
            parts.append(f'<td>{_esc(context)}</td></tr>')
        parts.append('</tbody></table>')
        parts.append('</div>')

    # ── ATT&CK Mapping ────────────────────────────────────────────────────
    if report.attack_mapping:
        parts.append('<div class="section">')
        parts.append('<h2>MITRE ATT&CK Mapping</h2>')
        parts.append('<table>')
        parts.append('<thead><tr><th>Technique ID</th><th>Name</th><th>Tactic</th><th>Evidence</th></tr></thead>')
        parts.append('<tbody>')
        for tech in report.attack_mapping:
            tid = tech.technique_id
            url = f"https://attack.mitre.org/techniques/{tid.replace('.', '/')}"
            evidence_html = ""
            if tech.evidence:
                ev_parts = []
                for ev in tech.evidence:
                    ev_parts.append(
                        f'<div class="evidence-block">'
                        f'<span class="evidence-quote">&ldquo;{_esc(ev.quote)}&rdquo;</span>'
                        f'<br><span class="evidence-source">— {_esc(ev.source)}</span>'
                        f'</div>'
                    )
                evidence_html = "".join(ev_parts)
            else:
                evidence_html = f'<span style="color: var(--text-muted); font-size: 0.8rem;">{_esc(tech.description)}</span>'

            parts.append('<tr>')
            parts.append(f'<td><a class="attack-id" href="{_esc(url)}" target="_blank">{_esc(tid)}</a></td>')
            parts.append(f'<td>{_esc(tech.name)}</td>')
            parts.append(f'<td><span class="tactic-badge">{_esc(tech.tactic)}</span></td>')
            parts.append(f'<td>{evidence_html}</td>')
            parts.append('</tr>')
        parts.append('</tbody></table>')
        parts.append('</div>')

    # ── Confidence Assessments ────────────────────────────────────────────
    if report.confidence_assessments:
        parts.append('<div class="section">')
        parts.append('<h2>Confidence Assessments</h2>')
        for assessment in report.confidence_assessments:
            conf = assessment.confidence
            conf_str = conf.value if hasattr(conf, "value") else str(conf)
            conf_class = f"conf-{conf_str.lower()}"
            parts.append('<div class="confidence-row">')
            parts.append(f'<span class="conf-badge {conf_class}">{_esc(conf_str)}</span>')
            parts.append(f'<div><div style="color: var(--text-primary); font-size: 0.9rem;">{_esc(assessment.finding)}</div>')
            parts.append(f'<div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.25rem;">{_esc(assessment.rationale)}</div></div>')
            parts.append('</div>')
        parts.append('</div>')

    # ── Endnotes (Chicago NB formatted) ─────────────────────────────────
    parts.append('<div class="section">')
    parts.append('<h2>Endnotes</h2>')
    if report.footnotes:
        # Use pre-formatted Chicago NB footnotes from the generator
        for i, note in enumerate(report.footnotes, start=1):
            parts.append(
                f'<div class="endnote" id="endnote-{i}">{_esc(note)}</div>'
            )
    elif report.sources:
        # Fallback: generate Chicago footnotes from sources on the fly
        for i, src in enumerate(report.sources, start=1):
            src_dict = {
                "title": src.title,
                "url": src.url,
                "accessed_at": src.accessed_at,
            }
            note = format_footnote(src_dict, i)
            parts.append(
                f'<div class="endnote" id="endnote-{i}">{_esc(note)}</div>'
            )
    else:
        parts.append('<p style="color: var(--text-muted); font-size: 0.85rem;">No sources to cite.</p>')
    parts.append('</div>')

    # ── Bibliography (Chicago NB formatted) ───────────────────────────────
    parts.append('<div class="section">')
    parts.append('<h2>Bibliography</h2>')
    if report.bibliography:
        # Use pre-formatted and sorted bibliography from the generator
        for entry in report.bibliography:
            parts.append(f'<div class="bib-entry">{_esc(entry)}</div>')
    elif report.sources:
        # Fallback: generate bibliography entries from sources on the fly
        sorted_sources = sorted(report.sources, key=lambda s: s.title.lower())
        for src in sorted_sources:
            src_dict = {
                "title": src.title,
                "url": src.url,
                "accessed_at": src.accessed_at,
            }
            entry = format_bibliography_entry(src_dict)
            parts.append(f'<div class="bib-entry">{_esc(entry)}</div>')
    else:
        parts.append('<p style="color: var(--text-muted); font-size: 0.85rem;">No sources.</p>')
    parts.append('</div>')

    # ── TLP Footer Banner ─────────────────────────────────────────────────
    parts.append(f'<div class="tlp-banner">{_esc(tlp["label"])} — {_esc(tlp["text"])}</div>')

    # ── Footer ────────────────────────────────────────────────────────────
    parts.append(f'<div class="footer">Report generated by CyberBRIEF · {_esc(report.created_at)}</div>')

    parts.append('</body>\n</html>')

    return "\n".join(parts)


def _render_footnotes(content: str, citations: list[str]) -> str:
    """
    HTML-escape content and inject clickable footnote superscripts
    for any [N] citation patterns found.
    """
    import re

    escaped = _esc(content)

    # Replace [N] with clickable superscript
    def _replace_fn(match: re.Match) -> str:
        num = match.group(1)
        return f'<a class="footnote-ref" href="#endnote-{num}" title="See endnote {num}">[{num}]</a>'

    result = re.sub(r"\[(\d+)\]", _replace_fn, escaped)
    return result
