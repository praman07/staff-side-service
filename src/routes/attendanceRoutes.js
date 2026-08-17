import { Router } from "express";
import { AttendanceController } from "../controllers/AttendanceController.js";
import {
  validateBulkAttendance,
  validateAttendanceCorrection,
} from "../middlewares/validateAttendance.js";

const router = Router();
const attendanceController = new AttendanceController();

// GET /api/v1/staff/attendance/summary/:studentId (placed before :sectionId to avoid route clash if sectionId matches 'summary')
router.get("/summary/:studentId", attendanceController.getStudentSummary);

// POST /api/v1/staff/attendance/bulk
router.post("/bulk", validateBulkAttendance, attendanceController.bulkUpsert);

// GET /api/v1/staff/attendance/:sectionId
router.get("/:sectionId", attendanceController.getSectionAttendance);

// PATCH /api/v1/staff/attendance/:id
router.patch("/:id", validateAttendanceCorrection, attendanceController.correctAttendance);

export default router;
