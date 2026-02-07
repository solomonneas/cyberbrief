# CyberBRIEF

**Automated Cyber Intelligence Research Platform**

CyberBRIEF transforms a simple threat topic into a comprehensive BLUF-format intelligence report with MITRE ATT&CK mapping, IOC extraction, victimology analysis, remediation guidance, and fully-sourced citations.

## Features

- **Multi-Tier Research**: FREE (Brave + Gemini Flash), STANDARD (Perplexity Sonar), and DEEP (Perplexity Deep Research)
- **BLUF-Format Reports**: Bottom Line Up Front intelligence briefings
- **MITRE ATT&CK Mapping**: Automatic technique identification with Navigator layer export
- **IOC Extraction**: Regex-based extraction of IPs, domains, hashes, CVEs, and URLs
- **TLP Marking**: Traffic Light Protocol classification (CLEAR through RED)
- **Confidence Assessment**: Source-based confidence scoring for each finding
- **BYOK (Bring Your Own Key)**: Use your own API keys for all services
- **5 Design Variants**: Multiple UI layouts to choose from
- **Export**: PDF and Markdown report export

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Zustand (state management)
- React Router v6 (routing)

### Backend
- FastAPI (Python)
- Pydantic (data validation)
- httpx (async HTTP client)
- uvicorn (ASGI server)

## Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Environment Variables

```bash
# Optional - can also be set via Settings UI (BYOK)
BRAVE_API_KEY=your_brave_search_key
GEMINI_API_KEY=your_gemini_key
PERPLEXITY_API_KEY=your_perplexity_key
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend (React)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Zustand  │ │  Router  │ │  5 Design Variants│ │
│  │  Stores   │ │  (SPA)   │ │  /1 /2 /3 /4 /5  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└─────────────────────┬───────────────────────────┘
                      │ HTTP/JSON
┌─────────────────────▼───────────────────────────┐
│                Backend (FastAPI)                  │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐ │
│  │  Research   │ │   Report   │ │   ATT&CK     │ │
│  │  Engine     │ │  Generator │ │   Mapper     │ │
│  ├────────────┤ ├────────────┤ ├──────────────┤ │
│  │ Brave API  │ │ IOC Extract│ │  Navigator   │ │
│  │ Gemini API │ │ Confidence │ │  Layer JSON  │ │
│  │ Perplexity │ │ Sections   │ │  Lookup      │ │
│  └────────────┘ └────────────┘ └──────────────┘ │
└─────────────────────────────────────────────────┘
```

## Research Tiers

| Tier | Source | Model | Cost |
|------|--------|-------|------|
| FREE | Brave Search | Gemini 2.0 Flash | Free (rate limited) |
| STANDARD | Perplexity Sonar | Built-in | Per-query |
| DEEP | Perplexity Deep Research | Built-in | Per-query |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/research` | Run research on a topic |
| POST | `/api/report/generate` | Generate report from research |
| GET | `/api/attack/lookup` | Look up ATT&CK technique |
| POST | `/api/attack/navigator` | Generate Navigator layer |
| POST | `/api/export/pdf` | Export report as PDF |
| POST | `/api/export/markdown` | Export report as Markdown |
| GET | `/api/health` | Health check |

## Project Structure

```
cyberbrief/
├── frontend/
│   ├── src/
│   │   ├── components/     # Shared UI components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # Zustand stores
│   │   ├── types/          # TypeScript type definitions
│   │   ├── variants/       # 5 design variant shells
│   │   ├── api/            # API client functions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── research/
│   ├── report/
│   ├── attack/
│   ├── export/
│   └── requirements.txt
└── README.md
```

## License

Private — All rights reserved.
