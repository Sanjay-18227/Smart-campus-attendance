from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.models.student_profile import StudentProfile
from app.models.attendance import Attendance
from app.models.parent_contact import ParentContact
from app.services.permissions import require_admin


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

    # Delete the student's login account
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