from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class YearStatus(str, Enum):
    AVAILABLE = "available"
    COMING_SOON = "coming_soon"


class QuestionType(str, Enum):
    STANDARD_MCQ = "standard_mcq"
    MULTIPLE_STATEMENTS = "multiple_statements"
    COUNT_CORRECT = "count_correct"
    COUNT_INCORRECT = "count_incorrect"
    ASSERTION_REASON = "assertion_reason"
    ASSERTION_SUPPORT = "assertion_support"
    MATCHING_PAIRS = "matching_pairs"
    MATCHING_LISTS = "matching_lists"
    TABLE_BASED = "table_based"
    CASE_BASED = "case_based"


class YearInfo(BaseModel):
    model_config = ConfigDict(extra="forbid")

    year: int
    status: YearStatus


class Option(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str
    text: str

    @field_validator("label")
    @classmethod
    def validate_label(cls, value: str) -> str:
        normalized = value.strip().upper()
        if normalized not in {"A", "B", "C", "D"}:
            raise ValueError("option label must be one of A, B, C, D")
        return normalized


class Statement(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str
    text: str


class MatchingPair(BaseModel):
    model_config = ConfigDict(extra="forbid")

    left: str
    right: str


class MatchingLists(BaseModel):
    model_config = ConfigDict(extra="forbid")

    list_i: List[Statement] = Field(default_factory=list)
    list_ii: List[Statement] = Field(default_factory=list)


class QuestionTable(BaseModel):
    model_config = ConfigDict(extra="forbid")

    headers: List[str] = Field(default_factory=list)
    rows: List[List[str]] = Field(default_factory=list)


class Question(BaseModel):
    model_config = ConfigDict(extra="forbid")

    number: int = Field(ge=1)
    type: QuestionType
    stem: str
    statements: List[Statement] = Field(default_factory=list)
    pairs: List[MatchingPair] = Field(default_factory=list)
    lists: Optional[MatchingLists] = None
    table: Optional[QuestionTable] = None
    case_text: Optional[str] = None
    options: List[Option]
    correct_option: Optional[str] = None
    is_dropped: bool = False

    @field_validator("correct_option")
    @classmethod
    def validate_correct_option(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip().upper()
        if normalized not in {"A", "B", "C", "D"}:
            raise ValueError("correct_option must be one of A, B, C, D")
        return normalized

    @model_validator(mode="after")
    def validate_question_consistency(self) -> "Question":
        labels = [option.label for option in self.options]
        if labels != ["A", "B", "C", "D"]:
            raise ValueError(
                f"question {self.number} must include options A, B, C, D exactly once"
            )

        if self.is_dropped:
            return self

        if self.correct_option is None:
            raise ValueError(
                f"question {self.number} requires correct_option when not dropped"
            )

        return self


class TestPaper(BaseModel):
    __test__ = False
    model_config = ConfigDict(extra="forbid")

    id: str
    exam: str
    year: int
    paper: str
    series: str
    slug: str
    duration_minutes: int = Field(gt=0)
    maximum_marks: int = Field(gt=0)
    total_questions: int = Field(gt=0)
    questions_for_scoring: int = Field(gt=0)
    marks_per_correct: float = Field(gt=0)
    negative_marks: float = Field(ge=0)
    dropped_question_numbers: List[int] = Field(default_factory=list)
    status: YearStatus = YearStatus.AVAILABLE
    questions: List[Question]

    @model_validator(mode="after")
    def validate_paper_consistency(self) -> "TestPaper":
        if len(self.questions) != self.total_questions:
            raise ValueError(
                "total_questions must match the number of question objects in the file"
            )

        numbers = [question.number for question in self.questions]
        if len(numbers) != len(set(numbers)):
            raise ValueError("question numbers must be unique")

        dropped_from_flags = sorted(
            question.number for question in self.questions if question.is_dropped
        )
        dropped_declared = sorted(self.dropped_question_numbers)
        if dropped_from_flags != dropped_declared:
            raise ValueError(
                "dropped_question_numbers must match questions with is_dropped=true"
            )

        scorable = sum(1 for question in self.questions if not question.is_dropped)
        if scorable != self.questions_for_scoring:
            raise ValueError(
                "questions_for_scoring must equal the count of non-dropped questions"
            )

        return self


class ScoreResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    score: float
    maximum_marks: int
    correct_count: int
    incorrect_count: int
    unattempted_count: int
    dropped_count: int
    accuracy: float


def question_to_public_dict(question: Question) -> Dict[str, Any]:
    """Serialize a question without revealing the answer key."""
    payload = question.model_dump(mode="json")
    payload.pop("correct_option", None)
    return payload
