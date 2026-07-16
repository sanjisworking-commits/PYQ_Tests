import enum
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AttemptStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    AUTO_SUBMITTED = "auto_submitted"


class Attempt(Base):
    __tablename__ = "attempts"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    test_id: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    status: Mapped[AttemptStatus] = mapped_column(
        Enum(AttemptStatus),
        default=AttemptStatus.IN_PROGRESS,
        nullable=False,
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    maximum_marks: Mapped[int] = mapped_column(Integer, nullable=False)
    correct_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    incorrect_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    unattempted_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    dropped_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    responses: Mapped[List["AttemptResponse"]] = relationship(
        "AttemptResponse",
        back_populates="attempt",
        cascade="all, delete-orphan",
        order_by="AttemptResponse.question_number",
    )


class AttemptResponse(Base):
    __tablename__ = "attempt_responses"
    __table_args__ = (
        UniqueConstraint(
            "attempt_id",
            "question_number",
            name="uq_attempt_question",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    attempt_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("attempts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_number: Mapped[int] = mapped_column(Integer, nullable=False)
    selected_option: Mapped[Optional[str]] = mapped_column(String(1), nullable=True)
    is_marked_for_review: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_visited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    attempt: Mapped[Attempt] = relationship("Attempt", back_populates="responses")
