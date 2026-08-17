import { sequelize } from "../config/database.js";
import { Attendance } from "./Attendance.js";
import { SectionTeacher } from "./SectionTeacher.js";

export { sequelize, Attendance, SectionTeacher };

export const initDb = async () => {
  await sequelize.sync();
};
