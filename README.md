# PYQ — UPSC Practice Platform

Personal Docker-hosted UPSC previous-year-question quiz platform.

## MVP status

Sprints 1–8 are complete. GS Paper I 2026 is loaded as the full official set (100 questions, Q64 dropped).

You can:

1. Browse Home → UPSC → Attempt Tests → 2026
2. Start a timed attempt
3. Submit and view results
4. Review answers
5. See scores on the personal dashboard

## Quick start

```bash
docker compose up --build
```

Then open:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Dashboard | http://localhost:5173/dashboard |
| Backend API | http://localhost:8000 |
| API docs | http://localhost:8000/docs |
| Health check | http://localhost:8000/api/health |

Stop with:

```bash
docker compose down
```

SQLite attempt data persists in the `sqlite_data` Docker volume.

## User flow

```text
Home
 → Attempt Tests
 → 2026
 → General Studies Paper I
 → Instructions → Begin Test
 → Attempt UI
 → Submit
 → Results → Review Answers
 → Dashboard (scores)
```

## Current paper

Path: `backend/data/upsc/2026/gs-paper-1.json`

- Full UPSC CSE Prelims 2026 GS Paper I Series A — **100 questions**
- Official maximum marks **200**
- Marking: +2 / −0.6667 / 0 for unattempted
- Question 64 is dropped; **99** questions used for scoring

## API routes

- `GET /api/health`
- `GET /api/exams`
- `GET /api/exams/upsc/years`
- `GET /api/exams/upsc/{year}/tests`
- `GET /api/tests/{test_id}`
- `POST /api/attempts`
- `PATCH /api/attempts/{attempt_id}/responses`
- `GET /api/attempts/{attempt_id}`
- `POST /api/attempts/{attempt_id}/submit`
- `GET /api/attempts/{attempt_id}/review`
- `GET /api/dashboard/attempts`

## Local development (optional)

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
pytest
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
backend/           FastAPI app, scoring, attempts API
backend/data/      Structured UPSC test JSON
backend/tests/     Scoring, loader, API tests
frontend/          React + Vite + Tailwind app
sample_data/       Reference PDFs
docker-compose.yml
```

## Notes

- No login in MVP (personal local use)
- No public PDF upload UI
- Questions live in JSON files, not React components
- Correct answers are revealed only after submit
