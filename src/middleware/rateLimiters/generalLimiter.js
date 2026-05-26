import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * General API rate limiter
 * Default: 100 requests per minute per IP
 * Used for general endpoints that aren't auth or AI-specific
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const clientIp = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown-ip";
    return ipKeyGenerator(clientIp);
  },
  handler: (req, res, next, options) => {
    console.warn(`[RATE LIMIT HIT] General rate limit triggered for IP: ${req.ip || req.socket.remoteAddress}`);
    return res.status(options.statusCode).json(options.message);
  }
});
