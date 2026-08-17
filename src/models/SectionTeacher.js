import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

/**
 * SectionTeacher Model to map Class Teachers to Sections within a Tenant.
 */
export class SectionTeacher extends Model {}

SectionTeacher.init(
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
    sectionId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    teacherId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isClassTeacher: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "SectionTeacher",
    tableName: "section_teachers",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["tenantId", "sectionId", "teacherId"],
      },
    ],
  }
);
