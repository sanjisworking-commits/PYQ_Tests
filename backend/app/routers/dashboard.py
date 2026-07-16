from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.dashboard import DashboardOut
from app.services.dashboard import list_dashboard_attempts

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/attempts", response_model=DashboardOut)
def get_dashboard_attempts(
    test_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> DashboardOut:
    payload = list_dashboard_attempts(db, test_id=test_id)
    return DashboardOut.model_validate(payload)
