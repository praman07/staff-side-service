import { ApiError } from "../utils/ApiError.js";

/**
 * Global Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  if (!statusCode) {
    statusCode = err.status || 500;
  }

  const response = {
    success: false,
    statusCode,
    message: message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};
