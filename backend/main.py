"""CyberBRIEF FastAPI application — threat intelligence research & reporting API."""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse

from models import (
    AttackTechnique,
    HealthResponse,
    NavigatorRequest,
    Report,
    ReportGenerateRequest,
    ResearchRequest,
    TLPLevel,
)
from research.engine import run_research
from report.generator import generate_report
from export.markdown import export_markdown

# ─── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="CyberBRIEF API",
    description="Automated cyber threat intelligence research and reporting.",
    version="0.1.0",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Health ───────────────────────────────────────────────────────────────────


@app.get("/api/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(status="ok", version="0.1.0")


# ─── Research ─────────────────────────────────────────────────────────────────


@app.post("/api/research")
async def research_endpoint(request: ResearchRequest) -> dict:
    """
    Run the research pipeline for a given topic and tier.

    Returns a ResearchBundle with search results, synthesized content,
    extracted IOCs, and suggested ATT&CK techniques.
    """
    try:
        bundle = await run_research(
            topic=request.topic,
            tier=request.tier,
            api_keys=request.api_keys,
        )
        return bundle.model_dump(by_alias=True)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.exception("Research pipeline failed for topic: %s", request.topic)
        raise HTTPException(status_code=500, detail=f"Research failed: {exc}")


# ─── Report Generation ───────────────────────────────────────────────────────


@app.post("/api/report/generate")
async def report_generate_endpoint(request: ReportGenerateRequest) -> dict:
    """
    Generate a structured intelligence report from a research bundle.

    Returns a full Report with BLUF, sections, IOCs, ATT&CK mapping,
    confidence assessments, and Chicago NB citations.
    """
    try:
        # Extract report type and TLP from settings if provided
        report_type = "full"
        tlp = TLPLevel.GREEN
        if request.settings:
            report_type = request.settings.get("reportType", "full")
            tlp_raw = request.settings.get("defaultTlp")
            if tlp_raw:
                try:
                    tlp = TLPLevel(tlp_raw)
                except ValueError:
                    pass

        report = await generate_report(
            bundle=request.bundle,
            report_type=report_type,
            tlp=tlp,
        )
        return report.model_dump(by_alias=True)
    except Exception as exc:
        logger.exception("Report generation failed")
        raise HTTPException(status_code=500, detail=f"Report generation failed: {exc}")


# ─── ATT&CK ──────────────────────────────────────────────────────────────────


@app.get("/api/attack/lookup")
async def attack_lookup(q: str = Query(..., description="Technique name or ID to search")) -> list[dict]:
    """
    Look up MITRE ATT&CK techniques by name or ID.

    Stub implementation — returns empty results for now.
    Full implementation will query a local ATT&CK STIX dataset.
    """
    logger.info("ATT&CK lookup query: %s", q)
    # Stub: return empty list until ATT&CK data integration
    return []


@app.post("/api/attack/navigator")
async def attack_navigator(request: NavigatorRequest) -> dict:
    """
    Generate an ATT&CK Navigator layer JSON from a list of techniques.

    Stub implementation — returns a minimal valid Navigator layer.
    """
    techniques = request.techniques
    layer = {
        "name": "CyberBRIEF Report Layer",
        "versions": {
            "attack": "14",
            "navigator": "4.9.1",
            "layer": "4.5",
        },
        "domain": "enterprise-attack",
        "description": "Auto-generated from CyberBRIEF report",
        "sorting": 0,
        "layout": {
            "layout": "side",
            "aggregateFunction": "average",
            "showID": True,
            "showName": True,
        },
        "hideDisabled": False,
        "techniques": [
            {
                "techniqueID": t.technique_id,
                "tactic": t.tactic.lower().replace(" ", "-"),
                "color": "#e60d0d",
                "comment": t.description,
                "enabled": True,
                "score": 100,
            }
            for t in techniques
        ],
        "gradient": {
            "colors": ["#ffffff", "#e60d0d"],
            "minValue": 0,
            "maxValue": 100,
        },
    }
    return layer


# ─── Export ───────────────────────────────────────────────────────────────────


@app.post("/api/export/markdown")
async def export_markdown_endpoint(report_data: dict) -> PlainTextResponse:
    """
    Export a report as formatted Markdown.

    Accepts the full report JSON and returns Markdown text with
    TLP banner, sections, footnotes, endnotes, and bibliography.
    """
    try:
        report = Report.model_validate(report_data)
        md = export_markdown(report)
        return PlainTextResponse(content=md, media_type="text/markdown")
    except Exception as exc:
        logger.exception("Markdown export failed")
        raise HTTPException(status_code=500, detail=f"Markdown export failed: {exc}")


@app.post("/api/export/pdf")
async def export_pdf_endpoint(report_data: dict) -> JSONResponse:
    """
    Export a report as PDF.

    Stub implementation — PDF generation requires additional dependencies
    (weasyprint or similar). Returns a placeholder response.
    """
    return JSONResponse(
        status_code=501,
        content={
            "detail": "PDF export is not yet implemented. Use Markdown export and convert externally.",
            "suggestion": "pandoc -f markdown -t pdf report.md -o report.pdf",
        },
    )


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
