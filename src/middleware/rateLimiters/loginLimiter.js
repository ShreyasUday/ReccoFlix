import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * Login attempts rate limiter
 * Limit: 10 requests per 10 minutes per IP
 * Prevents brute-force login attacks
 */
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // 10 requests per window
  message: { error: "Too many login attempts. Please try again in 10 minutes." },
  standardHeaders: true, // Return RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  keyGenerator: (req) => {
    const clientIp = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown-ip";
    return ipKeyGenerator(clientIp);
  },
  handler: (req, res, next, options) => {
    console.warn(`[RATE LIMIT HIT] Login rate limit triggered for IP: ${req.ip || req.socket.remoteAddress}`);
    return res.status(options.statusCode).json(options.message);
  }
});
