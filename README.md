# Staff Side Service — Feature S-2: Attendance Management

Production-ready Node.js Express microservice implementing the **Attendance Management** module for staff-side operations with multi-tenancy, soft deletion, class-teacher authorization, and validation.

---

## 🚀 Key Features & Architectural Requirements

- **Multi-Tenant Model (`withTenant()`)**: Scoped data access isolation using `withTenant(tenantId)`.
- **Composite Unique Index**: Unique constraint on `(tenantId, studentId, date)` ensuring no duplicate attendance entries.
- **Soft Deletion (`paranoid: true`)**: Enabled soft deletes preserving historical data using `deletedAt`.
- **Base Architecture**:
  - `BaseRepository`: Abstract repository pattern handling tenant scoping and CRUD operations.
  - `BaseController`: Controller abstraction with standard response helpers (`sendSuccess`, `sendCreated`, `sendError`).
  - `catchAsync`: Wrapper function handling async errors cleanly across all controllers.
- **Class Teacher Authorization**: Enforces that only the designated class teacher of a section can mark or correct attendance.
- **Correction Reason Enforcement**: Mandatory non-empty reason requirement for all attendance corrections.
- **Input Validation**: `express-validator` middleware validating bulk attendance payloads and correction requests.

---

## 📡 API Endpoints

Base Path: `/api/v1/staff/attendance`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/v1/staff/attendance/bulk` | Bulk attendance marking/upsert for a section |
| **GET** | `/api/v1/staff/attendance/:sectionId` | Fetch section-wise attendance records |
| **PATCH** | `/api/v1/staff/attendance/:id` | Correct an attendance entry (Requires non-empty reason) |
| **GET** | `/api/v1/staff/attendance/summary/:studentId` | Get student attendance metrics & summary |

---

## 📥 Sample Request Payloads & Headers

### 1. Bulk Attendance Marking
`POST /api/v1/staff/attendance/bulk`
**Headers:**
- `x-tenant-id`: `tenant-school-101`
- `x-teacher-id`: `teacher-101`

**Body:**
```json
{
  "sectionId": "section-8A",
  "date": "2026-08-17",
  "records": [
    { "studentId": "student-101", "status": "PRESENT" },
    { "studentId": "student-102", "status": "ABSENT", "remarks": "Sick leave" }
  ]
}
```

### 2. Correct Attendance
`PATCH /api/v1/staff/attendance/attendance-uuid-1234`
**Headers:**
- `x-tenant-id`: `tenant-school-101`
- `x-teacher-id`: `teacher-101`

**Body:**
```json
{
  "status": "PRESENT",
  "reason": "Medical certificate verified by admin"
}
```

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **ORM**: Sequelize (SQLite / PostgreSQL)
- **Validation**: express-validator
- **Testing**: Jest & Supertest

---

## ⚙️ Getting Started

### Installation
```bash
npm install
```

### Run Server
```bash
npm start
# or for development with auto-reload:
npm run dev
```

### Run Test Suite
```bash
npm test
```
