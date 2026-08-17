import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const storage = process.env.DB_STORAGE || ":memory:";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: storage,
  logging: false,
  define: {
    timestamps: true,
    underscored: false,
  },
});
