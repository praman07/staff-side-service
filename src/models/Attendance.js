import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

/**
 * Attendance Model with multi-tenant support and paranoid soft deletion.
 */
export class Attendance extends Model {
  /**
   * Scope queries with tenantId
   * @param {string} tenantId
   * @returns {Object} Scoped model operations
   */
  static withTenant(tenantId) {
    if (!tenantId) {
      throw new Error("tenantId is required for withTenant scope");
    }
    return {
      findAll: (options = {}) =>
        Attendance.findAll({
          ...options,
          where: { ...(options.where || {}), tenantId },
        }),
      findOne: (options = {}) =>
        Attendance.findOne({
          ...options,
          where: { ...(options.where || {}), tenantId },
        }),
      findByPk: (id, options = {}) =>
        Attendance.findOne({
          ...options,
          where: { ...(options.where || {}), id, tenantId },
        }),
      create: (data, options = {}) =>
        Attendance.create({ ...data, tenantId }, options),
      bulkCreate: (records, options = {}) => {
        const scopedRecords = records.map((r) => ({ ...r, tenantId }));
        return Attendance.bulkCreate(scopedRecords, options);
      },
      update: (data, options = {}) =>
        Attendance.update(data, {
          ...options,
          where: { ...(options.where || {}), tenantId },
        }),
      destroy: (options = {}) =>
        Attendance.destroy({
          ...options,
          where: { ...(options.where || {}), tenantId },
        }),
    };
  }
}

Attendance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    studentId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sectionId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    teacherId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("PRESENT", "ABSENT", "LATE", "EXCUSED"),
      allowNull: false,
      defaultValue: "PRESENT",
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Attendance",
    tableName: "attendances",
    timestamps: true,
    paranoid: true, // Enables soft deletes (deletedAt)
    indexes: [
      {
        unique: true,
        fields: ["tenantId", "studentId", "date"],
        name: "unique_tenant_student_date",
      },
      {
        fields: ["tenantId", "sectionId", "date"],
      },
    ],
  }
);
