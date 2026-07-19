from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.notes import QuestionNote
from app.schemas.api import QuestionNoteOut, UpsertQuestionNoteRequest
from app.services import notes as notes_service
from app.services.test_loader import TestDataError, load_test_paper

router = APIRouter(prefix="/api/tests", tags=["notes"])


def _ensure_test_and_question(test_id: str, question_number: int) -> None:
    try:
        paper = load_test_paper(test_id)
    except TestDataError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    numbers = {question.number for question in paper.questions}
    if question_number not in numbers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"question {question_number} not found on test {test_id}",
        )


@router.get("/{test_id}/notes", response_model=List[QuestionNoteOut])
def get_test_notes(test_id: str, db: Session = Depends(get_db)) -> List[QuestionNote]:
    try:
        load_test_paper(test_id)
    except TestDataError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    return notes_service.list_notes(db, test_id)


@router.put(
    "/{test_id}/questions/{question_number}/notes",
    response_model=QuestionNoteOut,
)
def put_question_note(
    test_id: str,
    question_number: int,
    payload: UpsertQuestionNoteRequest,
    db: Session = Depends(get_db),
) -> QuestionNote:
    _ensure_test_and_question(test_id, question_number)
    return notes_service.upsert_note(
        db,
        test_id=test_id,
        question_number=question_number,
        body=payload.body,
    )
