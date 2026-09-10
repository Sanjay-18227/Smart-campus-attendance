from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Attendance(Base):
    __tablename__ = "attendance"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    # Student who is being marked
    student_id: Mapped[int] = mapped_column(
        ForeignKey("student_profiles.id"),
        nullable=False
    )

    # Attendance date and time
    date: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Attendance status
    status: Mapped[str] = mapped_column(
        String(20),
        default="present",
        nullable=False
    )

    # Relationship with student profile
    student = relationship("StudentProfile")