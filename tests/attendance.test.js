import request from "supertest";
import { app } from "../src/app.js";
import { sequelize, Attendance, SectionTeacher } from "../src/models/index.js";
import { AttendanceRepository } from "../src/repositories/AttendanceRepository.js";
import { AttendanceService } from "../src/services/AttendanceService.js";

describe("Feature S-2: Attendance Management Module", () => {
  const tenantId = "tenant-school-101";
  const classTeacherId = "teacher-101";
  const subjectTeacherId = "teacher-999";
  const sectionId = "section-8A";

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await Attendance.destroy({ where: {}, force: true });
    await SectionTeacher.destroy({ where: {}, force: true });

    // Assign teacher-101 as the class teacher of section-8A
    await SectionTeacher.create({
      tenantId,
      sectionId,
      teacherId: classTeacherId,
      isClassTeacher: true,
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe("1. Attendance Model & Tenant Support (withTenant & Paranoid)", () => {
    it("should support tenant scoping via withTenant() static method", async () => {
      const record = await Attendance.withTenant(tenantId).create({
        studentId: "student-1",
        sectionId,
        date: "2026-08-17",
        status: "PRESENT",
      });

      expect(record).toBeDefined();
      expect(record.tenantId).toBe(tenantId);

      const tenantRecords = await Attendance.withTenant(tenantId).findAll();
      expect(tenantRecords.length).toBe(1);

      const otherTenantRecords = await Attendance.withTenant("other-tenant").findAll();
      expect(otherTenantRecords.length).toBe(0);
    });

    it("should enforce unique index on (tenantId, studentId, date)", async () => {
      await Attendance.create({
        tenantId,
        studentId: "student-1",
        sectionId,
        date: "2026-08-17",
        status: "PRESENT",
      });

      await expect(
        Attendance.create({
          tenantId,
          studentId: "student-1",
          sectionId,
          date: "2026-08-17",
          status: "ABSENT",
        })
      ).rejects.toThrow();
    });

    it("should support paranoid soft deletion (deletedAt)", async () => {
      const record = await Attendance.create({
        tenantId,
        studentId: "student-soft-delete",
        sectionId,
        date: "2026-08-17",
        status: "PRESENT",
      });

      await record.destroy(); // Soft delete

      const foundNormal = await Attendance.findOne({
        where: { id: record.id },
      });
      expect(foundNormal).toBeNull();

      const foundWithParanoid = await Attendance.findOne({
        where: { id: record.id },
        paranoid: false,
      });
      expect(foundWithParanoid).not.toBeNull();
      expect(foundWithParanoid.deletedAt).not.toBeNull();
    });
  });

  describe("2. AttendanceRepository & BaseRepository", () => {
    it("should perform bulk upsert and update duplicates without error", async () => {
      const repo = new AttendanceRepository();

      await repo.bulkUpsert(tenantId, [
        {
          studentId: "student-1",
          sectionId,
          date: "2026-08-17",
          status: "ABSENT",
          teacherId: classTeacherId,
        },
      ]);

      // Upsert update
      await repo.bulkUpsert(tenantId, [
        {
          studentId: "student-1",
          sectionId,
          date: "2026-08-17",
          status: "PRESENT",
          teacherId: classTeacherId,
        },
      ]);

      const records = await repo.findBySection(tenantId, sectionId, "2026-08-17");
      expect(records.length).toBe(1);
      expect(records[0].status).toBe("PRESENT");
    });
  });

  describe("3. AttendanceService Authorization & Validation", () => {
    it("should block non-class teacher from marking attendance", async () => {
      const service = new AttendanceService();

      await expect(
        service.markBulkAttendance({
          tenantId,
          teacherId: subjectTeacherId,
          sectionId,
          date: "2026-08-17",
          records: [{ studentId: "student-1", status: "PRESENT" }],
        })
      ).rejects.toThrow("Forbidden");
    });

    it("should reject attendance correction with an empty or whitespace reason", async () => {
      const service = new AttendanceService();

      // Create initial attendance
      const [record] = await service.markBulkAttendance({
        tenantId,
        teacherId: classTeacherId,
        sectionId,
        date: "2026-08-17",
        records: [{ studentId: "student-1", status: "ABSENT" }],
      });

      await expect(
        service.correctAttendance({
          tenantId,
          teacherId: classTeacherId,
          attendanceId: record.id,
          status: "PRESENT",
          reason: "   ", // Empty whitespace reason
        })
      ).rejects.toThrow("Attendance correction requires a non-empty reason");
    });
  });

  describe("4. API Endpoints Integration Tests", () => {
    describe("POST /api/v1/staff/attendance/bulk", () => {
      it("should reject invalid bulk input payloads", async () => {
        const res = await request(app)
          .post("/api/v1/staff/attendance/bulk")
          .set("x-tenant-id", tenantId)
          .set("x-teacher-id", classTeacherId)
          .send({
            sectionId: "",
            date: "invalid-date",
            records: [],
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it("should mark bulk attendance successfully for class teacher", async () => {
        const res = await request(app)
          .post("/api/v1/staff/attendance/bulk")
          .set("x-tenant-id", tenantId)
          .set("x-teacher-id", classTeacherId)
          .send({
            sectionId,
            date: "2026-08-17",
            records: [
              { studentId: "student-1", status: "PRESENT" },
              { studentId: "student-2", status: "ABSENT" },
              { studentId: "student-3", status: "LATE" },
            ],
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(3);
      });
    });

    describe("GET /api/v1/staff/attendance/:sectionId", () => {
      it("should fetch section-wise attendance records", async () => {
        await request(app)
          .post("/api/v1/staff/attendance/bulk")
          .set("x-tenant-id", tenantId)
          .set("x-teacher-id", classTeacherId)
          .send({
            sectionId,
            date: "2026-08-17",
            records: [{ studentId: "student-1", status: "PRESENT" }],
          });

        const res = await request(app)
          .get(`/api/v1/staff/attendance/${sectionId}?date=2026-08-17`)
          .set("x-tenant-id", tenantId);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].studentId).toBe("student-1");
      });
    });

    describe("PATCH /api/v1/staff/attendance/:id", () => {
      it("should reject correction without non-empty reason", async () => {
        const bulkRes = await request(app)
          .post("/api/v1/staff/attendance/bulk")
          .set("x-tenant-id", tenantId)
          .set("x-teacher-id", classTeacherId)
          .send({
            sectionId,
            date: "2026-08-17",
            records: [{ studentId: "student-1", status: "ABSENT" }],
          });

        const attendanceId = bulkRes.body.data[0].id;

        const patchRes = await request(app)
          .patch(`/api/v1/staff/attendance/${attendanceId}`)
          .set("x-tenant-id", tenantId)
          .set("x-teacher-id", classTeacherId)
          .send({
            status: "PRESENT",
            reason: "",
          });

        expect(patchRes.status).toBe(400);
        expect(patchRes.body.success).toBe(false);
      });

      it("should correct attendance when valid non-empty reason is provided by class teacher", async () => {
        const bulkRes = await request(app)
          .post("/api/v1/staff/attendance/bulk")
          .set("x-tenant-id", tenantId)
          .set("x-teacher-id", classTeacherId)
          .send({
            sectionId,
            date: "2026-08-17",
            records: [{ studentId: "student-1", status: "ABSENT" }],
          });

        const attendanceId = bulkRes.body.data[0].id;

        const patchRes = await request(app)
          .patch(`/api/v1/staff/attendance/${attendanceId}`)
          .set("x-tenant-id", tenantId)
          .set("x-teacher-id", classTeacherId)
          .send({
            status: "PRESENT",
            reason: "Medical certificate submitted by student",
          });

        expect(patchRes.status).toBe(200);
        expect(patchRes.body.success).toBe(true);
        expect(patchRes.body.data.status).toBe("PRESENT");
        expect(patchRes.body.data.reason).toBe("Medical certificate submitted by student");
      });
    });

    describe("GET /api/v1/staff/attendance/summary/:studentId", () => {
      it("should compute accurate attendance summary and percentage for a student", async () => {
        const service = new AttendanceService();
        await service.markBulkAttendance({
          tenantId,
          teacherId: classTeacherId,
          sectionId,
          date: "2026-08-15",
          records: [{ studentId: "student-summary", status: "PRESENT" }],
        });

        await service.markBulkAttendance({
          tenantId,
          teacherId: classTeacherId,
          sectionId,
          date: "2026-08-16",
          records: [{ studentId: "student-summary", status: "ABSENT" }],
        });

        await service.markBulkAttendance({
          tenantId,
          teacherId: classTeacherId,
          sectionId,
          date: "2026-08-17",
          records: [{ studentId: "student-summary", status: "LATE" }],
        });

        const res = await request(app)
          .get("/api/v1/staff/attendance/summary/student-summary")
          .set("x-tenant-id", tenantId);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.totalDays).toBe(3);
        expect(res.body.data.presentDays).toBe(1);
        expect(res.body.data.absentDays).toBe(1);
        expect(res.body.data.lateDays).toBe(1);
        // (1 Present + 1 Late) / 3 total = 66.67%
        expect(res.body.data.attendancePercentage).toBe(66.67);
      });
    });
  });
});
