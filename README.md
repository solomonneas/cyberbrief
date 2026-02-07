<div align="center">

# 🛡️ CyberBRIEF

**AI-Powered Cyber Threat Intelligence Briefing Platform**

Transform any threat topic into a comprehensive BLUF-format intelligence report with MITRE ATT&CK mapping, IOC extraction, and multi-source research.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

![CyberBRIEF Dashboard](docs/screenshots/dashboard.png)

</div>

---

## ✨ Features

- **Multi-Source Research** — Aggregates intelligence from Brave Search, Perplexity Sonar, and Google Gemini across three research tiers (Free, Standard, Deep)
- **BLUF-Format Reports** — Bottom Line Up Front intelligence briefings following professional CTI standards
- **MITRE ATT&CK Mapping** — Automatic technique identification with interactive matrix explorer and Navigator layer export
- **IOC Extraction** — Regex-based extraction of IPv4/IPv6 addresses, domains, hashes (MD5/SHA1/SHA256), CVEs, and URLs
- **5 Visual Themes** — SOC Operator, Intelligence Agency, Threat Hunter, Academic Research, and Cyberpunk Analyst
- **TLP Classification** — Traffic Light Protocol marking from CLEAR through RED
- **Confidence Scoring** — Source-based confidence assessment (Low / Moderate / High) for each finding
- **Chicago NB Citations** — Properly formatted endnotes and bibliography
- **Export Options** — HTML and Markdown report export, plus ATT&CK Navigator JSON layers
- **BYOK Architecture** — Bring your own API keys; credentials stored locally in-browser

## 🏗️ Architecture

```
┌──────────────────────────────────────────────┐
│           React Frontend (Vite + TS)         │
│  Topic Input → Tier Selection → Report View  │
│  ATT&CK Explorer · History · 5 Variants     │
└──────────────────┬───────────────────────────┘
                   │ HTTP / JSON
┌──────────────────▼───────────────────────────┐
│           FastAPI Backend (Python)            │
│  ┌────────────┐ ┌──────────┐ ┌────────────┐  │
│  │  Research   │ │  Report  │ │  ATT&CK    │  │
│  │  Engine     │ │ Generator│ │  Mapper    │  │
│  │            │ │          │ │            │  │
│  │ Brave API  │ │ BLUF fmt │ │ Navigator  │  │
│  │ Gemini API │ │ IOC ext  │ │ Layer JSON │  │
│  │ Perplexity │ │ Chicago  │ │ Technique  │  │
│  │            │ │ NB cites │ │ Lookup     │  │
│  └────────────┘ └──────────┘ └────────────┘  │
└──────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18 and **npm** ≥ 9
- **Python** ≥ 3.11 and **pip**
- API keys (optional — Free tier works with Brave + Gemini keys, or configure via Settings UI)

### Clone & Install

```bash
git clone https://github.com/yourusername/cyberbrief.git
cd cyberbrief
```

### Backend

```bash
cd backend
pip install -r requirements.txt

# Optional: set API keys via environment
export BRAVE_API_KEY=your_brave_key
export GEMINI_API_KEY=your_gemini_key
export PERPLEXITY_API_KEY=your_perplexity_key

uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) → pick a variant → start researching.

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | UI components & routing |
| **Build** | Vite | Dev server & bundling |
| **Styling** | Tailwind CSS | Utility-first styling |
| **State** | Zustand | Lightweight state management |
| **Routing** | React Router v6 | SPA navigation |
| **Backend** | FastAPI (Python) | REST API server |
| **Validation** | Pydantic | Request/response models |
| **HTTP** | httpx | Async API client |
| **Server** | Uvicorn | ASGI server |

## 📁 Project Structure

```
cyberbrief/
├── frontend/
│   ├── src/
│   │   ├── api/            # API client (httpx wrapper)
│   │   ├── components/     # Navbar, Layout, StatusBar, GuidedTour
│   │   ├── context/        # ThemeContext (variant theming)
│   │   ├── pages/          # HomePage, ReportPage, AttackPage, HistoryPage,
│   │   │                   #   SettingsPage, VariantPicker, DocsPage
│   │   ├── stores/         # Zustand stores (report, research, settings)
│   │   ├── types/          # TypeScript type definitions
│   │   └── variants/       # 5 variant shell components
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.ts
├── backend/
│   ├── main.py             # FastAPI app & endpoints
│   ├── models.py           # Pydantic models
│   ├── research/           # Brave, Gemini, Perplexity engines
│   ├── report/             # BLUF generator, IOC extractor, Chicago formatter
│   ├── attack/             # ATT&CK mapper & Navigator layer builder
│   └── export/             # HTML & Markdown exporters
├── BLUF_STYLE_GUIDE.md
├── CITATION_STYLE.md
└── README.md
```

## 🎨 Interface Variants

| # | Name | Description |
|---|------|-------------|
| 1 | **SOC Operator** | Terminal-inspired dark theme with green accents, monospace fonts, and scan-line effects |
| 2 | **Intelligence Agency** | Formal navy-and-cream palette with serif typography and classification banners |
| 3 | **Threat Hunter** | Aggressive dark theme with red tactical accents and military-inspired styling |
| 4 | **Academic Research** | Clean light theme with serif headings, journal-article layout, and wide margins |
| 5 | **Cyberpunk Analyst** | Neon-soaked dark theme with cyan/magenta accents, glitch effects, and animated grid |

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/research` | Run multi-source research on a topic |
| `POST` | `/api/report/generate` | Generate BLUF report from research bundle |
| `GET` | `/api/attack/lookup` | Look up ATT&CK technique by ID or name |
| `POST` | `/api/attack/navigator` | Generate ATT&CK Navigator layer JSON |
| `POST` | `/api/export/html` | Export report as styled HTML |
| `POST` | `/api/export/markdown` | Export report as Markdown |
| `GET` | `/api/health` | Health check |

## 🔑 Research Tiers

| Tier | Sources | Model | Cost |
|------|---------|-------|------|
| **Free** | Brave Search | Gemini 2.0 Flash | Free (rate-limited) |
| **Standard** | Perplexity Sonar | Built-in | Per-query |
| **Deep** | Perplexity Deep Research | Built-in | Per-query |

## 📄 License

This project is licensed under the [MIT License](LICENSE).
