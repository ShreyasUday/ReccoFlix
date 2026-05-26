import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * AI/Groq requests rate limiter
 * Limit: 10 requests per 8 minutes per user
 *
 * With Groq free tier (500K tokens/month, ~10K per request = ~50 requests/month):
 * 10 requests per 8 minutes = 75 requests per hour = 1800 requests per day
 * This allows burst usage while preventing exhaustion
 *
 * Actual monthly usage should stay well under 50 requests when considering
 * cache hits and multiple users sharing the quota
 */
export const aiLimiter = rateLimit({
  windowMs: 8 * 60 * 1000, // 8 minutes
  max: 10, // 10 requests per window
  message: "Too many AI requests. Please wait a moment before trying again.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    return req.user?.id || req.sessionID || ipKeyGenerator(req);
  },
  skip: (req) => {
    // Skip rate limiting for non-AI endpoints
    return !req.path.includes("/recommendations") &&
           !req.path.includes("/mood") &&
           !req.path.includes("/share-line") &&
           !req.path.includes("/episode");
  },
});
