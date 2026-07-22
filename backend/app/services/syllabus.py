import json
from pathlib import Path
from typing import Any, Dict, List

from app.config import UPSC_DATA_DIR
from app.services.test_loader import TestDataError


def load_syllabus(data_dir: Path = UPSC_DATA_DIR) -> Dict[str, Any]:
    path = data_dir / "syllabus.json"
    if not path.exists():
        raise TestDataError(f"missing syllabus file: {path}")
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise TestDataError(f"invalid JSON in {path}: {exc}") from exc

    if not isinstance(payload, dict) or "subjects" not in payload:
        raise TestDataError("syllabus.json must contain a subjects array")
    if not isinstance(payload["subjects"], list):
        raise TestDataError("syllabus subjects must be a list")
    return payload


def syllabus_subjects(data_dir: Path = UPSC_DATA_DIR) -> List[Dict[str, Any]]:
    return load_syllabus(data_dir)["subjects"]
