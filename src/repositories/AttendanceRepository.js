import { BaseRepository } from "../base/BaseRepository.js";
import { Attendance } from "../models/Attendance.js";

/**
 * AttendanceRepository extending BaseRepository for Attendance model data access.
 */
export class AttendanceRepository extends BaseRepository {
  constructor() {
    super(Attendance);
  }

  /**
   * Bulk upsert attendance records for a tenant.
   * Updates status, reason, remarks, and teacherId if record for (tenantId, studentId, date) exists.
   * @param {string} tenantId
   * @param {Array<Object>} records
   * @returns {Promise<Array<Object>>} Upserted attendance records
   */
  async bulkUpsert(tenantId, records) {
    const formattedRecords = records.map((record) => ({
      ...record,
      tenantId,
    }));

    return await Attendance.bulkCreate(formattedRecords, {
      updateOnDuplicate: ["status", "reason", "remarks", "teacherId", "updatedAt"],
    });
  }

  /**
   * Query section-wise attendance.
   * @param {string} tenantId
   * @param {string} sectionId
   * @param {string} [date] - Optional date filter (YYYY-MM-DD)
   * @returns {Promise<Array<Object>>} Attendance records
   */
  async findBySection(tenantId, sectionId, date) {
    const where = { tenantId, sectionId };
    if (date) {
      where.date = date;
    }

    return await Attendance.findAll({
      where,
      order: [
        ["date", "DESC"],
        ["studentId", "ASC"],
      ],
    });
  }

  /**
   * Find single attendance record by ID within tenant context.
   * @param {string} tenantId
   * @param {string} id
   * @returns {Promise<Object|null>} Attendance record or null
   */
  async findById(tenantId, id) {
    return await Attendance.findOne({
      where: { tenantId, id },
    });
  }

  /**
   * Update attendance record within tenant context.
   * @param {string} tenantId
   * @param {string} id
   * @param {Object} updateData
   * @returns {Promise<Object>} Updated record
   */
  async updateAttendance(tenantId, id, updateData) {
    const attendance = await this.findById(tenantId, id);
    if (!attendance) {
      return null;
    }
    return await attendance.update(updateData);
  }

  /**
   * Get attendance summary for a specific student.
   * @param {string} tenantId
   * @param {string} studentId
   * @returns {Promise<Object>} Summary statistics and attendance logs
   */
  async getStudentSummary(tenantId, studentId) {
    const records = await Attendance.findAll({
      where: { tenantId, studentId },
      order: [["date", "DESC"]],
    });

    const totalDays = records.length;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    records.forEach((record) => {
      switch (record.status) {
        case "PRESENT":
          presentCount++;
          break;
        case "ABSENT":
          absentCount++;
          break;
        case "LATE":
          lateCount++;
          break;
        case "EXCUSED":
          excusedCount++;
          break;
        default:
          break;
      }
    });

    // Attendance percentage considers Present and Late as attended
    const attendedDays = presentCount + lateCount;
    const percentage = totalDays > 0 ? Number(((attendedDays / totalDays) * 100).toFixed(2)) : 0;

    return {
      studentId,
      totalDays,
      presentDays: presentCount,
      absentDays: absentCount,
      lateDays: lateCount,
      excusedDays: excusedCount,
      attendancePercentage: percentage,
      history: records,
    };
  }
}
