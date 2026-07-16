from typing import List

from fastapi import APIRouter, HTTPException, status

from app.schemas.api import ExamSummary, TestSummary, YearSummary
from app.services.attempts import build_test_summary
from app.services.test_loader import TestDataError, list_tests_for_year, load_years

router = APIRouter(prefix="/api/exams", tags=["exams"])


@router.get("", response_model=List[ExamSummary])
def list_exams() -> List[ExamSummary]:
    return [
        ExamSummary(
            id="upsc",
            name="UPSC Civil Services Examination",
            slug="upsc",
        )
    ]


@router.get("/upsc/years", response_model=List[YearSummary])
def list_upsc_years() -> List[YearSummary]:
    try:
        years = load_years()
    except TestDataError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    return [
        YearSummary(year=item.year, status=item.status.value)
        for item in years
    ]


@router.get("/upsc/{year}/tests", response_model=List[TestSummary])
def list_upsc_tests_for_year(year: int) -> List[TestSummary]:
    papers = list_tests_for_year(year)
    return [TestSummary.model_validate(build_test_summary(paper)) for paper in papers]
