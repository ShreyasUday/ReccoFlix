/**
 * Centralized Error Handler Middleware
 * Should be used as the last middleware in Express app
 * Catches all errors and sends appropriate responses
 */
export const errorHandler = (err, req, res, next) => {
  // Default error values
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";
  const code = err.code || "INTERNAL_ERROR";

  // Log error for debugging
  console.error(`[ERROR] ${statusCode}: ${message}`, {
    code,
    path: req.path,
    method: req.method,
    stack: err.stack
  });

  // Determine error type and customize response
  let errorResponse = {
    error: message,
    code: code,
    statusCode: statusCode
  };

  // Validation errors
  if (err.statusCode === 400 || err.name === "ValidationError") {
    errorResponse = {
      error: "Validation Error",
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details: err.details || err.message
    };
  }

  // Rate limit errors
  if (statusCode === 429) {
    errorResponse = {
      error: err.message || "Too many requests",
      code: "RATE_LIMIT_EXCEEDED",
      statusCode: 429
    };
  }

  // Authentication errors
  if (statusCode === 401) {
    errorResponse = {
      error: "Unauthorized",
      code: "AUTH_REQUIRED",
      statusCode: 401,
      message: message
    };
  }

  // Forbidden errors
  if (statusCode === 403) {
    errorResponse = {
      error: "Forbidden",
      code: "ACCESS_DENIED",
      statusCode: 403,
      message: message
    };
  }

  // Not found errors
  if (statusCode === 404) {
    errorResponse = {
      error: "Not Found",
      code: "RESOURCE_NOT_FOUND",
      statusCode: 404,
      message: message
    };
  }

  // External API errors
  if (statusCode === 502 || statusCode === 503) {
    errorResponse = {
      error: "Service Unavailable",
      code: "EXTERNAL_API_ERROR",
      statusCode: statusCode,
      message: "External service is temporarily unavailable. Please try again later."
    };
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found Handler
 * Should be used before the error handler
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.path}`);
  error.statusCode = 404;
  error.code = "ROUTE_NOT_FOUND";
  next(error);
};
