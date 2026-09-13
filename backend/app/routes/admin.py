from datetime import date, datetime, timedelta
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.models.student_profile import StudentProfile
from app.models.attendance import Attendance
from app.models.parent_contact import ParentContact
from app.services.permissions import require_admin


# Attendance status options
class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Test admin access
@router.get("/test")
def admin_test(
    current_user: User = Depends(require_admin)
):
    return {
        "message": "Admin access granted",
        "admin_id": current_user.id,
        "admin_name": current_user.name
    }


# Get all students
@router.get("/students")
def get_all_students(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    students = db.query(StudentProfile).all()

    return [
        {
            "student_id": student.id,
            "user_id": student.user_id,
            "register_number": student.register_number,
            "department": student.department,
            "year": student.year
        }
        for student in students
    ]


# Update student details
@router.put("/students/{student_id}")
def update_student(
    student_id: int,
    register_number: str,
    department: str,
    year: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Find student
    student = db.query(StudentProfile).filter(
        StudentProfile.id == student_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    # Check register number
    existing_student = db.query(StudentProfile).filter(
        StudentProfile.register_number == register_number,
        StudentProfile.id != student_id
    ).first()

    if existing_student:
        raise HTTPException(
            status_code=400,
            detail="Register number already exists"
        )

    # Update student details
    student.register_number = register_number
    student.department = department
    student.year = year

    db.commit()
    db.refresh(student)

    return {
        "message": "Student details updated successfully",
        "student_id": student.id,
        "register_number": student.register_number,
        "department": student.department,
        "year": student.year
    }


# Delete student
@router.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Find student profile
    student = db.query(StudentProfile).filter(
        StudentProfile.id == student_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    # Save user ID before deleting student profile
    user_id = student.user_id

    # Delete attendance records
    db.query(Attendance).filter(
        Attendance.student_id == student_id
    ).delete(synchronize_session=False)

    # Delete parent contact
    db.query(ParentContact).filter(
        ParentContact.student_id == student_id
    ).delete(synchronize_session=False)

    # Delete student profile
    db.delete(student)

    # Delete student's login account
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user:
        db.delete(user)

    db.commit()

    return {
        "message": "Student deleted successfully",
        "student_id": student_id
    }


# Get attendance records with optional filters
@router.get("/attendance")
def get_all_attendance(
    attendance_date: date | None = None,
    student_id: int | None = None,
    department: str | None = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = (
        db.query(Attendance, StudentProfile)
        .join(
            StudentProfile,
            Attendance.student_id == StudentProfile.id
        )
    )

    # Filter by date
    if attendance_date:
        start_datetime = datetime.combine(
            attendance_date,
            datetime.min.time()
        )

        end_datetime = start_datetime + timedelta(days=1)

        query = query.filter(
            Attendance.date >= start_datetime,
            Attendance.date < end_datetime
        )

    # Filter by student
    if student_id:
        query = query.filter(
            StudentProfile.id == student_id
        )

    # Filter by department
    if department:
        query = query.filter(
            StudentProfile.department == department
        )

    records = query.order_by(
        Attendance.date.desc()
    ).all()

    return [
        {
            "attendance_id": attendance.id,
            "student_id": student.id,
            "register_number": student.register_number,
            "department": student.department,
            "year": student.year,
            "date": attendance.date,
            "status": attendance.status
        }
        for attendance, student in records
    ]


# Update attendance status
@router.put("/attendance/{attendance_id}")
def update_attendance(
    attendance_id: int,
    status: AttendanceStatus,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Find attendance record
    attendance = db.query(Attendance).filter(
        Attendance.id == attendance_id
    ).first()

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found"
        )

    # Update attendance status
    attendance.status = status.value

    db.commit()
    db.refresh(attendance)

    return {
        "message": "Attendance updated successfully",
        "attendance_id": attendance.id,
        "student_id": attendance.student_id,
        "status": attendance.status,
        "date": attendance.date
    }