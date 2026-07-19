from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

from app.models.attempt import AttemptStatus
from app.utils.time import to_utc_iso


class ExamSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    slug: str


class SyllabusSubtopicOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    topic: str
    subtopics: List[str] = Field(default_factory=list)


class SyllabusSubjectOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    subject: str
    topics: List[SyllabusSubtopicOut] = Field(default_factory=list)


class SyllabusOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    document: str
    subjects: List[SyllabusSubjectOut]


class YearSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    year: int
    status: str


class TestSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    exam: str
    year: int
    paper: str
    series: str
    slug: str
    duration_minutes: int
    maximum_marks: int
    total_questions: int
    questions_for_scoring: int
    marks_per_correct: float
    negative_marks: float
    dropped_question_numbers: List[int]
    status: str


class TestDetail(TestSummary):
    questions: List[Dict[str, Any]]


class CreateAttemptRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    test_id: str = Field(min_length=1)


class ResponseUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question_number: int = Field(ge=1)
    selected_option: Optional[str] = None
    is_marked_for_review: Optional[bool] = None
    is_visited: Optional[bool] = None

    @field_validator("selected_option")
    @classmethod
    def validate_selected_option(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip().upper()
        if normalized == "":
            return None
        if normalized not in {"A", "B", "C", "D"}:
            raise ValueError("selected_option must be one of A, B, C, D")
        return normalized


class PatchResponsesRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    responses: List[ResponseUpdate] = Field(min_length=1)


class AttemptResponseOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question_number: int
    selected_option: Optional[str]
    is_marked_for_review: bool
    is_visited: bool
    updated_at: datetime

    @field_serializer("updated_at")
    def serialize_updated_at(self, value: datetime) -> str:
        serialized = to_utc_iso(value)
        assert serialized is not None
        return serialized


class AttemptOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    test_id: str
    status: AttemptStatus
    started_at: datetime
    expires_at: datetime
    submitted_at: Optional[datetime]
    score: Optional[float]
    maximum_marks: int
    correct_count: Optional[int]
    incorrect_count: Optional[int]
    unattempted_count: Optional[int]
    dropped_count: Optional[int]
    accuracy: Optional[float]
    responses: List[AttemptResponseOut]

    @field_serializer("started_at", "expires_at", "submitted_at")
    def serialize_attempt_datetimes(self, value: Optional[datetime]) -> Optional[str]:
        return to_utc_iso(value)


class StudyRefOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    subject: str
    topic: str
    subtopic: str
    ncert_hint: Optional[str] = None


class SourceExplanationOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source: str
    source_label: str
    source_answer: Optional[str] = None
    explanation: str
    source_url: Optional[str] = None


class ReviewQuestionOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    number: int
    type: str
    stem: str
    is_dropped: bool
    selected_option: Optional[str]
    correct_option: Optional[str]
    is_correct: Optional[bool]
    options: List[Dict[str, str]]
    statements: List[Dict[str, str]]
    pairs: List[Dict[str, str]]
    lists: Optional[Dict[str, Any]]
    table: Optional[Dict[str, Any]]
    case_text: Optional[str]
    study_refs: List[StudyRefOut] = Field(default_factory=list)
    explanations: List[SourceExplanationOut] = Field(default_factory=list)


class QuestionNoteOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    test_id: str
    question_number: int
    body: str
    updated_at: datetime

    @field_serializer("updated_at")
    def serialize_updated_at(self, value: datetime) -> str:
        serialized = to_utc_iso(value)
        assert serialized is not None
        return serialized


class UpsertQuestionNoteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    body: str = Field(default="", max_length=20000)


class ReviewOut(BaseModel):
    model_config = ConfigDict(extra="forbid")

    attempt: AttemptOut
    questions: List[ReviewQuestionOut]
