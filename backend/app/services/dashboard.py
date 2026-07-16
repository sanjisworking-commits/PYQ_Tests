from collections import defaultdict
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.attempt import Attempt, AttemptStatus
from app.services.test_loader import TestDataError, load_test_paper
from app.utils.time import ensure_utc


def list_dashboard_attempts(
    db: Session,
    test_id: Optional[str] = None,
) -> Dict[str, object]:
    query = db.query(Attempt).filter(
        Attempt.status.in_(
            [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED]
        )
    )
    if test_id is not None:
        query = query.filter(Attempt.test_id == test_id)

    attempts = query.order_by(Attempt.submitted_at.desc(), Attempt.created_at.desc()).all()

    grouped: Dict[str, List[Attempt]] = defaultdict(list)
    for attempt in attempts:
        grouped[attempt.test_id].append(attempt)

    tests = []
    for current_test_id, test_attempts in grouped.items():
        try:
            paper = load_test_paper(current_test_id)
        except TestDataError:
            # Keep historical attempts visible even if JSON was removed later.
            paper = None

        tests.append(
            {
                "test_id": current_test_id,
                "exam": paper.exam if paper is not None else "Unknown exam",
                "year": paper.year if paper is not None else 0,
                "paper": paper.paper if paper is not None else current_test_id,
                "series": paper.series if paper is not None else "—",
                "slug": paper.slug if paper is not None else current_test_id,
                "maximum_marks": (
                    paper.maximum_marks
                    if paper is not None
                    else test_attempts[0].maximum_marks
                ),
                "attempts": [_serialize_attempt(item) for item in test_attempts],
            }
        )

    tests.sort(key=lambda item: (-item["year"], item["paper"]))

    return {
        "total_attempts": len(attempts),
        "tests": tests,
    }


def _serialize_attempt(attempt: Attempt) -> Dict[str, object]:
    time_taken_seconds: Optional[int] = None
    if attempt.submitted_at is not None:
        delta = ensure_utc(attempt.submitted_at) - ensure_utc(attempt.started_at)
        time_taken_seconds = max(0, int(delta.total_seconds()))

    return {
        "attempt_id": attempt.id,
        "status": attempt.status,
        "score": attempt.score,
        "maximum_marks": attempt.maximum_marks,
        "correct_count": attempt.correct_count,
        "incorrect_count": attempt.incorrect_count,
        "unattempted_count": attempt.unattempted_count,
        "dropped_count": attempt.dropped_count,
        "accuracy": attempt.accuracy,
        "started_at": attempt.started_at,
        "submitted_at": attempt.submitted_at,
        "time_taken_seconds": time_taken_seconds,
    }
