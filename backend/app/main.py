from fastapi import FastAPI

from app.database import engine, Base
from app.models.user import User
from app.models.student_profile import StudentProfile


app = FastAPI(
    title="Smart Campus Attendance System",
    description="Backend API for the Smart Campus Attendance System",
    version="1.0.0",
)


# Create database tables
Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {
        "message": "Smart Campus Attendance System API is running"
    }