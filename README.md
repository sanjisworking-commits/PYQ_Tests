# PYQ — UPSC Practice Platform

Personal Docker-hosted UPSC previous-year-question quiz platform.

## Current status

Completed:

- Sprint 1: Docker foundation (FastAPI + React + Compose)
- Sprint 2: UPSC test JSON data, loader validation, and scoring engine
- Sprint 3: Exams/tests/attempts API with SQLite persistence

Next:

- Sprint 4: Navigation pages (Home → Instructions)

## Quick start

```bash
docker compose up --build
```

Then open:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API docs | http://localhost:8000/docs |
| Health check | http://localhost:8000/api/health |

Useful API routes (Sprint 3):

- `GET /api/exams`
- `GET /api/exams/upsc/years`
- `GET /api/exams/upsc/2026/tests`
- `GET /api/tests/upsc-2026-gs-paper-1`
- `POST /api/attempts`
- `PATCH /api/attempts/{attempt_id}/responses`
- `GET /api/attempts/{attempt_id}`
- `POST /api/attempts/{attempt_id}/submit`
- `GET /api/attempts/{attempt_id}/review`

Stop with:

```bash
docker compose down
```

## Local development (optional)

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_BASE_URL=http://localhost:8000` if needed.

## Repository layout

```text
backend/           FastAPI app
backend/data/      Structured UPSC test JSON
backend/tests/     Scoring and loader tests
frontend/          React + Vite app
docker-compose.yml
```

## Backend tests

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest
```
