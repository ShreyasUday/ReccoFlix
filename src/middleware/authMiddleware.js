/**
 * Session/Auth Verification Middleware
 * Checks if user is authenticated before allowing access to protected routes
 */
export const authMiddleware = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  // Store the original URL for post-login redirect
  req.session.returnTo = req.originalUrl;

  res.status(401).json({
    error: "Unauthorized",
    code: "AUTH_REQUIRED",
    statusCode: 401,
    message: "Please log in to access this resource"
  });
};

/**
 * Optional Auth Middleware
 * Checks if user is authenticated but doesn't block unauthenticated requests
 * Useful for endpoints that have different behavior based on auth status
 */
export const optionalAuthMiddleware = (req, res, next) => {
  // Just pass through - Passport will populate req.user if authenticated
  next();
};
