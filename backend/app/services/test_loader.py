import json
from pathlib import Path
from typing import List

from pydantic import ValidationError

from app.config import UPSC_DATA_DIR
from app.schemas.test_data import TestPaper, YearInfo


class TestDataError(ValueError):
    """Raised when test JSON data cannot be loaded or validated."""

    __test__ = False


def load_years(data_dir: Path = UPSC_DATA_DIR) -> List[YearInfo]:
    path = data_dir / "years.json"
    payload = _read_json(path)
    if not isinstance(payload, list):
        raise TestDataError("years.json must contain a JSON array")
    try:
        return [YearInfo.model_validate(item) for item in payload]
    except ValidationError as exc:
        raise TestDataError(f"invalid years metadata in {path}: {exc}") from exc


def list_tests_for_year(year: int, data_dir: Path = UPSC_DATA_DIR) -> List[TestPaper]:
    year_dir = data_dir / str(year)
    if not year_dir.exists():
        return []

    papers: List[TestPaper] = []
    for path in sorted(year_dir.glob("*.json")):
        papers.append(load_test_paper_from_path(path))
    return papers


def load_test_paper(test_id: str, data_dir: Path = UPSC_DATA_DIR) -> TestPaper:
    for path in sorted(data_dir.glob("*/*.json")):
        paper = load_test_paper_from_path(path)
        if paper.id == test_id:
            return paper
    raise TestDataError(f"test not found: {test_id}")


def load_test_paper_from_path(path: Path) -> TestPaper:
    payload = _read_json(path)
    try:
        return TestPaper.model_validate(payload)
    except ValidationError as exc:
        raise TestDataError(f"invalid test data in {path}: {exc}") from exc


def _read_json(path: Path) -> object:
    if not path.exists():
        raise TestDataError(f"missing data file: {path}")
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except json.JSONDecodeError as exc:
        raise TestDataError(f"invalid JSON in {path}: {exc}") from exc
