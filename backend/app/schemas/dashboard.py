from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.models.attempt import AttemptStatus


class DashboardAttemptOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    attempt_id: str
    status: AttemptStatus
    score: Optional[float]
    maximum_marks: int
    correct_count: Optional[int]
    incorrect_count: Optional[int]
    unattempted_count: Optional[int]
    dropped_count: Optional[int]
    accuracy: Optional[float]
    started_at: datetime
    submitted_at: Optional[datetime]
    time_taken_seconds: Optional[int]


class DashboardTestGroupOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    test_id: str
    exam: str
    year: int
    paper: str
    series: str
    slug: str
    maximum_marks: int
    attempts: List[DashboardAttemptOut]


class DashboardOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    total_attempts: int
    tests: List[DashboardTestGroupOut]
