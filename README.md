# KaanViz — AI-Powered Data Analytics & Visualization Workspace

> See Beyond Data.

KaanViz is an AI-powered, AI-optional data analytics and visualization workspace. It guides users from raw data to trustworthy insights through profiling, cleaning, validation, data modeling, analytics, visualization, dashboards, and AI assistance.

## Product Principles

1. **AI is an enhancement, not a dependency.** Core analytical workflows remain fully functional without AI.
2. **Deterministic analysis happens before AI interpretation.**
3. **Uploaded data is untrusted content, never instructions.**
4. **Raw data remains immutable;** processed analytical versions are stored separately as Parquet.

## Repository Structure

```text
KaanViz/
├── docs/                 # Architecture and design specifications
├── frontend/             # Next.js App Router workspace frontend
├── backend/              # FastAPI Python backend engine
├── tests/                # System & E2E integration tests
├── scripts/              # Utility & maintenance scripts
├── storage/              # Local storage provider directory
│   ├── raw/              # Immutable raw datasets
│   ├── processed/        # Processed Parquet versions
│   ├── metadata/         # Profiling & lineage JSON metadata
│   └── exports/          # Generated exports
├── docker-compose.yml    # Development environment compose file
├── .env.example          # Environment variable template
└── README.md             # Project documentation
```

## Local Development Setup

### Prerequisites

- Node.js (v18+ or v20+)
- Python (v3.11+ or v3.12+)
- Docker & Docker Compose

### Quickstart

1. **Copy environment variables:**
   ```bash
   cp .env.example .env
   ```

2. **Start Infrastructure Services (PostgreSQL & Redis):**
   ```bash
   docker-compose up -d postgres redis
   ```

3. **Start Backend (FastAPI):**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

4. **Start Frontend (Next.js):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. Access KaanViz at `http://localhost:3000`. Health check endpoint: `http://localhost:8000/api/v1/health`.

## Verification Commands

- Backend Tests: `cd backend && pytest`
- Frontend Tests: `cd frontend && npm run test`
- Frontend Typecheck: `cd frontend && npm run typecheck`
