from typing import Dict, Mapping, Optional

from app.schemas.test_data import Question, ScoreResult, TestPaper


def score_attempt(
    test_paper: TestPaper,
    responses: Mapping[int, Optional[str]],
) -> ScoreResult:
    """Score an attempt using UPSC prelims marking rules.

    Dropped questions are excluded from all scoring counts.
    Official maximum_marks comes from the test paper metadata and is not derived.
    """
    correct_count = 0
    incorrect_count = 0
    unattempted_count = 0
    dropped_count = 0
    score = 0.0

    for question in test_paper.questions:
        if question.is_dropped:
            dropped_count += 1
            continue

        selected = _normalize_response(responses.get(question.number))
        if selected is None:
            unattempted_count += 1
            continue

        if selected == question.correct_option:
            correct_count += 1
            score += test_paper.marks_per_correct
        else:
            incorrect_count += 1
            score -= test_paper.negative_marks

    attempted = correct_count + incorrect_count
    accuracy = round(correct_count / attempted, 4) if attempted > 0 else 0.0

    return ScoreResult(
        score=round(score, 2),
        maximum_marks=test_paper.maximum_marks,
        correct_count=correct_count,
        incorrect_count=incorrect_count,
        unattempted_count=unattempted_count,
        dropped_count=dropped_count,
        accuracy=accuracy,
    )


def build_response_map(
    responses: Mapping[int, Optional[str]],
) -> Dict[int, Optional[str]]:
    return {number: _normalize_response(value) for number, value in responses.items()}


def _normalize_response(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    normalized = value.strip().upper()
    if normalized == "":
        return None
    return normalized


def assert_question_answer(question: Question, selected: Optional[str]) -> bool:
    if question.is_dropped:
        return False
    return _normalize_response(selected) == question.correct_option
