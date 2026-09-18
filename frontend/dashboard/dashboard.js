/* =========================================================
   SMART CAMPUS ATTENDANCE
   Dashboard Frontend Logic

   NOTE:
   Currently using demo data.
   Backend API will be connected later.
   ========================================================= */


/* =========================================================
   API CONFIGURATION & FUTURE FASTAPI PREP
   ========================================================= */

const API_BASE_URL = "";
const USE_API = false;

const API_ENDPOINTS = {
    AUTH_ME: "/api/auth/me",
    STUDENT_DASHBOARD: "/api/students/dashboard",
    STUDENT_ATTENDANCE_RECENT: "/api/students/attendance/recent",
    STUDENT_ATTENDANCE_OVERVIEW: "/api/students/attendance/overview",
    FACULTY_SUMMARY: "/api/faculty/summary",
    FACULTY_CLASSES: "/api/faculty/classes",
    FACULTY_ATTENDANCE: "/api/faculty/attendance",
    FACULTY_LOW_ATTENDANCE: "/api/faculty/low-attendance",
    FACULTY_SESSION_START: "/api/faculty/sessions/start",
    FACULTY_SESSION_STOP: "/api/faculty/sessions/stop",
    ADMIN_SUMMARY: "/api/admin/summary",
    ADMIN_STUDENTS: "/api/admin/students",
    ADMIN_FACULTY: "/api/admin/faculty",
    ADMIN_ATTENDANCE: "/api/admin/attendance",
    ADMIN_LOW_ATTENDANCE: "/api/admin/low-attendance",
    ADMIN_ATTENDANCE_CORRECTION: "/api/admin/attendance/corrections",
    ADMIN_REPORT_EXPORT: "/api/admin/reports/export"
};

function getAuthToken() {
    try {
        return localStorage.getItem("smartCampusAccessToken") || "";
    } catch (error) {
        return "";
    }
}

function buildApiUrl(endpoint) {
    if (!endpoint) return API_BASE_URL || "";
    if (/^https?:\/\//i.test(endpoint)) return endpoint;
    return `${API_BASE_URL}${endpoint}`;
}

async function apiRequest(endpoint, options = {}) {
    const url = buildApiUrl(endpoint);
    const token = getAuthToken();
    const headers = {
        Accept: "application/json",
        ...(options.headers || {})
    };

    if (!(options.headers && options.headers["Content-Type"] === false)) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const requestConfig = {
        ...options,
        headers
    };

    if (requestConfig.body && typeof requestConfig.body !== "string") {
        requestConfig.body = JSON.stringify(requestConfig.body);
    }

    const response = await fetch(url, requestConfig);

    if (!response.ok) {
        let errorPayload = null;
        try {
            errorPayload = await response.json();
        } catch (error) {
            errorPayload = null;
        }

        const detail = errorPayload?.detail || errorPayload?.message || `Request failed with status ${response.status}`;
        throw new Error(detail);
    }

    if (response.status === 204) return null;

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return response.json();
    }

    return response.text();
}

function handleApiFallback(error, label) {
    console.warn(`${label} API unavailable, using demo data.`, error);

    if (typeof showToast === "function") {
        showToast("API unavailable. Showing demo data.");
    }

    return true;
}

async function withApiFallback(endpoint, demoData, options = {}, label = "Data") {
    if (!USE_API) {
        return demoData;
    }

    try {
        const response = await apiRequest(endpoint, options);
        return response ?? demoData;
    } catch (error) {
        handleApiFallback(error, label);
        return demoData;
    }
}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function showPage(page) {

    const pages = document.querySelectorAll(".page");

    pages.forEach(item => {
        item.classList.remove("active-page");
    });


    const selectedPage =
        document.getElementById(page + "Page");

    if (selectedPage) {
        selectedPage.classList.add("active-page");
    }


    const navItems =
        document.querySelectorAll(".nav-item");

    navItems.forEach(item => {
        item.classList.remove("active");
        item.removeAttribute("aria-current");
    });


    const matchingNav =
        [...navItems].find(item =>
            item.getAttribute("onclick")?.includes(
                `showPage('${page}')`
            )
        );


    if (matchingNav) {
        matchingNav.classList.add("active");
        matchingNav.setAttribute("aria-current", "page");
    }

    // Update topbar heading dynamically
    const pageTitles = {
        dashboard: "Dashboard",
        faculty: "Faculty Dashboard",
        admin: "Admin Dashboard",
        attendance: "Attendance",
        students: "Students",
        reports: "Reports",
        profile: "Profile",
        settings: "Settings"
    };
    const headingTitle = document.querySelector(".page-heading h1");
    if (headingTitle && pageTitles[page]) {
        headingTitle.textContent = pageTitles[page];
    }

    // On mobile and tablet, close drawer after navigating
    if (window.innerWidth <= 992) {
        closeSidebar();
    }

    // Refresh chart layout if navigating back to dashboard
    if (page === "dashboard" && typeof attendanceChartInstance !== "undefined" && attendanceChartInstance) {
        setTimeout(() => {
            attendanceChartInstance.resize();
        }, 50);
    }

    if (page === "faculty" && typeof facultyChartInstance !== "undefined" && facultyChartInstance) {
        setTimeout(() => {
            facultyChartInstance.resize();
        }, 50);
    }
}


/* =========================================================
   ROLE SWITCHING
   ========================================================= */

function changeRole() {

    const selector =
        document.getElementById("roleSelector");

    const role =
        selector.value;


    const roleText =
        document.getElementById("userRole");


    if (role === "student") {

        roleText.textContent = "Student";

        showPage("dashboard");

        showToast(
            "Student view activated."
        );

    }


    else if (role === "faculty") {

        roleText.textContent = "Faculty";

        showPage("faculty");

        showToast(
            "Faculty view activated."
        );

    }


    else {

        roleText.textContent = "Administrator";

        showPage("admin");

        showToast(
            "Administrator view activated."
        );
    }
}


/* =========================================================
   START ATTENDANCE SESSION
   ========================================================= */

function startSession() {

    showToast(
        "Attendance session started."
    );
}


/* =========================================================
   QR
   ========================================================= */

function openQR() {

    showToast(
        "QR attendance module opened."
    );
}


/* =========================================================
   REPORT
   ========================================================= */

function viewReports() {

    showPage("reports");

    showToast(
        "Attendance reports opened."
    );
}


function viewAllAttendance() {

    showPage("attendance");

    showToast(
        "Attendance records opened."
    );
}


/* =========================================================
   RECENT ATTENDANCE TABLE (PHASE 3)
   ========================================================= */

// This demo data mirrors the future FastAPI attendance-record response shape.
const RECENT_ATTENDANCE_DEMO_DATA = [
    { name: "Arun Kumar", id: "ST001", time: "09:02 AM", verification: "QR + GPS", status: "Present" },
    { name: "Priya Kumar", id: "ST002", time: "09:05 AM", verification: "QR + GPS", status: "Present" },
    { name: "Karthik A", id: "ST003", time: "09:11 AM", verification: "QR", status: "Present" },
    { name: "Divya S", id: "ST004", time: "--", verification: "Manual", status: "Absent" }
];

function getStudentInitials(name) {
    return name
        .split(" ")
        .map(part => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderRecentAttendance() {
    const body = document.getElementById("recentAttendanceBody");
    const search = document.getElementById("attendanceSearch");
    const statusFilter = document.getElementById("attendanceStatusFilter");
    const verificationFilter = document.getElementById("attendanceVerificationFilter");
    const resultCount = document.getElementById("attendanceResultCount");

    if (!body || !search || !statusFilter || !verificationFilter || !resultCount) return;

    const searchTerm = search.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;
    const selectedVerification = verificationFilter.value;
    const filteredRecords = RECENT_ATTENDANCE_DEMO_DATA.filter(record => {
        const matchesSearch = !searchTerm ||
            record.name.toLowerCase().includes(searchTerm) ||
            record.id.toLowerCase().includes(searchTerm);
        const matchesStatus = selectedStatus === "all" || record.status === selectedStatus;
        const matchesVerification = selectedVerification === "all" || record.verification === selectedVerification;

        return matchesSearch && matchesStatus && matchesVerification;
    });

    resultCount.textContent = `Showing ${filteredRecords.length} of ${RECENT_ATTENDANCE_DEMO_DATA.length} records`;

    if (!filteredRecords.length) {
        body.innerHTML = `
            <tr>
                <td class="empty-attendance" colspan="5">
                    <strong>No attendance records found</strong>
                    <span>Try changing your search or filters.</span>
                </td>
            </tr>
        `;
        return;
    }

    body.innerHTML = filteredRecords.map(record => `
        <tr>
            <td>
                <div class="student-cell">
                    <div class="small-avatar" aria-hidden="true">${escapeHtml(getStudentInitials(record.name))}</div>
                    <strong>${escapeHtml(record.name)}</strong>
                </div>
            </td>
            <td>${escapeHtml(record.id)}</td>
            <td>${escapeHtml(record.time)}</td>
            <td>${escapeHtml(record.verification)}</td>
            <td><span class="status ${record.status.toLowerCase()}">${escapeHtml(record.status)}</span></td>
        </tr>
    `).join("");
}

function initializeRecentAttendance() {
    const search = document.getElementById("attendanceSearch");
    const statusFilter = document.getElementById("attendanceStatusFilter");
    const verificationFilter = document.getElementById("attendanceVerificationFilter");
    const clearButton = document.getElementById("clearAttendanceFilters");

    if (!search || !statusFilter || !verificationFilter || !clearButton) return;

    [search, statusFilter, verificationFilter].forEach(control => {
        control.addEventListener("input", renderRecentAttendance);
        control.addEventListener("change", renderRecentAttendance);
    });

    clearButton.addEventListener("click", () => {
        search.value = "";
        statusFilter.value = "all";
        verificationFilter.value = "all";
        renderRecentAttendance();
        search.focus();
    });

    renderRecentAttendance();
}


/* =========================================================
   FACULTY DASHBOARD (PHASE 4)
   ========================================================= */

const FACULTY_SUMMARY_DEMO_DATA = {
    name: "Dr. Meera Krishnan",
    department: "Department of Computer Science and Engineering",
    assignedClasses: 3,
    studentsEnrolled: 86,
    presentToday: 74,
    attendanceRate: 86
};

const FACULTY_CLASSES_DEMO_DATA = [
    { subject: "AI & Data Science", section: "Section A", time: "09:00 AM - 10:00 AM", students: 32, status: "Completed", attendanceRate: 88 },
    { subject: "Database Management Systems", section: "Section B", time: "11:00 AM - 12:00 PM", students: 28, status: "Upcoming", attendanceRate: 84 },
    { subject: "Deep Learning", section: "Section A", time: "02:00 PM - 03:00 PM", students: 26, status: "Upcoming", attendanceRate: 86 }
];

const FACULTY_ATTENDANCE_DEMO_DATA = [
    { subject: "AI & Data Science", section: "Section A", name: "Arun Kumar", id: "ST001", time: "09:02 AM", verification: "QR + GPS", status: "Present" },
    { subject: "AI & Data Science", section: "Section A", name: "Priya Kumar", id: "ST002", time: "09:05 AM", verification: "QR + GPS", status: "Present" },
    { subject: "AI & Data Science", section: "Section A", name: "Karthik A", id: "ST003", time: "09:11 AM", verification: "QR", status: "Present" },
    { subject: "AI & Data Science", section: "Section A", name: "Divya S", id: "ST004", time: "--", verification: "Manual", status: "Absent" },
    { subject: "Database Management Systems", section: "Section B", name: "Rahul M", id: "ST021", time: "11:04 AM", verification: "QR + GPS", status: "Present" },
    { subject: "Database Management Systems", section: "Section B", name: "Sneha N", id: "ST034", time: "--", verification: "Manual", status: "Absent" },
    { subject: "Database Management Systems", section: "Section B", name: "Vijay K", id: "ST041", time: "11:08 AM", verification: "QR", status: "Present" },
    { subject: "Deep Learning", section: "Section A", name: "Ananya R", id: "ST052", time: "02:03 PM", verification: "QR + GPS", status: "Present" },
    { subject: "Deep Learning", section: "Section A", name: "Mohan P", id: "ST063", time: "--", verification: "Manual", status: "Absent" }
];

const FACULTY_LOW_ATTENDANCE_DEMO_DATA = [
    { name: "Divya S", id: "ST004", percentage: 61 },
    { name: "Sneha N", id: "ST034", percentage: 68 },
    { name: "Mohan P", id: "ST063", percentage: 72 }
];

async function fetchFacultySummary() {
    return withApiFallback(API_ENDPOINTS.FACULTY_SUMMARY, FACULTY_SUMMARY_DEMO_DATA, { method: "GET" }, "Faculty summary");
}

async function fetchFacultyClasses() {
    return withApiFallback(API_ENDPOINTS.FACULTY_CLASSES, FACULTY_CLASSES_DEMO_DATA, { method: "GET" }, "Faculty classes");
}

async function fetchFacultyAttendance() {
    return withApiFallback(API_ENDPOINTS.FACULTY_ATTENDANCE, FACULTY_ATTENDANCE_DEMO_DATA, { method: "GET" }, "Faculty attendance");
}

async function fetchLowAttendanceStudents() {
    return withApiFallback(API_ENDPOINTS.FACULTY_LOW_ATTENDANCE, FACULTY_LOW_ATTENDANCE_DEMO_DATA, { method: "GET" }, "Faculty low attendance");
}

let facultyChartInstance = null;
let facultyAttendanceRecords = [];
let facultySessionActive = false;

function renderFacultySummary(summary) {
    const values = {
        facultyNameDisplay: summary.name,
        facultyDepartmentDisplay: summary.department,
        facultyAssignedClasses: summary.assignedClasses,
        facultyStudentsEnrolled: summary.studentsEnrolled,
        facultyPresentToday: summary.presentToday,
        facultyAttendanceRate: `${summary.attendanceRate}%`
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    const dateElement = document.getElementById("facultyDateDisplay");
    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }).toUpperCase();
    }
}

function renderFacultyClasses(classes) {
    const list = document.getElementById("facultyClassList");
    const subjectSelect = document.getElementById("facultySubjectSelect");
    const sectionSelect = document.getElementById("facultySectionSelect");

    if (!list || !subjectSelect || !sectionSelect) return;

    list.innerHTML = classes.map(classItem => `
        <div class="faculty-class-row">
            <div class="faculty-class-info">
                <strong>${escapeHtml(classItem.subject)}</strong>
                <span>${escapeHtml(classItem.section)} · ${escapeHtml(classItem.time)}</span>
            </div>
            <div class="faculty-class-meta">
                <strong>${classItem.students}</strong>
                <span>students</span>
            </div>
            <span class="session-badge ${classItem.status === "Completed" ? "active" : "inactive"}">${escapeHtml(classItem.status)}</span>
        </div>
    `).join("");

    subjectSelect.innerHTML = classes.map(classItem =>
        `<option value="${escapeHtml(classItem.subject)}">${escapeHtml(classItem.subject)}</option>`
    ).join("");

    sectionSelect.innerHTML = classes.map(classItem =>
        `<option value="${escapeHtml(classItem.subject)}|${escapeHtml(classItem.section)}">${escapeHtml(classItem.section)} · ${escapeHtml(classItem.subject)}</option>`
    ).join("");

    subjectSelect.addEventListener("change", () => {
        const matchingClass = classes.find(classItem => classItem.subject === subjectSelect.value);
        if (matchingClass) {
            sectionSelect.value = `${matchingClass.subject}|${matchingClass.section}`;
            renderFacultyAttendance();
        }
    });

    sectionSelect.addEventListener("change", renderFacultyAttendance);
}

function renderFacultyLowAttendance(students) {
    const list = document.getElementById("facultyLowAttendanceList");
    const count = document.getElementById("facultyLowAttendanceCount");
    if (!list || !count) return;

    count.textContent = students.length;
    list.innerHTML = students.map(student => `
        <div class="low-student">
            <div class="small-avatar">${escapeHtml(getStudentInitials(student.name))}</div>
            <div class="low-info">
                <strong>${escapeHtml(student.name)}</strong>
                <span>${escapeHtml(student.id)}</span>
            </div>
            <div>
                <strong class="attendance-low">${student.percentage}%</strong>
                <span class="faculty-low-alert">Alert</span>
            </div>
        </div>
    `).join("");
}

function renderFacultyAttendance() {
    const body = document.getElementById("facultyAttendanceBody");
    const search = document.getElementById("facultyAttendanceSearch");
    const statusFilter = document.getElementById("facultyStatusFilter");
    const verificationFilter = document.getElementById("facultyVerificationFilter");
    const sectionSelect = document.getElementById("facultySectionSelect");
    const resultCount = document.getElementById("facultyAttendanceResultCount");
    const scope = document.getElementById("facultyAttendanceScope");

    if (!body || !search || !statusFilter || !verificationFilter || !sectionSelect || !resultCount) return;

    const [selectedSubject, selectedSection] = sectionSelect.value.split("|");
    const searchTerm = search.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;
    const selectedVerification = verificationFilter.value;
    const classRecords = facultyAttendanceRecords.filter(record =>
        record.subject === selectedSubject && record.section === selectedSection
    );
    const filteredRecords = classRecords.filter(record => {
        const matchesSearch = !searchTerm || record.name.toLowerCase().includes(searchTerm) || record.id.toLowerCase().includes(searchTerm);
        const matchesStatus = selectedStatus === "all" || record.status === selectedStatus;
        const matchesVerification = selectedVerification === "all" || record.verification === selectedVerification;
        return matchesSearch && matchesStatus && matchesVerification;
    });

    if (scope) scope.textContent = `${selectedSubject} · ${selectedSection}`;
    resultCount.textContent = `Showing ${filteredRecords.length} of ${classRecords.length} records`;

    if (!filteredRecords.length) {
        body.innerHTML = `
            <tr><td class="empty-attendance" colspan="5">
                <strong>No attendance records found</strong>
                <span>Try changing your search or filters.</span>
            </td></tr>
        `;
        return;
    }

    body.innerHTML = filteredRecords.map(record => `
        <tr>
            <td><div class="student-cell"><div class="small-avatar" aria-hidden="true">${escapeHtml(getStudentInitials(record.name))}</div><strong>${escapeHtml(record.name)}</strong></div></td>
            <td>${escapeHtml(record.id)}</td>
            <td>${escapeHtml(record.time)}</td>
            <td>${escapeHtml(record.verification)}</td>
            <td><span class="status ${record.status.toLowerCase()}">${escapeHtml(record.status)}</span></td>
        </tr>
    `).join("");
}

function initializeFacultyAttendanceFilters() {
    const search = document.getElementById("facultyAttendanceSearch");
    const statusFilter = document.getElementById("facultyStatusFilter");
    const verificationFilter = document.getElementById("facultyVerificationFilter");
    const clearButton = document.getElementById("clearFacultyAttendanceFilters");

    if (!search || !statusFilter || !verificationFilter || !clearButton) return;

    [search, statusFilter, verificationFilter].forEach(control => {
        control.addEventListener("input", renderFacultyAttendance);
        control.addEventListener("change", renderFacultyAttendance);
    });

    clearButton.addEventListener("click", () => {
        search.value = "";
        statusFilter.value = "all";
        verificationFilter.value = "all";
        renderFacultyAttendance();
        search.focus();
    });
}

function initFacultyAttendanceChart(classes) {
    const canvas = document.getElementById("facultyAttendanceChart");
    if (!canvas || typeof Chart === "undefined") return;

    if (facultyChartInstance) facultyChartInstance.destroy();

    facultyChartInstance = new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
            labels: classes.map(classItem => classItem.subject),
            datasets: [{
                label: "Attendance Rate (%)",
                data: classes.map(classItem => classItem.attendanceRate),
                backgroundColor: ["#3b82f6", "#7c3aed", "#16a34a"],
                borderRadius: 6,
                maxBarThickness: 42
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: "#64748b", font: { family: "Inter, sans-serif", size: 10 } } },
                y: { min: 0, max: 100, ticks: { stepSize: 25, color: "#64748b", callback: value => `${value}%` }, grid: { color: "#edf0f5", borderDash: [4, 4] } }
            }
        }
    });
}

function updateFacultySessionUi() {
    const statusBadge = document.getElementById("facultySessionStatusBadge");
    const startButton = document.getElementById("facultyStartSession");
    const stopButton = document.getElementById("facultyStopSession");
    const startTime = document.getElementById("facultySessionStartTime");
    const qrStatus = document.getElementById("facultyQrStatus");
    const verificationQr = document.getElementById("facultyVerificationQr");

    if (!statusBadge || !startButton || !stopButton || !startTime || !qrStatus || !verificationQr) return;

    statusBadge.textContent = facultySessionActive ? "Active" : "Inactive";
    statusBadge.className = `session-badge ${facultySessionActive ? "active" : "inactive"}`;
    startButton.disabled = facultySessionActive;
    stopButton.disabled = !facultySessionActive;
    qrStatus.textContent = facultySessionActive ? "Active" : "Inactive";
    qrStatus.className = `status-indicator ${facultySessionActive ? "active" : "inactive"}`;
    verificationQr.textContent = facultySessionActive ? "Active" : "Inactive";
    startTime.textContent = facultySessionActive ? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "Not started";
}

function startFacultySession() {
    if (facultySessionActive) return;
    facultySessionActive = true;
    updateFacultySessionUi();
    showToast("Attendance session started successfully.");
}

function stopFacultySession() {
    if (!facultySessionActive) return;
    facultySessionActive = false;
    updateFacultySessionUi();
    showToast("Attendance session stopped successfully.");
}

function exportFacultyReport() {
    showToast("Report export will be connected to the backend.");
}

async function initializeFacultyDashboard() {
    const [summary, classes, attendance, lowAttendance] = await Promise.all([
        fetchFacultySummary(),
        fetchFacultyClasses(),
        fetchFacultyAttendance(),
        fetchLowAttendanceStudents()
    ]);

    facultyAttendanceRecords = attendance;
    renderFacultySummary(summary);
    renderFacultyClasses(classes);
    renderFacultyLowAttendance(lowAttendance);
    initializeFacultyAttendanceFilters();
    renderFacultyAttendance();
    initFacultyAttendanceChart(classes);
    updateFacultySessionUi();
}


/* =========================================================
   ADMIN DASHBOARD (PHASE 5)
   ========================================================= */

const ADMIN_SUMMARY_DEMO_DATA = {
    totalStudents: 1248,
    totalFaculty: 86,
    presentToday: 1071,
    attendanceRate: 86,
    activeSessions: 12
};

const ADMIN_STUDENTS_DEMO_DATA = [
    { name: "Arun Kumar", id: "ST001", department: "Computer Science · A", attendance: 92, status: "Active" },
    { name: "Priya Kumar", id: "ST002", department: "Computer Science · A", attendance: 88, status: "Active" },
    { name: "Karthik A", id: "ST003", department: "Information Technology · B", attendance: 81, status: "Active" },
    { name: "Divya S", id: "ST004", department: "Computer Science · A", attendance: 61, status: "Active" },
    { name: "Rahul M", id: "ST021", department: "Information Technology · B", attendance: 74, status: "Inactive" }
];

const ADMIN_FACULTY_DEMO_DATA = [
    { name: "Dr. Meera Krishnan", id: "FAC014", department: "Computer Science", classes: 3, status: "Active" },
    { name: "Prof. Arjun Rao", id: "FAC022", department: "Information Technology", classes: 4, status: "Active" },
    { name: "Dr. Nisha Menon", id: "FAC031", department: "Electronics", classes: 2, status: "Active" },
    { name: "Prof. Vikram Shah", id: "FAC045", department: "Computer Science", classes: 1, status: "Inactive" }
];

const ADMIN_ATTENDANCE_DEMO_DATA = [
    { name: "Arun Kumar", id: "ST001", subject: "AI & Data Science · Dr. Meera Krishnan", section: "Section A", time: "09:02 AM", verification: "QR + GPS", status: "Present" },
    { name: "Priya Kumar", id: "ST002", subject: "AI & Data Science · Dr. Meera Krishnan", section: "Section A", time: "09:05 AM", verification: "QR + GPS", status: "Present" },
    { name: "Karthik A", id: "ST003", subject: "AI & Data Science · Dr. Meera Krishnan", section: "Section A", time: "09:11 AM", verification: "QR", status: "Present" },
    { name: "Divya S", id: "ST004", subject: "AI & Data Science · Dr. Meera Krishnan", section: "Section A", time: "--", verification: "Manual", status: "Absent" },
    { name: "Rahul M", id: "ST021", subject: "Database Systems · Prof. Arjun Rao", section: "Section B", time: "11:04 AM", verification: "QR + GPS", status: "Present" },
    { name: "Sneha N", id: "ST034", subject: "Database Systems · Prof. Arjun Rao", section: "Section B", time: "--", verification: "Manual", status: "Absent" },
    { name: "Vijay K", id: "ST041", subject: "Database Systems · Prof. Arjun Rao", section: "Section B", time: "11:08 AM", verification: "QR", status: "Present" },
    { name: "Ananya R", id: "ST052", subject: "Deep Learning · Dr. Nisha Menon", section: "Section C", time: "02:03 PM", verification: "QR + GPS", status: "Present" }
];

const ADMIN_LOW_ATTENDANCE_DEMO_DATA = [
    { name: "Divya S", id: "ST004", department: "Computer Science · A", attendance: 61 },
    { name: "Rahul M", id: "ST021", department: "Information Technology · B", attendance: 74 },
    { name: "Sneha N", id: "ST034", department: "Information Technology · B", attendance: 68 }
];

async function fetchAdminSummary() {
    return withApiFallback(API_ENDPOINTS.ADMIN_SUMMARY, ADMIN_SUMMARY_DEMO_DATA, { method: "GET" }, "Admin summary");
}

async function fetchAdminStudents() {
    return withApiFallback(API_ENDPOINTS.ADMIN_STUDENTS, ADMIN_STUDENTS_DEMO_DATA, { method: "GET" }, "Admin students");
}

async function fetchAdminFaculty() {
    return withApiFallback(API_ENDPOINTS.ADMIN_FACULTY, ADMIN_FACULTY_DEMO_DATA, { method: "GET" }, "Admin faculty");
}

async function fetchAdminAttendance() {
    return withApiFallback(API_ENDPOINTS.ADMIN_ATTENDANCE, ADMIN_ATTENDANCE_DEMO_DATA, { method: "GET" }, "Admin attendance");
}

async function fetchAdminLowAttendanceStudents() {
    return withApiFallback(API_ENDPOINTS.ADMIN_LOW_ATTENDANCE, ADMIN_LOW_ATTENDANCE_DEMO_DATA, { method: "GET" }, "Admin low attendance");
}

let adminAttendanceRecords = [];
let adminChartInstance = null;

function renderAdminSummary(summary) {
    const values = {
        adminTotalStudents: summary.totalStudents.toLocaleString(),
        adminTotalFaculty: summary.totalFaculty,
        adminPresentToday: summary.presentToday.toLocaleString(),
        adminAttendanceRate: `${summary.attendanceRate}%`,
        adminActiveSessions: summary.activeSessions
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    const dateElement = document.getElementById("adminDateDisplay");
    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString("en-US", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        }).toUpperCase();
    }
}

function adminStatusMarkup(status) {
    const className = status === "Alert" ? "warning" : status.toLowerCase();
    return `<span class="admin-account-status ${className}">${escapeHtml(status)}</span>`;
}

function renderAdminStudents(students) {
    const body = document.getElementById("adminStudentBody");
    if (!body) return;

    const search = document.getElementById("adminStudentSearch").value.trim().toLowerCase();
    const status = document.getElementById("adminStudentStatusFilter").value;
    const filtered = students.filter(student => {
        const matchesSearch = !search || student.name.toLowerCase().includes(search) || student.id.toLowerCase().includes(search);
        return matchesSearch && (status === "all" || student.status === status);
    });

    document.getElementById("adminStudentResultCount").textContent = `Showing ${filtered.length} of ${students.length} records`;
    body.innerHTML = filtered.length ? filtered.map(student => `
        <tr><td><div class="student-cell"><div class="small-avatar" aria-hidden="true">${escapeHtml(getStudentInitials(student.name))}</div><strong>${escapeHtml(student.name)}</strong></div></td>
        <td>${escapeHtml(student.id)}</td><td>${escapeHtml(student.department)}</td><td>${student.attendance}%</td>
        <td>${adminStatusMarkup(student.status)}</td><td><button class="admin-action-btn" type="button" onclick="showToast('Student details opened (demo).')">View Details</button></td></tr>
    `).join("") : `<tr><td class="empty-attendance" colspan="6"><strong>No student records found</strong><span>Try changing your search or filters.</span></td></tr>`;
}

function renderAdminFaculty(faculty) {
    const body = document.getElementById("adminFacultyBody");
    const departmentFilter = document.getElementById("adminFacultyDepartmentFilter");
    if (!body || !departmentFilter) return;

    const search = document.getElementById("adminFacultySearch").value.trim().toLowerCase();
    const department = departmentFilter.value;
    const filtered = faculty.filter(member => {
        const matchesSearch = !search || member.name.toLowerCase().includes(search) || member.id.toLowerCase().includes(search);
        return matchesSearch && (department === "all" || member.department === department);
    });

    document.getElementById("adminFacultyResultCount").textContent = `Showing ${filtered.length} of ${faculty.length} records`;
    body.innerHTML = filtered.length ? filtered.map(member => `
        <tr><td><div class="student-cell"><div class="small-avatar" aria-hidden="true">${escapeHtml(getStudentInitials(member.name))}</div><strong>${escapeHtml(member.name)}</strong></div></td>
        <td>${escapeHtml(member.id)}</td><td>${escapeHtml(member.department)}</td><td>${member.classes}</td>
        <td>${adminStatusMarkup(member.status)}</td><td><button class="admin-action-btn" type="button" onclick="showToast('Faculty details opened (demo).')">View Details</button></td></tr>
    `).join("") : `<tr><td class="empty-attendance" colspan="6"><strong>No faculty records found</strong><span>Try changing your search or filters.</span></td></tr>`;
}

function renderAdminAttendance() {
    const body = document.getElementById("adminAttendanceBody");
    const search = document.getElementById("adminAttendanceSearch");
    const status = document.getElementById("adminAttendanceStatusFilter");
    const verification = document.getElementById("adminAttendanceVerificationFilter");
    const section = document.getElementById("adminAttendanceSectionFilter");
    if (!body || !search || !status || !verification || !section) return;

    const searchTerm = search.value.trim().toLowerCase();
    const filtered = adminAttendanceRecords.filter(record => {
        const matchesSearch = !searchTerm || record.name.toLowerCase().includes(searchTerm) || record.id.toLowerCase().includes(searchTerm);
        const matchesStatus = status.value === "all" || record.status === status.value;
        const matchesVerification = verification.value === "all" || record.verification === verification.value;
        const matchesSection = section.value === "all" || record.section === section.value;
        return matchesSearch && matchesStatus && matchesVerification && matchesSection;
    });

    document.getElementById("adminAttendanceResultCount").textContent = `Showing ${filtered.length} of ${adminAttendanceRecords.length} records`;
    body.innerHTML = filtered.length ? filtered.map(record => `
        <tr><td><div class="student-cell"><div class="small-avatar" aria-hidden="true">${escapeHtml(getStudentInitials(record.name))}</div><strong>${escapeHtml(record.name)}</strong></div></td>
        <td>${escapeHtml(record.id)}</td><td>${escapeHtml(record.subject)}</td><td>${escapeHtml(record.section)}</td>
        <td>${escapeHtml(record.time)}</td><td>${escapeHtml(record.verification)}</td><td><span class="status ${record.status.toLowerCase()}">${escapeHtml(record.status)}</span></td></tr>
    `).join("") : `<tr><td class="empty-attendance" colspan="7"><strong>No attendance records found</strong><span>Try changing your search or filters.</span></td></tr>`;
}

function renderAdminLowAttendance(students) {
    const body = document.getElementById("adminLowAttendanceBody");
    const count = document.getElementById("adminLowAttendanceCount");
    if (!body || !count) return;

    count.textContent = students.length;
    body.innerHTML = students.map(student => `
        <tr><td><div class="student-cell"><div class="small-avatar" aria-hidden="true">${escapeHtml(getStudentInitials(student.name))}</div><strong>${escapeHtml(student.name)}</strong></div></td>
        <td>${escapeHtml(student.id)}</td><td>${escapeHtml(student.department)}</td><td><strong class="attendance-low">${student.attendance}%</strong></td>
        <td>${adminStatusMarkup("Alert")}</td><td><button class="admin-action-btn" type="button" onclick="showToast('Low attendance details opened (demo).')">View Details</button></td></tr>
    `).join("");
}

function populateAdminFilters(students, faculty, attendance) {
    const departmentFilter = document.getElementById("adminFacultyDepartmentFilter");
    const sectionFilter = document.getElementById("adminAttendanceSectionFilter");
    const correctionRecord = document.getElementById("adminCorrectionRecord");

    if (departmentFilter) {
        const departments = [...new Set(faculty.map(member => member.department))];
        departmentFilter.innerHTML = `<option value="all">All Departments</option>${departments.map(department => `<option value="${escapeHtml(department)}">${escapeHtml(department)}</option>`).join("")}`;
    }
    if (sectionFilter) {
        const sections = [...new Set(attendance.map(record => record.section))];
        sectionFilter.innerHTML = `<option value="all">All Sections</option>${sections.map(section => `<option value="${escapeHtml(section)}">${escapeHtml(section)}</option>`).join("")}`;
    }
    if (correctionRecord) {
        correctionRecord.innerHTML = attendance.map((record, index) => `<option value="${index}">${escapeHtml(record.name)} · ${escapeHtml(record.id)} · ${escapeHtml(record.time)}</option>`).join("");
    }
}

function initializeAdminFilters(students, faculty) {
    const studentSearch = document.getElementById("adminStudentSearch");
    const studentStatus = document.getElementById("adminStudentStatusFilter");
    const studentClear = document.getElementById("adminStudentClearFilters");
    const facultySearch = document.getElementById("adminFacultySearch");
    const facultyDepartment = document.getElementById("adminFacultyDepartmentFilter");
    const facultyClear = document.getElementById("adminFacultyClearFilters");
    const attendanceControls = ["adminAttendanceSearch", "adminAttendanceStatusFilter", "adminAttendanceVerificationFilter", "adminAttendanceSectionFilter"]
        .map(id => document.getElementById(id));
    const attendanceClear = document.getElementById("adminAttendanceClearFilters");

    [studentSearch, studentStatus].forEach(control => control?.addEventListener("input", () => renderAdminStudents(students)));
    [studentSearch, studentStatus].forEach(control => control?.addEventListener("change", () => renderAdminStudents(students)));
    studentClear?.addEventListener("click", () => {
        studentSearch.value = "";
        studentStatus.value = "all";
        renderAdminStudents(students);
        studentSearch.focus();
    });

    [facultySearch, facultyDepartment].forEach(control => control?.addEventListener("input", () => renderAdminFaculty(faculty)));
    [facultySearch, facultyDepartment].forEach(control => control?.addEventListener("change", () => renderAdminFaculty(faculty)));
    facultyClear?.addEventListener("click", () => {
        facultySearch.value = "";
        facultyDepartment.value = "all";
        renderAdminFaculty(faculty);
        facultySearch.focus();
    });

    attendanceControls.forEach(control => {
        control?.addEventListener("input", renderAdminAttendance);
        control?.addEventListener("change", renderAdminAttendance);
    });
    attendanceClear?.addEventListener("click", () => {
        attendanceControls[0].value = "";
        attendanceControls[1].value = "all";
        attendanceControls[2].value = "all";
        attendanceControls[3].value = "all";
        renderAdminAttendance();
        attendanceControls[0].focus();
    });
}

function initAdminAttendanceChart() {
    const canvas = document.getElementById("adminAttendanceChart");
    if (!canvas || typeof Chart === "undefined") return;
    if (adminChartInstance) adminChartInstance.destroy();

    adminChartInstance = new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
            labels: ["Computer Science", "Information Technology", "Electronics"],
            datasets: [{ label: "Attendance Rate (%)", data: [89, 84, 82], backgroundColor: ["#2563eb", "#7c3aed", "#16a34a"], borderRadius: 6, maxBarThickness: 38 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: "#64748b", font: { family: "Inter, sans-serif", size: 10 } } },
                y: { min: 0, max: 100, ticks: { stepSize: 25, color: "#64748b", callback: value => `${value}%` }, grid: { color: "#edf0f5", borderDash: [4, 4] } }
            }
        }
    });
}

function correctAttendanceRecord() {
    const recordSelect = document.getElementById("adminCorrectionRecord");
    const date = document.getElementById("adminCorrectionDate");
    const status = document.getElementById("adminCorrectionStatus");
    const reason = document.getElementById("adminCorrectionReason");

    if (!recordSelect || !date || !status || !reason) return;
    if (!recordSelect.value || !date.value || !reason.value.trim()) {
        showToast("Complete the correction fields before saving.");
        return;
    }

    const record = adminAttendanceRecords[Number(recordSelect.value)];
    if (record) record.status = status.value;
    showToast("Attendance correction saved (demo).");
    reason.value = "";
}

function resetAdminCorrection() {
    const date = document.getElementById("adminCorrectionDate");
    const reason = document.getElementById("adminCorrectionReason");
    if (date) date.value = "";
    if (reason) reason.value = "";
    showToast("Attendance correction cancelled.");
}

function exportAdminReport() {
    showToast("Report export will be connected to the backend.");
}

async function initializeAdminDashboard() {
    const [summary, students, faculty, attendance, lowAttendance] = await Promise.all([
        fetchAdminSummary(),
        fetchAdminStudents(),
        fetchAdminFaculty(),
        fetchAdminAttendance(),
        fetchAdminLowAttendanceStudents()
    ]);

    adminAttendanceRecords = attendance;
    renderAdminSummary(summary);
    populateAdminFilters(students, faculty, attendance);
    renderAdminStudents(students);
    renderAdminFaculty(faculty);
    renderAdminAttendance();
    renderAdminLowAttendance(lowAttendance);
    initializeAdminFilters(students, faculty);
    initAdminAttendanceChart();
}


/* =========================================================
   LOW ATTENDANCE
   ========================================================= */

function viewLowAttendance() {

    showPage("students");

    showToast(
        "Showing students below 75%."
    );
}


/* =========================================================
   EXPORT
   ========================================================= */

function exportReport() {

    showToast(
        "Report export will connect to backend API."
    );
}


/* =========================================================
   DYNAMIC DATE & GREETING
   ========================================================= */

function updateGreetingAndDate() {
    const now = new Date();

    // Dynamic Date (e.g. THURSDAY, SEPTEMBER 10, 2026)
    const dateElement = document.getElementById("currentDateDisplay");
    if (dateElement) {
        const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
        dateElement.textContent = now.toLocaleDateString("en-US", options).toUpperCase();
    }

    // Dynamic Time-based Greeting
    const greetingElement = document.getElementById("timeGreeting");
    if (greetingElement) {
        const hour = now.getHours();
        let greeting = "Good evening";
        if (hour >= 5 && hour < 12) {
            greeting = "Good morning";
        } else if (hour >= 12 && hour < 17) {
            greeting = "Good afternoon";
        }
        greetingElement.textContent = greeting;
    }
}


/* =========================================================
   NOTIFICATION DROPDOWN
   ========================================================= */

function toggleNotificationDropdown(event) {
    if (event) {
        event.stopPropagation();
    }

    const dropdown = document.getElementById("notificationDropdown");
    const btn = document.getElementById("notificationBtn");

    if (!dropdown) return;

    // Close profile dropdown if open
    closeProfileDropdown();

    const isOpen = dropdown.classList.contains("show");
    if (isOpen) {
        closeNotificationDropdown();
    } else {
        dropdown.classList.add("show");
        if (btn) btn.setAttribute("aria-expanded", "true");
    }
}

function closeNotificationDropdown() {
    const dropdown = document.getElementById("notificationDropdown");
    const btn = document.getElementById("notificationBtn");

    if (dropdown) {
        dropdown.classList.remove("show");
    }
    if (btn) {
        btn.setAttribute("aria-expanded", "false");
    }
}

function clearNotifications() {
    const dot = document.querySelector(".notification-dot");
    if (dot) {
        dot.style.display = "none";
    }

    const badge = document.querySelector(".notif-badge");
    if (badge) {
        badge.textContent = "0 New";
        badge.style.background = "#f1f5f9";
        badge.style.color = "#64748b";
    }

    const unreadItems = document.querySelectorAll(".notification-item.unread");
    unreadItems.forEach(item => item.classList.remove("unread"));

    closeNotificationDropdown();
    showToast("All notifications marked as read.");
}

function showNotification() {
    toggleNotificationDropdown();
}


/* =========================================================
   USER PROFILE DROPDOWN
   ========================================================= */

function toggleProfileDropdown(event) {
    if (event) {
        event.stopPropagation();
    }

    const dropdown = document.getElementById("profileDropdown");
    const btn = document.getElementById("userProfileBtn");

    if (!dropdown) return;

    // Close notification dropdown if open
    closeNotificationDropdown();

    const isOpen = dropdown.classList.contains("show");
    if (isOpen) {
        closeProfileDropdown();
    } else {
        dropdown.classList.add("show");
        if (btn) btn.setAttribute("aria-expanded", "true");
    }
}

function closeProfileDropdown() {
    const dropdown = document.getElementById("profileDropdown");
    const btn = document.getElementById("userProfileBtn");

    if (dropdown) {
        dropdown.classList.remove("show");
    }
    if (btn) {
        btn.setAttribute("aria-expanded", "false");
    }
}

function selectProfileOption(page) {
    closeProfileDropdown();
    showPage(page);
    showToast(`Navigated to ${page.charAt(0).toUpperCase() + page.slice(1)}.`);
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {
    closeProfileDropdown();

    const confirmLogout =
        confirm("Are you sure you want to logout?");

    if (confirmLogout) {

        showToast(
            "Logout functionality will connect to authentication."
        );
    }
}


/* =========================================================
   SIDEBAR & DRAWER NAVIGATION
   ========================================================= */

function openSidebar() {
    const sidebar = document.querySelector(".sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    const menuBtn = document.getElementById("mobileMenuBtn");

    if (sidebar) {
        sidebar.classList.add("open");
    }
    if (backdrop) {
        backdrop.classList.add("show");
    }
    document.body.classList.add("sidebar-open");

    if (menuBtn) {
        menuBtn.setAttribute("aria-expanded", "true");
    }
}

function closeSidebar() {
    const sidebar = document.querySelector(".sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    const menuBtn = document.getElementById("mobileMenuBtn");

    if (sidebar) {
        sidebar.classList.remove("open");
    }
    if (backdrop) {
        backdrop.classList.remove("show");
    }
    document.body.classList.remove("sidebar-open");

    if (menuBtn) {
        menuBtn.setAttribute("aria-expanded", "false");
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");
    if (sidebar && sidebar.classList.contains("open")) {
        closeSidebar();
    } else {
        openSidebar();
    }
}


/* =========================================================
   TOAST MESSAGE
   ========================================================= */

function showToast(message) {

    const toast =
        document.getElementById("toast");

    const messageElement =
        document.getElementById("toastMessage");


    messageElement.textContent =
        message;


    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);
}


/* =========================================================
   ATTENDANCE CHART CONTROLLER (PHASE 2)
   ========================================================= */

// Global reference to the Chart.js instance
let attendanceChartInstance = null;

// Realistic demo dataset structured for future FastAPI backend mapping
const ATTENDANCE_DEMO_DATA = {
    week: {
        subtitle: "Attendance performance over the week",
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        details: [
            { label: "Monday", present: 38, absent: 12, total: 50, percentage: 76 },
            { label: "Tuesday", present: 42, absent: 8, total: 50, percentage: 84 },
            { label: "Wednesday", present: 40, absent: 10, total: 50, percentage: 80 },
            { label: "Thursday", present: 45, absent: 5, total: 50, percentage: 90 },
            { label: "Friday", present: 42, absent: 8, total: 50, percentage: 84 }
        ]
    },
    month: {
        subtitle: "Attendance performance over the last 4 weeks",
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        details: [
            { label: "Week 1", present: 210, absent: 40, total: 250, percentage: 84 },
            { label: "Week 2", present: 222, absent: 28, total: 250, percentage: 89 },
            { label: "Week 3", present: 198, absent: 52, total: 250, percentage: 79 },
            { label: "Week 4", present: 215, absent: 35, total: 250, percentage: 86 }
        ]
    },
    semester: {
        subtitle: "Attendance performance over the current semester",
        labels: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
        details: [
            { label: "August", present: 924, absent: 126, total: 1050, percentage: 88 },
            { label: "September", present: 892, absent: 158, total: 1050, percentage: 85 },
            { label: "October", present: 945, absent: 105, total: 1050, percentage: 90 },
            { label: "November", present: 861, absent: 189, total: 1050, percentage: 82 },
            { label: "December", present: 914, absent: 136, total: 1050, percentage: 87 },
            { label: "January", present: 956, absent: 94, total: 1050, percentage: 91 }
        ]
    }
};

/**
 * Normalizes input period string to key ('week', 'month', 'semester').
 */
function normalizePeriodKey(period) {
    if (!period) return "week";
    const lower = String(period).toLowerCase().trim();
    if (lower.includes("week")) return "week";
    if (lower.includes("month")) return "month";
    if (lower.includes("sem")) return "semester";
    return "week";
}

/**
 * Data fetcher abstraction.
 * Currently returns mock demo data.
 * Can be effortlessly swapped with:
 * return (await fetch(`/api/attendance/overview?period=${period}`)).json();
 */
async function fetchAttendanceChartData(period = "week") {
    const key = normalizePeriodKey(period);

    if (USE_API) {
        try {
            const endpoint = `${API_ENDPOINTS.STUDENT_ATTENDANCE_OVERVIEW}?period=${key}`;
            const data = await apiRequest(endpoint, { method: "GET" });
            if (data && data.labels && data.details) {
                return data;
            }
        } catch (error) {
            handleApiFallback(error, "Attendance overview");
        }
    }

    const data = ATTENDANCE_DEMO_DATA[key] || ATTENDANCE_DEMO_DATA.week;
    return Promise.resolve(data);
}

/**
 * Handles period selector change and dynamically updates chart data.
 */
async function handlePeriodChange(period) {
    const key = normalizePeriodKey(period);

    try {
        const data = await fetchAttendanceChartData(key);

        // Update subtitle text dynamically
        const subtitle = document.getElementById("attendanceChartSubtitle");
        if (subtitle && data.subtitle) {
            subtitle.textContent = data.subtitle;
        }

        if (!attendanceChartInstance) {
            await initAttendanceChart(key);
            return;
        }

        // Cache active dataset for hover tooltip rendering
        attendanceChartInstance._activePeriodData = data;

        // Dynamically update labels and percentages
        attendanceChartInstance.data.labels = data.labels;
        attendanceChartInstance.data.datasets[0].data = data.details.map(d => d.percentage);

        // Smoothly animate transition
        attendanceChartInstance.update();

        const periodLabels = {
            week: "This Week",
            month: "This Month",
            semester: "This Semester"
        };
        showToast(`Chart updated: ${periodLabels[key] || key}.`);
    } catch (err) {
        console.error("Failed to update attendance chart:", err);
        showToast("Could not update attendance chart data.");
    }
}

// Backward compatibility & event handler aliases
window.handlePeriodChange = handlePeriodChange;
window.changePeriod = handlePeriodChange;
window.changeAttendancePeriod = handlePeriodChange;
window.fetchAttendanceChartData = fetchAttendanceChartData;
window.initAttendanceChart = initAttendanceChart;
window.normalizePeriodKey = normalizePeriodKey;
window.ATTENDANCE_DEMO_DATA = ATTENDANCE_DEMO_DATA;

/**
 * Initializes the Chart.js Attendance Bar Chart.
 */
async function initAttendanceChart(initialPeriod = "week") {
    const canvas = document.getElementById("attendanceChart");
    if (!canvas) return;

    if (typeof Chart === "undefined") {
        console.warn("Chart.js is not loaded yet.");
        return;
    }

    const key = normalizePeriodKey(initialPeriod);
    const data = await fetchAttendanceChartData(key);

    // Destroy existing instance to prevent canvas re-use errors
    if (attendanceChartInstance) {
        attendanceChartInstance.destroy();
        attendanceChartInstance = null;
    }

    const ctx = canvas.getContext("2d");

    attendanceChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: "Attendance Rate (%)",
                    data: data.details.map(d => d.percentage),
                    backgroundColor: "#3b82f6",
                    hoverBackgroundColor: "#1d4ed8",
                    borderRadius: {
                        topLeft: 6,
                        topRight: 6,
                        bottomLeft: 2,
                        bottomRight: 2
                    },
                    borderSkipped: false,
                    maxBarThickness: 38,
                    categoryPercentage: 0.65,
                    barPercentage: 0.75
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 500,
                easing: "easeOutQuart"
            },
            interaction: {
                mode: "index",
                intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: "rgba(16, 24, 40, 0.95)",
                    titleColor: "#ffffff",
                    titleFont: {
                        family: "Inter, sans-serif",
                        size: 13,
                        weight: "600"
                    },
                    bodyColor: "#f1f5f9",
                    bodyFont: {
                        family: "Inter, sans-serif",
                        size: 12,
                        weight: "400"
                    },
                    footerColor: "#94a3b8",
                    footerFont: {
                        family: "Inter, sans-serif",
                        size: 11,
                        weight: "500"
                    },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        title: function (tooltipItems) {
                            if (!tooltipItems || !tooltipItems.length) return "";
                            const index = tooltipItems[0].dataIndex;
                            const activeData = attendanceChartInstance?._activePeriodData?.details[index];
                            return activeData ? activeData.label : tooltipItems[0].label;
                        },
                        label: function (context) {
                            return `Attendance: ${context.parsed.y}%`;
                        },
                        afterBody: function (tooltipItems) {
                            if (!tooltipItems || !tooltipItems.length) return [];
                            const index = tooltipItems[0].dataIndex;
                            const activeData = attendanceChartInstance?._activePeriodData?.details[index];
                            if (!activeData) return [];
                            return [
                                `Present: ${activeData.present} students`,
                                `Absent: ${activeData.absent} students`,
                                `Total: ${activeData.total} students`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: "#64748b",
                        font: {
                            family: "Inter, sans-serif",
                            size: 11,
                            weight: "500"
                        }
                    }
                },
                y: {
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 25,
                        color: "#64748b",
                        font: {
                            family: "Inter, sans-serif",
                            size: 11,
                            weight: "500"
                        },
                        callback: function (value) {
                            return value + "%";
                        }
                    },
                    grid: {
                        color: "#edf0f5",
                        borderDash: [4, 4],
                        drawBorder: false
                    }
                }
            }
        }
    });

    // Cache active dataset on the chart instance
    attendanceChartInstance._activePeriodData = data;
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "Smart Campus Dashboard loaded successfully."
        );

        // Render real-time date and time-based greeting
        updateGreetingAndDate();

        // Initialize attendance overview chart (Phase 2)
        initAttendanceChart();

        // Initialize recent attendance records (Phase 3)
        initializeRecentAttendance();

        // Initialize faculty dashboard demo data and controls (Phase 4)
        initializeFacultyDashboard();

        // Initialize admin dashboard demo data and controls (Phase 5)
        initializeAdminDashboard();

        // Close dropdowns when clicking outside
        document.addEventListener("click", (e) => {
            const profileWrapper = document.querySelector(".user-profile-wrapper");
            if (profileWrapper && !profileWrapper.contains(e.target)) {
                closeProfileDropdown();
            }

            const notifWrapper = document.querySelector(".notification-wrapper");
            if (notifWrapper && !notifWrapper.contains(e.target)) {
                closeNotificationDropdown();
            }
        });

        // Close sidebar and dropdowns if Escape key is pressed
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                closeSidebar();
                closeProfileDropdown();
                closeNotificationDropdown();
            }
        });

        // Close drawer if window is resized back to desktop breakpoint
        window.addEventListener("resize", () => {
            if (window.innerWidth > 992) {
                closeSidebar();
            }
        });

    }
);