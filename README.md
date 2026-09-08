# 🎓 Smart Campus Attendance System

A smart, secure, and automated campus attendance management system that uses **QR code validation, GPS verification, role-based authentication, and automated attendance monitoring** to make attendance faster, more reliable, and easier to manage.

---

## 📌 Project Overview

The **Smart Campus Attendance System** is a web-based attendance platform designed for colleges and educational institutions.

Students can access the attendance system by scanning a **daily rotating QR code**. The system verifies the student's **GPS location** to ensure that attendance is being marked from within the authorized college campus.

The system automatically calculates attendance percentages and can notify parents when a student's attendance falls below the required **75% threshold**.

The backend is responsible for authentication, authorization, attendance validation, database management, QR token validation, GPS verification, and notification-related data.

---

## 🎯 Objectives

The main objectives of this project are:

- Replace traditional manual attendance methods.
- Prevent attendance marking from outside the campus.
- Use QR codes for quick attendance access.
- Change the QR token automatically every 24 hours.
- Verify student location using GPS.
- Maintain accurate attendance records.
- Calculate attendance percentages automatically.
- Notify parents when attendance falls below 75%.
- Provide separate interfaces for students, faculty, and administrators.
- Prevent unauthorized modification of attendance records.
- Provide a scalable and maintainable backend architecture.

---

## ✨ Key Features

### 🔐 Authentication & Authorization

- Secure user login.
- JWT-based authentication.
- Password hashing.
- Role-based access control.
- Supports:
  - Student
  - Faculty
  - Admin

### 📱 QR Code Attendance

- Students scan the campus QR code.
- QR code contains a rotating token.
- QR token changes every 24 hours.
- Expired tokens cannot be used.
- Backend validates the QR token before marking attendance.

### 📍 GPS Verification

The system verifies the student's location before accepting attendance.

The backend checks:

```text
Student GPS Location
        ↓
Calculate distance from campus
        ↓
Compare with allowed campus radius
        ↓
Inside radius → Continue
Outside radius → Reject attendance