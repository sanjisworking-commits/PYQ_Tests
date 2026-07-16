from datetime import timedelta
from typing import Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.attempt import Attempt, AttemptResponse, AttemptStatus
from app.schemas.api import ResponseUpdate
from app.schemas.test_data import TestPaper, question_to_public_dict
from app.services.scoring import score_attempt
from app.services.test_loader import TestDataError, load_test_paper
from app.utils.time import ensure_utc, utc_now


class AttemptServiceError(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def get_test_paper_or_404(test_id: str) -> TestPaper:
    try:
        return load_test_paper(test_id)
    except TestDataError as exc:
        raise AttemptServiceError(str(exc), status.HTTP_404_NOT_FOUND) from exc


def create_attempt(db: Session, test_id: str) -> Attempt:
    paper = get_test_paper_or_404(test_id)
    now = utc_now()
    attempt = Attempt(
        test_id=paper.id,
        status=AttemptStatus.IN_PROGRESS,
        started_at=now,
        expires_at=now + timedelta(minutes=paper.duration_minutes),
        submitted_at=None,
        maximum_marks=paper.maximum_marks,
        created_at=now,
    )
    db.add(attempt)
    db.flush()

    for question in paper.questions:
        db.add(
            AttemptResponse(
                attempt_id=attempt.id,
                question_number=question.number,
                selected_option=None,
                is_marked_for_review=False,
                is_visited=False,
                updated_at=now,
            )
        )

    db.commit()
    return get_attempt(db, attempt.id)


def get_attempt(db: Session, attempt_id: str) -> Attempt:
    attempt = (
        db.query(Attempt)
        .options(joinedload(Attempt.responses))
        .filter(Attempt.id == attempt_id)
        .first()
    )
    if attempt is None:
        raise AttemptServiceError("attempt not found", status.HTTP_404_NOT_FOUND)
    return attempt


def maybe_auto_submit_expired(db: Session, attempt: Attempt) -> Attempt:
    if attempt.status != AttemptStatus.IN_PROGRESS:
        return attempt

    if ensure_utc(utc_now()) < ensure_utc(attempt.expires_at):
        return attempt

    return submit_attempt(db, attempt.id, auto=True)


def update_responses(
    db: Session,
    attempt_id: str,
    updates: List[ResponseUpdate],
) -> Attempt:
    attempt = get_attempt(db, attempt_id)
    attempt = maybe_auto_submit_expired(db, attempt)

    if attempt.status != AttemptStatus.IN_PROGRESS:
        raise AttemptServiceError(
            "cannot update responses for a submitted attempt",
            status.HTTP_409_CONFLICT,
        )

    paper = get_test_paper_or_404(attempt.test_id)
    question_by_number = {question.number: question for question in paper.questions}
    response_map: Dict[int, AttemptResponse] = {
        item.question_number: item for item in attempt.responses
    }
    now = utc_now()

    for update in updates:
        question = question_by_number.get(update.question_number)
        if question is None:
            raise AttemptServiceError(
                f"unknown question_number: {update.question_number}",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        row = response_map.get(update.question_number)
        if row is None:
            raise AttemptServiceError(
                f"response row missing for question {update.question_number}",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        unset_data = update.model_dump(exclude_unset=True)
        if "selected_option" in unset_data:
            # Dropped questions are never scored; keep selection cleared.
            row.selected_option = None if question.is_dropped else update.selected_option
            if "is_visited" not in unset_data:
                row.is_visited = True
        if "is_marked_for_review" in unset_data and update.is_marked_for_review is not None:
            row.is_marked_for_review = (
                False if question.is_dropped else update.is_marked_for_review
            )
        if "is_visited" in unset_data and update.is_visited is not None:
            row.is_visited = update.is_visited

        row.updated_at = now

    db.commit()
    return get_attempt(db, attempt_id)


def submit_attempt(db: Session, attempt_id: str, auto: bool = False) -> Attempt:
    attempt = get_attempt(db, attempt_id)

    if attempt.status in {AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED}:
        return attempt

    paper = get_test_paper_or_404(attempt.test_id)
    responses = {
        item.question_number: item.selected_option for item in attempt.responses
    }
    result = score_attempt(paper, responses)
    now = utc_now()

    attempt.status = (
        AttemptStatus.AUTO_SUBMITTED if auto else AttemptStatus.SUBMITTED
    )
    attempt.submitted_at = now
    attempt.score = result.score
    attempt.maximum_marks = result.maximum_marks
    attempt.correct_count = result.correct_count
    attempt.incorrect_count = result.incorrect_count
    attempt.unattempted_count = result.unattempted_count
    attempt.dropped_count = result.dropped_count
    attempt.accuracy = result.accuracy

    db.commit()
    return get_attempt(db, attempt_id)


def build_public_test_detail(paper: TestPaper) -> Dict[str, object]:
    return {
        "id": paper.id,
        "exam": paper.exam,
        "year": paper.year,
        "paper": paper.paper,
        "series": paper.series,
        "slug": paper.slug,
        "duration_minutes": paper.duration_minutes,
        "maximum_marks": paper.maximum_marks,
        "total_questions": paper.total_questions,
        "questions_for_scoring": paper.questions_for_scoring,
        "marks_per_correct": paper.marks_per_correct,
        "negative_marks": paper.negative_marks,
        "dropped_question_numbers": paper.dropped_question_numbers,
        "status": paper.status.value,
        "questions": [question_to_public_dict(question) for question in paper.questions],
    }


def build_test_summary(paper: TestPaper) -> Dict[str, object]:
    detail = build_public_test_detail(paper)
    detail.pop("questions", None)
    return detail


def build_review_payload(db: Session, attempt_id: str) -> Dict[str, object]:
    attempt = get_attempt(db, attempt_id)
    attempt = maybe_auto_submit_expired(db, attempt)

    if attempt.status == AttemptStatus.IN_PROGRESS:
        raise AttemptServiceError(
            "review is available only after submission",
            status.HTTP_409_CONFLICT,
        )

    paper = get_test_paper_or_404(attempt.test_id)
    response_map = {
        item.question_number: item for item in attempt.responses
    }
    questions = []
    for question in paper.questions:
        selected = response_map.get(question.number)
        selected_option: Optional[str] = (
            selected.selected_option if selected is not None else None
        )
        is_correct: Optional[bool]
        if question.is_dropped:
            is_correct = None
        elif selected_option is None:
            is_correct = False
        else:
            is_correct = selected_option == question.correct_option

        questions.append(
            {
                "number": question.number,
                "type": question.type.value,
                "stem": question.stem,
                "is_dropped": question.is_dropped,
                "selected_option": selected_option,
                "correct_option": question.correct_option,
                "is_correct": is_correct,
                "options": [
                    {"label": option.label, "text": option.text}
                    for option in question.options
                ],
                "statements": [
                    {"label": statement.label, "text": statement.text}
                    for statement in question.statements
                ],
                "pairs": [
                    {"left": pair.left, "right": pair.right} for pair in question.pairs
                ],
                "lists": (
                    question.lists.model_dump(mode="json")
                    if question.lists is not None
                    else None
                ),
                "table": (
                    question.table.model_dump(mode="json")
                    if question.table is not None
                    else None
                ),
                "case_text": question.case_text,
            }
        )

    return {
        "attempt": attempt,
        "questions": questions,
    }


def raise_http_error(exc: AttemptServiceError) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
