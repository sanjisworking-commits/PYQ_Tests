import json
from pathlib import Path

import pytest

from app.config import UPSC_DATA_DIR
from app.schemas.test_data import YearStatus
from app.services.test_loader import (
    TestDataError,
    list_tests_for_year,
    load_test_paper,
    load_test_paper_from_path,
    load_years,
)


def test_load_years_metadata() -> None:
    years = load_years()

    assert [item.year for item in years] == [2026, 2025, 2024, 2023]
    assert years[0].status == YearStatus.AVAILABLE
    assert years[1].status == YearStatus.AVAILABLE
    assert years[2].status == YearStatus.COMING_SOON


def test_load_sample_test_json_file() -> None:
    paper = load_test_paper_from_path(UPSC_DATA_DIR / "2026" / "gs-paper-1.json")

    assert paper.id == "upsc-2026-gs-paper-1"
    assert paper.year == 2026
    assert paper.paper == "General Studies Paper I"
    assert paper.series == "A"
    assert paper.total_questions == 100
    assert paper.questions_for_scoring == 99
    assert paper.maximum_marks == 200
    assert paper.negative_marks == 0.6667
    assert paper.dropped_question_numbers == [64]
    assert [question.number for question in paper.questions] == list(range(1, 101))

    types = {question.number: question.type.value for question in paper.questions}
    assert types[1] == "standard_mcq"
    assert types[3] == "multiple_statements"
    assert types[67] == "matching_lists"
    assert types[98] == "table_based"

    first = paper.questions[0]
    assert "Carnatic" in first.stem
    assert first.correct_option == "D"

    dropped = next(question for question in paper.questions if question.number == 64)
    assert dropped.is_dropped is True
    assert dropped.correct_option is None


def test_load_test_paper_by_id() -> None:
    paper = load_test_paper("upsc-2026-gs-paper-1")
    assert paper.slug == "gs-paper-1"


def test_list_tests_for_year() -> None:
    papers = list_tests_for_year(2026)
    assert len(papers) == 1
    assert papers[0].id == "upsc-2026-gs-paper-1"
    papers_2025 = list_tests_for_year(2025)
    assert len(papers_2025) == 1
    assert papers_2025[0].id == "upsc-2025-gs-paper-1"


def test_load_2025_gs_paper_with_explanations() -> None:
    paper = load_test_paper_from_path(UPSC_DATA_DIR / "2025" / "gs-paper-1.json")
    assert paper.id == "upsc-2025-gs-paper-1"
    assert paper.total_questions == 100
    assert paper.questions_for_scoring == 100
    assert all(len(question.explanations) == 2 for question in paper.questions)
    first = paper.questions[0]
    assert {item.source for item in first.explanations} == {"forumias", "vajiram"}
    assert "Alternative Investment Funds" in first.stem or any(
        "Hedge" in s.text for s in first.statements
    )
    q47 = next(q for q in paper.questions if q.number == 47)
    blob = " ".join(e.explanation for e in q47.explanations).lower()
    assert "majorana" in blob


def test_invalid_json_raises_test_data_error(tmp_path: Path) -> None:
    bad_file = tmp_path / "bad.json"
    bad_file.write_text("{not-json", encoding="utf-8")

    with pytest.raises(TestDataError, match="invalid JSON"):
        load_test_paper_from_path(bad_file)


def test_schema_validation_rejects_inconsistent_dropped_flags(tmp_path: Path) -> None:
    source = UPSC_DATA_DIR / "2026" / "gs-paper-1.json"
    payload = json.loads(source.read_text(encoding="utf-8"))
    payload["dropped_question_numbers"] = []
    broken = tmp_path / "broken.json"
    broken.write_text(json.dumps(payload), encoding="utf-8")

    with pytest.raises(TestDataError, match="dropped_question_numbers"):
        load_test_paper_from_path(broken)


def test_unknown_test_id_raises() -> None:
    with pytest.raises(TestDataError, match="test not found"):
        load_test_paper("does-not-exist")
