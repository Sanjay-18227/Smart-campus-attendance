from fastapi import Depends, HTTPException

from app.models.user import User, UserRole
from app.services.auth import get_current_user


def require_admin(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return current_user


def require_faculty(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.FACULTY:
        raise HTTPException(
            status_code=403,
            detail="Faculty access required"
        )

    return current_user
def require_student(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=403,
            detail="Student access required"
        )

    return current_user