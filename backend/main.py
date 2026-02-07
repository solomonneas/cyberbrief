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
from export.html import export_html
from attack.mapper import lookup_technique as attack_lookup_technique, map_techniques_from_text
from attack.navigator import generate_navigator_layer

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

    Queries the local enterprise ATT&CK dataset by T-code or keyword.
    """
    logger.info("ATT&CK lookup query: %s", q)
    try:
        results = attack_lookup_technique(q)
        return [t.model_dump(by_alias=True) for t in results]
    except Exception as exc:
        logger.exception("ATT&CK lookup failed for query: %s", q)
        raise HTTPException(status_code=500, detail=f"ATT&CK lookup failed: {exc}")


@app.post("/api/attack/navigator")
async def attack_navigator(request: NavigatorRequest) -> dict:
    """
    Generate an ATT&CK Navigator layer JSON from a list of techniques.

    Returns a fully compliant Navigator layer importable at
    https://mitre-attack.github.io/attack-navigator/
    """
    techniques = request.techniques
    # Derive topic from first technique or default
    topic = "CyberBRIEF Report"
    layer = generate_navigator_layer(techniques, topic)
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


@app.post("/api/export/html")
async def export_html_endpoint(report_data: dict) -> PlainTextResponse:
    """
    Export a report as a self-contained HTML page.

    Accepts the full report JSON and returns HTML with inline CSS,
    dark theme, TLP banners, all sections, and print-friendly styles.
    """
    try:
        report = Report.model_validate(report_data)
        html_content = export_html(report)
        return PlainTextResponse(content=html_content, media_type="text/html")
    except Exception as exc:
        logger.exception("HTML export failed")
        raise HTTPException(status_code=500, detail=f"HTML export failed: {exc}")


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
