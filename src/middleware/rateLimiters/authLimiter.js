import rateLimit from "express-rate-limit";

/**
 * Auth endpoints rate limiter
 * Password reset: 5 requests per 15 minutes per IP
 * Prevents brute-force password reset attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many password reset requests. Please try again later.",
  standardHeaders: true, // Return RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  keyGenerator: (req) => req.ip, // Rate limit by IP
});
