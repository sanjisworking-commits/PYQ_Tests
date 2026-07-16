from fastapi import APIRouter, HTTPException, status

from app.schemas.api import TestDetail
from app.services.attempts import build_public_test_detail
from app.services.test_loader import TestDataError, load_test_paper

router = APIRouter(prefix="/api/tests", tags=["tests"])


@router.get("/{test_id}", response_model=TestDetail)
def get_test(test_id: str) -> TestDetail:
    try:
        paper = load_test_paper(test_id)
    except TestDataError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    return TestDetail.model_validate(build_public_test_detail(paper))
