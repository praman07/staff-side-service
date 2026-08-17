import { AttendanceRepository } from "../repositories/AttendanceRepository.js";
import { SectionTeacher } from "../models/SectionTeacher.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * AttendanceService encapsulating all business logic for attendance management.
 */
export class AttendanceService {
  constructor() {
    this.attendanceRepository = new AttendanceRepository();
  }

  /**
   * Helper to verify if the given teacher is the assigned class teacher for the section.
   * @param {string} tenantId
   * @param {string} sectionId
   * @param {string} teacherId
   */
  async verifyClassTeacher(tenantId, sectionId, teacherId) {
    if (!teacherId) {
      throw new ApiError(401, "Teacher identity (teacherId or staffId) is required");
    }

    // Check if there are any class teacher mappings for this section
    const mappings = await SectionTeacher.findAll({
      where: { tenantId, sectionId, isClassTeacher: true },
    });

    // If mappings exist, enforce strict class teacher check
    if (mappings.length > 0) {
      const isTeacherAssigned = mappings.some(
        (mapping) => mapping.teacherId === teacherId
      );
      if (!isTeacherAssigned) {
        throw new ApiError(
          403,
          "Forbidden: Only the class teacher of a section is allowed to mark or correct attendance"
        );
      }
    }
  }

  /**
   * Helper method to assign a class teacher to a section (for setup & testing)
   * @param {string} tenantId
   * @param {string} sectionId
   * @param {string} teacherId
   */
  async assignClassTeacher(tenantId, sectionId, teacherId) {
    return await SectionTeacher.upsert({
      tenantId,
      sectionId,
      teacherId,
      isClassTeacher: true,
    });
  }

  /**
   * Bulk mark or update attendance for a section.
   * @param {Object} param0
   * @param {string} param0.tenantId
   * @param {string} param0.teacherId
   * @param {string} param0.sectionId
   * @param {string} param0.date
   * @param {Array<Object>} param0.records
   */
  async markBulkAttendance({ tenantId, teacherId, sectionId, date, records }) {
    // Requirement: Only class teacher can mark attendance
    await this.verifyClassTeacher(tenantId, sectionId, teacherId);

    if (!records || !Array.isArray(records) || records.length === 0) {
      throw new ApiError(400, "Records array is required and must not be empty");
    }

    const recordsToUpsert = records.map((rec) => ({
      studentId: rec.studentId,
      sectionId,
      date,
      status: rec.status,
      remarks: rec.remarks || null,
      reason: rec.reason || null,
      teacherId,
    }));

    return await this.attendanceRepository.bulkUpsert(tenantId, recordsToUpsert);
  }

  /**
   * Fetch section-wise attendance.
   * @param {Object} param0
   * @param {string} param0.tenantId
   * @param {string} param0.sectionId
   * @param {string} [param0.date]
   */
  async getSectionAttendance({ tenantId, sectionId, date }) {
    if (!sectionId) {
      throw new ApiError(400, "Section ID is required");
    }
    return await this.attendanceRepository.findBySection(tenantId, sectionId, date);
  }

  /**
   * Correct individual attendance record.
   * @param {Object} param0
   * @param {string} param0.tenantId
   * @param {string} param0.teacherId
   * @param {string} param0.attendanceId
   * @param {string} param0.status
   * @param {string} param0.reason
   * @param {string} [param0.remarks]
   */
  async correctAttendance({ tenantId, teacherId, attendanceId, status, reason, remarks }) {
    // Requirement: Attendance corrections must require a non-empty reason
    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      throw new ApiError(400, "Attendance correction requires a non-empty reason");
    }

    const existingRecord = await this.attendanceRepository.findById(tenantId, attendanceId);
    if (!existingRecord) {
      throw new ApiError(404, "Attendance record not found");
    }

    // Requirement: Only the class teacher of a section should be allowed to mark or correct attendance
    await this.verifyClassTeacher(tenantId, existingRecord.sectionId, teacherId);

    const updatePayload = {
      ...(status && { status }),
      reason: reason.trim(),
      ...(remarks !== undefined && { remarks }),
      teacherId,
    };

    return await this.attendanceRepository.updateAttendance(tenantId, attendanceId, updatePayload);
  }

  /**
   * Get attendance summary for a student.
   * @param {Object} param0
   * @param {string} param0.tenantId
   * @param {string} param0.studentId
   */
  async getStudentSummary({ tenantId, studentId }) {
    if (!studentId) {
      throw new ApiError(400, "Student ID is required");
    }
    return await this.attendanceRepository.getStudentSummary(tenantId, studentId);
  }
}
