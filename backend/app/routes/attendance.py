from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.attendance import Attendance
from app.models.user import User, UserRole
from app.models.student_profile import StudentProfile
from app.services.auth import get_current_user


router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def mark_attendance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only students can mark their own attendance
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=403,
            detail="Only students can mark attendance"
        )

    # Find the logged-in student's profile
    student = db.query(StudentProfile).filter(
        StudentProfile.user_id == current_user.id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found"
        )

    attendance = Attendance(
        student_id=student.id,
        status="present"
    )

    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    return {
        "message": "Attendance marked successfully",
        "attendance_id": attendance.id,
        "student_id": attendance.student_id,
        "date": attendance.date,
        "status": attendance.status
    }