"""ATT&CK Navigator layer generator.

Produces JSON layers compatible with the MITRE ATT&CK Navigator:
https://mitre-attack.github.io/attack-navigator/
"""

from __future__ import annotations

from models import AttackTechnique


# ─── Tactic-to-color mapping for visual differentiation ──────────────────────

_TACTIC_COLORS: dict[str, str] = {
    "reconnaissance": "#6baed6",
    "resource-development": "#74c476",
    "initial-access": "#e6550d",
    "execution": "#fd8d3c",
    "persistence": "#fdae6b",
    "privilege-escalation": "#fdd0a2",
    "defense-evasion": "#c6dbef",
    "credential-access": "#e7969c",
    "discovery": "#9ecae1",
    "lateral-movement": "#a1d99b",
    "collection": "#bcbddc",
    "command-and-control": "#d9d9d9",
    "exfiltration": "#ff9896",
    "impact": "#e60d0d",
}

_DEFAULT_COLOR = "#e60d0d"


def _normalize_tactic(tactic: str) -> str:
    """Normalize a tactic name to the kebab-case used by Navigator."""
    return tactic.strip().lower().replace(" ", "-").replace("&", "and")


def generate_navigator_layer(
    techniques: list[AttackTechnique],
    report_topic: str,
) -> dict:
    """
    Generate an ATT&CK Navigator-compatible JSON layer.

    Args:
        techniques: List of AttackTechnique objects to include.
        report_topic: The report topic, used for layer name/description.

    Returns:
        Dict conforming to ATT&CK Navigator layer schema (v4.5).
        Importable at https://mitre-attack.github.io/attack-navigator/
    """
    layer_techniques = []
    for tech in techniques:
        tactic_key = _normalize_tactic(tech.tactic)

        # Build a comment from evidence quotes
        comment_parts = []
        for ev in tech.evidence:
            comment_parts.append(f'"{ev.quote}" — {ev.source}')
        comment = "\n".join(comment_parts) if comment_parts else tech.description

        color = _TACTIC_COLORS.get(tactic_key, _DEFAULT_COLOR)

        layer_techniques.append(
            {
                "techniqueID": tech.technique_id,
                "tactic": tactic_key,
                "color": color,
                "comment": comment,
                "enabled": True,
                "metadata": [],
                "links": [],
                "showSubtechniques": False,
                "score": 100,
            }
        )

    layer = {
        "name": f"CyberBRIEF — {report_topic}",
        "versions": {
            "attack": "15",
            "navigator": "5.0.1",
            "layer": "4.5",
        },
        "domain": "enterprise-attack",
        "description": f"Auto-generated ATT&CK layer for: {report_topic}",
        "filters": {
            "platforms": [
                "Linux",
                "macOS",
                "Windows",
                "Network",
                "PRE",
                "Containers",
                "Office 365",
                "SaaS",
                "Google Workspace",
                "IaaS",
                "Azure AD",
            ]
        },
        "sorting": 0,
        "layout": {
            "layout": "side",
            "aggregateFunction": "average",
            "showID": True,
            "showName": True,
            "showAggregateScores": False,
            "countUnscored": False,
        },
        "hideDisabled": False,
        "techniques": layer_techniques,
        "gradient": {
            "colors": ["#ffffff", "#e60d0d"],
            "minValue": 0,
            "maxValue": 100,
        },
        "legendItems": [
            {
                "label": "Observed in report",
                "color": "#e60d0d",
            }
        ],
        "metadata": [],
        "links": [],
        "showTacticRowBackground": True,
        "tacticRowBackground": "#212121",
        "selectTechniquesAcrossTactics": True,
        "selectSubtechniquesWithParent": False,
        "selectVisibleTechniques": False,
    }

    return layer
