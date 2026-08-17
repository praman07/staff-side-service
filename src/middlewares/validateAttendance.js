import { body, param, validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware to handle validation result errors.
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((err) => `${err.path}: ${err.msg}`)
      .join("; ");
    return next(new ApiError(400, `Validation Error: ${errorMessages}`));
  }
  next();
};

/**
 * Validation middleware for POST /api/v1/staff/attendance/bulk
 */
export const validateBulkAttendance = [
  body("sectionId")
    .notEmpty()
    .withMessage("sectionId is required and must not be empty"),
  body("date")
    .notEmpty()
    .withMessage("date is required (YYYY-MM-DD)")
    .isISO8601()
    .withMessage("date must be a valid date in YYYY-MM-DD format"),
  body("records")
    .isArray({ min: 1 })
    .withMessage("records must be a non-empty array"),
  body("records.*.studentId")
    .notEmpty()
    .withMessage("studentId is required for each record"),
  body("records.*.status")
    .isIn(["PRESENT", "ABSENT", "LATE", "EXCUSED"])
    .withMessage("status must be one of PRESENT, ABSENT, LATE, EXCUSED"),
  handleValidationErrors,
];

/**
 * Validation middleware for PATCH /api/v1/staff/attendance/:id
 */
export const validateAttendanceCorrection = [
  param("id")
    .notEmpty()
    .withMessage("Attendance ID parameter is required"),
  body("reason")
    .notEmpty()
    .trim()
    .withMessage("Attendance correction requires a non-empty reason"),
  body("status")
    .optional()
    .isIn(["PRESENT", "ABSENT", "LATE", "EXCUSED"])
    .withMessage("status must be one of PRESENT, ABSENT, LATE, EXCUSED"),
  handleValidationErrors,
];
