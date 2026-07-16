# PYQ — UPSC Practice Platform

Personal Docker-hosted UPSC previous-year-question quiz platform.

## Sprint 1 status

Foundation only:

- FastAPI backend with health check
- React + TypeScript + Vite + Tailwind frontend
- Docker Compose wiring

Quiz flows, attempts, and scoring arrive in later sprints.

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
backend/     FastAPI app
frontend/    React + Vite app
docker-compose.yml
```
