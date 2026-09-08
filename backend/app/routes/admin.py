from fastapi import APIRouter, Depends

from app.models.user import User
from app.services.permissions import require_admin


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get("/test")
def admin_test(
    current_user: User = Depends(require_admin)
):
    return {
        "message": "Admin access granted",
        "admin_id": current_user.id,
        "admin_name": current_user.name
    }