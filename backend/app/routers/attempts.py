from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.attempt import AttemptStatus
from app.schemas.api import (
    AttemptOut,
    CreateAttemptRequest,
    PatchResponsesRequest,
    ReviewOut,
)
from app.services import attempts as attempt_service
from app.utils.time import ensure_utc, utc_now

router = APIRouter(prefix="/api/attempts", tags=["attempts"])


def _to_attempt_out(attempt: object) -> AttemptOut:
    return AttemptOut.model_validate(attempt, from_attributes=True)


@router.post("", response_model=AttemptOut, status_code=201)
def create_attempt(
    payload: CreateAttemptRequest,
    db: Session = Depends(get_db),
) -> AttemptOut:
    try:
        attempt = attempt_service.create_attempt(db, payload.test_id)
    except attempt_service.AttemptServiceError as exc:
        attempt_service.raise_http_error(exc)
    return _to_attempt_out(attempt)


@router.get("/{attempt_id}", response_model=AttemptOut)
def get_attempt(attempt_id: str, db: Session = Depends(get_db)) -> AttemptOut:
    try:
        attempt = attempt_service.get_attempt(db, attempt_id)
        attempt = attempt_service.maybe_auto_submit_expired(db, attempt)
    except attempt_service.AttemptServiceError as exc:
        attempt_service.raise_http_error(exc)
    return _to_attempt_out(attempt)


@router.patch("/{attempt_id}/responses", response_model=AttemptOut)
def patch_responses(
    attempt_id: str,
    payload: PatchResponsesRequest,
    db: Session = Depends(get_db),
) -> AttemptOut:
    try:
        attempt = attempt_service.update_responses(
            db,
            attempt_id,
            payload.responses,
        )
    except attempt_service.AttemptServiceError as exc:
        attempt_service.raise_http_error(exc)
    return _to_attempt_out(attempt)


@router.post("/{attempt_id}/submit", response_model=AttemptOut)
def submit_attempt(attempt_id: str, db: Session = Depends(get_db)) -> AttemptOut:
    try:
        attempt = attempt_service.get_attempt(db, attempt_id)
        auto = (
            attempt.status == AttemptStatus.IN_PROGRESS
            and ensure_utc(utc_now()) >= ensure_utc(attempt.expires_at)
        )
        attempt = attempt_service.submit_attempt(db, attempt_id, auto=auto)
    except attempt_service.AttemptServiceError as exc:
        attempt_service.raise_http_error(exc)
    return _to_attempt_out(attempt)


@router.get("/{attempt_id}/review", response_model=ReviewOut)
def review_attempt(attempt_id: str, db: Session = Depends(get_db)) -> ReviewOut:
    try:
        payload = attempt_service.build_review_payload(db, attempt_id)
    except attempt_service.AttemptServiceError as exc:
        attempt_service.raise_http_error(exc)

    return ReviewOut(
        attempt=_to_attempt_out(payload["attempt"]),
        questions=payload["questions"],
    )
