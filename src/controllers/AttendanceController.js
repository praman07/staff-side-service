import { BaseController } from "../base/BaseController.js";
import { AttendanceService } from "../services/AttendanceService.js";
import { catchAsync } from "../utils/catchAsync.js";

/**
 * AttendanceController extending BaseController using catchAsync wrappers for all handlers.
 */
export class AttendanceController extends BaseController {
  constructor() {
    super();
    this.attendanceService = new AttendanceService();
  }

  /**
   * Helper to extract tenantId from request header, body, or default.
   */
  getTenantId(req) {
    return req.headers["x-tenant-id"] || req.tenantId || req.body?.tenantId || req.query?.tenantId || "default-tenant";
  }

  /**
   * Helper to extract teacherId / staffId from request headers or body.
   */
  getTeacherId(req) {
    return req.headers["x-teacher-id"] || req.headers["x-staff-id"] || req.user?.id || req.body?.teacherId;
  }

  /**
   * POST /api/v1/staff/attendance/bulk
   * Bulk attendance upsert handler.
   */
  bulkUpsert = catchAsync(async (req, res) => {
    const tenantId = this.getTenantId(req);
    const teacherId = this.getTeacherId(req);
    const { sectionId, date, records } = req.body;

    const result = await this.attendanceService.markBulkAttendance({
      tenantId,
      teacherId,
      sectionId,
      date,
      records,
    });

    return this.sendCreated(res, result, "Bulk attendance recorded successfully");
  });

  /**
   * GET /api/v1/staff/attendance/:sectionId
   * Section-wise attendance query handler.
   */
  getSectionAttendance = catchAsync(async (req, res) => {
    const tenantId = this.getTenantId(req);
    const { sectionId } = req.params;
    const { date } = req.query;

    const records = await this.attendanceService.getSectionAttendance({
      tenantId,
      sectionId,
      date,
    });

    return this.sendSuccess(res, records, "Section attendance retrieved successfully");
  });

  /**
   * PATCH /api/v1/staff/attendance/:id
   * Attendance correction handler requiring non-empty reason.
   */
  correctAttendance = catchAsync(async (req, res) => {
    const tenantId = this.getTenantId(req);
    const teacherId = this.getTeacherId(req);
    const { id } = req.params;
    const { status, reason, remarks } = req.body;

    const updatedRecord = await this.attendanceService.correctAttendance({
      tenantId,
      teacherId,
      attendanceId: id,
      status,
      reason,
      remarks,
    });

    return this.sendSuccess(res, updatedRecord, "Attendance record corrected successfully");
  });

  /**
   * GET /api/v1/staff/attendance/summary/:studentId
   * Student attendance summary handler.
   */
  getStudentSummary = catchAsync(async (req, res) => {
    const tenantId = this.getTenantId(req);
    const { studentId } = req.params;

    const summary = await this.attendanceService.getStudentSummary({
      tenantId,
      studentId,
    });

    return this.sendSuccess(res, summary, "Student attendance summary retrieved successfully");
  });
}
