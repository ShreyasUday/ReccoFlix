import rateLimit from "express-rate-limit";

/**
 * General API rate limiter
 * Default: 100 requests per minute per IP
 * Used for general endpoints that aren't auth or AI-specific
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  message: "Too many requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip, // Rate limit by IP
});
