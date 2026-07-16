from contextlib import asynccontextmanager
from typing import AsyncIterator, Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import attempts, exams, tests


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    init_db()
    yield


app = FastAPI(
    title="PYQ Quiz API",
    description="UPSC previous-year-question quiz platform API",
    version="0.3.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(exams.router)
app.include_router(tests.router)
app.include_router(attempts.router)


@app.get("/api/health")
def health_check() -> Dict[str, str]:
    return {"status": "ok", "service": "pyq-backend"}
