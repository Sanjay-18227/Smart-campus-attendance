from fastapi import FastAPI

from app.database import engine, Base


# =========================
# MODELS
# =========================

from app.models.user import User
from app.models.student_profile import StudentProfile
from app.models.parent_contact import ParentContact

from app.routes.attendance import router as attendance_router
from app.models.attendance import Attendance


# =========================
# ROUTES
# =========================

from app.routes.auth import router as auth_router
from app.routes.admin import router as admin_router
from app.routes.student import router as student_router



# =========================
# FASTAPI APP
# =========================

app = FastAPI(
    title="Smart Campus Attendance System",
    description="Backend API for the Smart Campus Attendance System",
    version="1.0.0",
)


# =========================
# CREATE DATABASE TABLES
# =========================

Base.metadata.create_all(bind=engine)


# =========================
# REGISTER ROUTERS
# =========================

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(student_router)

app.include_router(attendance_router)

# =========================
# ROOT ENDPOINT
# =========================

@app.get("/")
def root():
    return {
        "message": "Smart Campus Attendance System API is running"
    }