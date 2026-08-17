/**
 * BaseController providing common controller response methods.
 */
export class BaseController {
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {Object|Array} data - Data payload
   * @param {string} [message="Success"] - Message string
   * @param {number} [statusCode=200] - HTTP status code
   */
  sendSuccess(res, data, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
    });
  }

  /**
   * Send created response
   * @param {Object} res - Express response object
   * @param {Object|Array} data - Data payload
   * @param {string} [message="Created successfully"] - Message string
   */
  sendCreated(res, data, message = "Created successfully") {
    return this.sendSuccess(res, data, message, 201);
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {Object} [details=null] - Additional error details
   */
  sendError(res, message = "Internal Server Error", statusCode = 500, details = null) {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      ...(details && { details }),
    });
  }
}
