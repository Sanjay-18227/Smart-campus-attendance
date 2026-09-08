from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    course_code: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False
    )

    course_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    faculty_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    faculty = relationship("User")