from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.student_profile import StudentProfile
from app.models.user import User
from app.models.user import UserRole
from app.services.auth import get_current_user


router = APIRouter(
    prefix="/student",
    tags=["Student"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/profile")
def create_student_profile(
    register_number: str,
    department: str,
    year: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=403,
            detail="Only students can create a student profile"
        )

    existing_profile = db.query(StudentProfile).filter(
        StudentProfile.user_id == current_user.id
    ).first()

    if existing_profile:
        raise HTTPException(
            status_code=400,
            detail="Student profile already exists"
        )

    existing_register_number = db.query(StudentProfile).filter(
        StudentProfile.register_number == register_number
    ).first()

    if existing_register_number:
        raise HTTPException(
            status_code=400,
            detail="Register number already exists"
        )

    profile = StudentProfile(
        user_id=current_user.id,
        register_number=register_number,
        department=department,
        year=year
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return {
        "message": "Student profile created successfully",
        "profile_id": profile.id,
        "register_number": profile.register_number,
        "department": profile.department,
        "year": profile.year
    }