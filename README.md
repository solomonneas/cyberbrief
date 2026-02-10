# Solomon's CyberBRIEF

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)](https://github.com/solomonneas/cyberbrief)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.10+-3776ab?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.0+-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

AI-powered cyber threat intelligence research and reporting. Transforms raw threat data into executive-grade BLUF reports with MITRE ATT&CK mapping, IOC extraction, and academic citations.

## Key Features

- **Three Research Tiers**: Free (Brave + Gemini), Standard (Perplexity Sonar), Deep (Perplexity Deep Research)
- **Flexible Source Input**: URLs, raw text, or PDFs fed directly into synthesis
- **BLUF Executive Summaries**: Bottom-Line-Up-Front format for instant clarity
- **MITRE ATT&CK Mapping**: Automatic technique identification with Navigator layer export
- **IOC Extraction**: IPs, domains, file hashes, CVEs, and URLs automatically parsed
- **Academic Citations**: Chicago Notes-Bibliography format built-in
- **Threat Actor Profiling**: Rich profiles with confidence assessments
- **Export Options**: Markdown, HTML (PDF coming soon)
- **TLP Banners**: Traffic Light Protocol classification for every report
- **Theme Variants**: 5 beautiful visual themes to choose from

## Quick Start

### 1. Clone & Install Backend
```bash
git clone https://github.com/solomonneas/cyberbrief.git
cd cyberbrief && pip install -r backend/requirements.txt
```

### 2. Install Frontend
```bash
cd frontend && npm install
```

### 3. Run Development Server
```bash
npm run dev
```

Frontend runs on `http://localhost:5188`, backend on `http://localhost:8000`.

For more detailed setup, see [Configuration](docs/CONFIGURATION.md).

## Architecture

CyberBRIEF combines a **React + TypeScript** frontend with a **FastAPI + SQLite** backend. Raw intelligence flows through semantic search, AI synthesis, and structured extraction to produce publication-ready reports.

See [Architecture](docs/ARCHITECTURE.md) for the complete data flow and design patterns.

## Documentation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Tech stack, data flow, tier mechanics, frontend/backend split |
| [CONFIGURATION.md](docs/CONFIGURATION.md) | Environment variables, API key setup, port configuration |

## Tech Stack

**Frontend**
- React 18
- TypeScript 5
- Vite (dev server & bundler)
- Tailwind CSS

**Backend**
- FastAPI (async REST API)
- SQLite (report storage)
- Gemini Flash (synthesis)
- Brave Search API (free tier)
- Perplexity API (standard & deep research)

## License

MIT License. See [LICENSE](LICENSE) for details.

---

**Questions?** Open an issue or check [docs/](docs/) for detailed configuration and architecture guides.
