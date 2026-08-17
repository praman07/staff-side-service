import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", service: "staff-side-service" });
});

// Mount Attendance Routes under /api/v1/staff/attendance
app.use("/api/v1/staff/attendance", attendanceRoutes);

// Global Error Handler
app.use(errorHandler);

export { app };
