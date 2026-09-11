from datetime import datetime

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

    # Get today's date
    today = datetime.utcnow().date()

    # Check whether this student already marked attendance today
    existing_attendance = db.query(Attendance).filter(
        Attendance.student_id == student.id,
        Attendance.date >= datetime.combine(
            today,
            datetime.min.time()
        ),
        Attendance.date < datetime.combine(
            today,
            datetime.max.time()
        )
    ).first()

    # Prevent duplicate attendance
    if existing_attendance:
        raise HTTPException(
            status_code=400,
            detail="Attendance already marked for today"
        )

    # Create new attendance record
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

@router.get("/")
def get_my_attendance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only students can view attendance
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=403,
            detail="Only students can view attendance"
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

    # Get only this student's attendance records
    records = db.query(Attendance).filter(
        Attendance.student_id == student.id
    ).order_by(
        Attendance.date.desc()
    ).all()

    # Calculate attendance
    total_days = len(records)

    present_days = sum(
        1 for record in records
        if record.status == "present"
    )

    if total_days > 0:
        attendance_percentage = (
            present_days / total_days
        ) * 100
    else:
        attendance_percentage = 0.0

    return {
        "student_id": student.id,
        "register_number": student.register_number,
        "department": student.department,
        "year": student.year,
        "total_days": total_days,
        "present_days": present_days,
        "attendance_percentage": round(
            attendance_percentage, 2
        ),
        "records": [
            {
                "attendance_id": record.id,
                "date": record.date,
                "status": record.status
            }
            for record in records
        ]
    }