/**
 * Wraps an asynchronous controller function to automatically catch errors and forward to next middleware.
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware handler
 */
export const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};
