from typing import List

from sqlalchemy.orm import Session

from app.models.notes import QuestionNote
from app.utils.time import utc_now


def list_notes(db: Session, test_id: str) -> List[QuestionNote]:
    return (
        db.query(QuestionNote)
        .filter(QuestionNote.test_id == test_id)
        .order_by(QuestionNote.question_number.asc())
        .all()
    )


def upsert_note(
    db: Session,
    test_id: str,
    question_number: int,
    body: str,
) -> QuestionNote:
    note = (
        db.query(QuestionNote)
        .filter(
            QuestionNote.test_id == test_id,
            QuestionNote.question_number == question_number,
        )
        .first()
    )
    now = utc_now()
    if note is None:
        note = QuestionNote(
            test_id=test_id,
            question_number=question_number,
            body=body,
            updated_at=now,
        )
        db.add(note)
    else:
        note.body = body
        note.updated_at = now

    db.commit()
    db.refresh(note)
    return note
