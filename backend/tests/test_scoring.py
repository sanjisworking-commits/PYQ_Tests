from typing import Dict, Optional

import pytest

from app.schemas.test_data import TestPaper
from app.services.scoring import score_attempt
from app.services.test_loader import load_test_paper_from_path
from app.config import UPSC_DATA_DIR


@pytest.fixture
def sample_paper() -> TestPaper:
    return load_test_paper_from_path(UPSC_DATA_DIR / "2026" / "gs-paper-1.json")


def test_all_correct_answers(sample_paper: TestPaper) -> None:
    responses: Dict[int, Optional[str]] = {
        1: "D",
        2: "A",
        3: "C",
        4: "B",
        64: "A",
    }

    result = score_attempt(sample_paper, responses)

    assert result.correct_count == 4
    assert result.incorrect_count == 0
    assert result.unattempted_count == 0
    assert result.dropped_count == 1
    assert result.score == 8.0
    assert result.maximum_marks == 200
    assert result.accuracy == 1.0


def test_negative_marking_and_rounding(sample_paper: TestPaper) -> None:
    responses: Dict[int, Optional[str]] = {
        1: "D",  # +2
        2: "B",  # -0.6667
        3: None,
        4: "A",  # -0.6667
    }

    result = score_attempt(sample_paper, responses)

    assert result.correct_count == 1
    assert result.incorrect_count == 2
    assert result.unattempted_count == 1
    assert result.dropped_count == 1
    assert result.score == 0.67
    assert result.accuracy == 0.3333


def test_dropped_question_excluded_from_all_counts(sample_paper: TestPaper) -> None:
    responses: Dict[int, Optional[str]] = {
        1: None,
        2: None,
        3: None,
        4: None,
        64: "C",
    }

    result = score_attempt(sample_paper, responses)

    assert result.correct_count == 0
    assert result.incorrect_count == 0
    assert result.unattempted_count == 4
    assert result.dropped_count == 1
    assert result.score == 0.0
    assert result.accuracy == 0.0


def test_unanswered_questions_do_not_change_score(sample_paper: TestPaper) -> None:
    result = score_attempt(sample_paper, {})

    assert result.correct_count == 0
    assert result.incorrect_count == 0
    assert result.unattempted_count == 4
    assert result.dropped_count == 1
    assert result.score == 0.0


def test_result_counts_are_consistent(sample_paper: TestPaper) -> None:
    responses: Dict[int, Optional[str]] = {
        1: "D",
        2: "A",
        3: "A",
        4: None,
    }

    result = score_attempt(sample_paper, responses)
    scored_total = (
        result.correct_count
        + result.incorrect_count
        + result.unattempted_count
        + result.dropped_count
    )

    assert scored_total == sample_paper.total_questions
    assert result.maximum_marks == sample_paper.maximum_marks
