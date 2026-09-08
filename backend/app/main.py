from fastapi import FastAPI

from app.database import engine, Base

# Models
from app.models.user import User
from app.models.student_profile import StudentProfile
from app.models.parent_contact import ParentContact
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.attendance import Attendance

# Routes
from app.routes.auth import router as auth_router
from app.routes.admin import router as admin_router


app = FastAPI(
    title="Smart Campus Attendance System",
    description="Backend API for the Smart Campus Attendance System",
    version="1.0.0",
)


# Create database tables
Base.metadata.create_all(bind=engine)


# Register API routers
app.include_router(auth_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {
        "message": "Smart Campus Attendance System API is running"
    }