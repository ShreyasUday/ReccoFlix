# ReccoFlix Architecture & Implementation Guide

This document covers the code organization, modularization strategy, rate limiting, and key implementation patterns used in ReccoFlix.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Modularization Strategy](#modularization-strategy)
- [Rate Limiting](#rate-limiting)
- [Middleware Pipeline](#middleware-pipeline)
- [Service Layer](#service-layer)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)

---

## Project Structure

```
ReccoFlix/
├── index.js                          # Main Express app entry point
├── src/
│   ├── config/                       # Configuration & initialization
│   │   ├── database.js              # PostgreSQL connection & queries
│   │   └── passport.js              # OAuth 2.0 & local auth setup
│   │
│   ├── controllers/                  # Request handlers (logic orchestration)
│   │   ├── authController.js        # Auth operations (login, register, password reset)
│   │   ├── userController.js        # User profile & library management
│   │   ├── animeController.js       # Anime search, browse, trending
│   │   └── infoController.js        # Info endpoints (health, metadata)
│   │
│   ├── routes/                       # Route definitions & middleware wiring
│   │   ├── authRoutes.js            # POST /auth/*, GET /auth/google
│   │   ├── userRoutes.js            # /api/user/* (profile, library)
│   │   ├── animeRoutes.js           # /api/anime/* (search, browse)
│   │   └── infoRoutes.js            # /api/info/* (health checks)
│   │
│   ├── middleware/                   # Middleware functions & rate limiters
│   │   ├── index.js                 # Middleware export barrel file
│   │   ├── authMiddleware.js        # JWT/session authentication checks
│   │   ├── errorHandler.js          # Global error handling & logging
│   │   └── rateLimiters/            # Rate limiting per endpoint type
│   │       ├── authLimiter.js       # 5 req/15min for password reset
│   │       ├── aiLimiter.js         # 10 req/8min for AI endpoints
│   │       └── generalLimiter.js    # 100 req/min for general API
│   │
│   └── services/                     # Business logic & external API calls
│       └── ai/                       # AI-powered features
│           ├── index.js             # Main AI orchestration
│           ├── recommendations.js   # Groq-powered recommendations
│           ├── mood.js              # Mood-based search
│           ├── synopsis.js          # AI synopsis generation
│           ├── shareHooks.js        # Social media hooks
│           ├── trending.js          # Trending anime feed
│           └── kitsuFetch.js        # Kitsu API client
│
├── client/                           # Frontend (TanStack Start/React)
│   └── dist/
│       ├── client/                  # Static assets
│       └── server/                  # SSR handler
│
├── prisma/                           # Database schema
├── .env                              # Environment variables
└── package.json                      # Dependencies & scripts
```

---

## Modularization Strategy

### 1. **Separation of Concerns**

Each layer has a single responsibility:

| Layer | Purpose | Example Files |
|-------|---------|---|
| **Routes** | URL patterns & middleware wiring | `authRoutes.js` |
| **Controllers** | Request/response handling & orchestration | `authController.js` |
| **Services** | Business logic & external API calls | `services/ai/` |
| **Middleware** | Cross-cutting concerns | `errorHandler.js`, `rateLimiters/` |
| **Config** | External service setup | `passport.js`, `database.js` |

### 2. **Barrel Exports**

The `src/middleware/index.js` file re-exports all middleware for cleaner imports:

```javascript
// Instead of importing from deep paths:
// import { authLimiter } from "../middleware/rateLimiters/authLimiter.js"

// Use the barrel export:
import { authLimiter } from "../middleware/index.js"
```

**Benefits:**
- Single source of truth for middleware dependencies
- Easy to refactor internal file structure without breaking imports
- Clear visibility of what middleware is available

### 3. **Service Layer Organization**

AI services are grouped under `src/services/ai/` with focused responsibilities:

```javascript
// services/ai/index.js - Main orchestration
export const getRecommendations = async (userId, library, preferences) => {
  const anime = await kitsuFetch(library);
  return llmRecommend(anime, preferences);
}

// services/ai/recommendations.js - Groq integration
export const llmRecommend = async (anime, preferences) => {
  // LLM logic here
}

// services/ai/kitsuFetch.js - API client
export const kitsuFetch = async (ids) => {
  // Kitsu API calls here
}
```

**Why this matters:**
- Easy to test individual components
- Reusable logic across routes
- Clear data flow & dependencies
- Easier to add new AI features (create new file in `services/ai/`)

---

## Rate Limiting

ReccoFlix uses **express-rate-limit** with IPv6-safe key generation to prevent abuse and manage API quotas.

### 1. **Three-Tier Rate Limiting Strategy**

| Limiter | Endpoint | Limit | Window | Purpose |
|---------|----------|-------|--------|---------|
| **authLimiter** | `/auth/forgot-password` | 5 req | 15 min | Prevent password reset brute-force |
| **aiLimiter** | `/recommendations`, `/mood`, `/episodes` | 10 req | 8 min | Protect Groq API quota (500K tokens/mo) |
| **generalLimiter** | All other `/api/*` | 100 req | 1 min | Baseline DDoS protection |

### 2. **IPv6-Safe Implementation**

All rate limiters use the `ipKeyGenerator` helper function to properly handle IPv6 addresses:

```javascript
// ✅ CORRECT - Uses ipKeyGenerator for IPv6 support
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: ipKeyGenerator,  // IPv6 safe
});

// ❌ WRONG - Would allow IPv6 users to bypass limits
export const authLimiter = rateLimit({
  keyGenerator: (req) => req.ip,  // Treats IPv6 variants as different users
});
```

**Technical Details:**
- `req.ip` can return multiple formats for the same IPv6 user (full, compressed, mapped)
- `ipKeyGenerator` normalizes these variants to prevent bypass
- Falls back to `X-Forwarded-For` header when behind a proxy

### 3. **Smart Key Generation for AI Endpoints**

The `aiLimiter` uses a hierarchical key strategy:

```javascript
keyGenerator: (req) => {
  // Authenticated users: limit by user ID (allows multiple sessions)
  if (req.user?.id) return req.user.id;
  
  // Session users: limit by session ID
  if (req.sessionID) return req.sessionID;
  
  // Anonymous users: limit by IP (IPv6 safe)
  return ipKeyGenerator(req);
}
```

**Benefits:**
- Authenticated users can make multiple requests from different IPs
- Prevents abuse of shared IPs (e.g., corporate networks)
- Fallback to IP for unauthenticated users

### 4. **Groq API Quota Management**

ReccoFlix operates under Groq's free tier: **500K tokens/month** (~50 requests assuming ~10K tokens per request).

**Rate limiting strategy:**
- 10 requests per 8 minutes = **75 requests/hour** = **1800 requests/day**
- Well below monthly quota with buffer for peak usage
- Cache hits further reduce actual token consumption

**Dynamic adjustment:**
To increase limits during peak hours, update `aiLimiter.js`:

```javascript
// Conservative (current)
max: 10, // 75 req/hour

// Aggressive (if quota increases)
max: 25, // 187 req/hour
```

### 5. **Rate Limit Headers & Responses**

All responses include standard rate limit headers:

```
RateLimit-Limit: 5
RateLimit-Remaining: 3
RateLimit-Reset: 1700000000
```

When a user hits the limit:

```json
{
  "error": "Too many password reset requests. Please try again later."
}
```

---

## Middleware Pipeline

The Express middleware stack (from `index.js`):

```javascript
// 1. Trust proxy (for X-Forwarded-* headers)
app.set("trust proxy", 1);

// 2. CORS (cross-origin requests)
app.use(cors({...}));

// 3. Body parsing
app.use(bodyParser.json());

// 4. Session & authentication
app.use(session({...}));
app.use(passport.initialize());

// 5. Routes (with rate limiters applied per-route)
app.use("/auth", authRoutes);  // authLimiter applied to /forgot-password

// 6. Static files (frontend assets)
app.use(express.static(...));

// 7. Catch-all (TanStack SSR handler)
app.use(async (req, res, next) => {...});

// 8. Error handling (MUST be last)
app.use(errorHandler);
```

**Key principle:** Rate limiters are applied **per-route**, not globally. This allows fine-grained control:

```javascript
// authRoutes.js
router.post("/forgot-password", authLimiter, authController.postForgotPassword);
//                                ^^^^^^^^^^^ - Applied only to this route
```

---

## Service Layer

### AI Service Pattern

The `services/ai/` directory follows a **composition pattern** for testability:

```javascript
// Main orchestration
export const getRecommendations = async (userId, library, preferences) => {
  const metadata = await kitsuFetch(library); // 1. Fetch metadata
  return llmRecommend(metadata, preferences); // 2. Call LLM
  // 3. Cache result (in controller)
}

// Usage in controller
const recommendations = await getRecommendations(
  req.user.id,
  req.body.library,
  req.body.preferences
);
```

**Why this works:**
- Each function has a single responsibility
- Easy to mock external services in tests
- Reusable across multiple controllers
- Clear error boundaries

### Cache-First Strategy

AI responses are cached in PostgreSQL to minimize API calls:

```javascript
// 1. Check cache
const cached = await db.query(
  "SELECT * FROM ai_cache WHERE user_id=$1",
  [userId]
);
if (cached) return cached;

// 2. Call LLM if not cached
const recommendations = await llmRecommend(...);

// 3. Store in cache
await db.query(
  "INSERT INTO ai_cache (user_id, data) VALUES ($1, $2)",
  [userId, JSON.stringify(recommendations)]
);
```

**Cache invalidation triggers:**
- User updates their library (adds/removes anime)
- Preferences change
- Manual refresh via API

---

## Error Handling

### Global Error Handler

All errors flow through the `errorHandler` middleware (must be last):

```javascript
// Centralized error handling
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(status).json({ error: message });
});
```

### Error Types

| Error | Status | Cause |
|-------|--------|-------|
| ValidationError | 400 | Invalid request data |
| NotFoundError | 404 | Resource doesn't exist |
| UnauthorizedError | 401 | Missing/invalid auth |
| ForbiddenError | 403 | User lacks permission |
| RateLimitError | 429 | Too many requests |
| ServerError | 500 | Internal server error |

### Custom Error Pattern

```javascript
// controllers/authController.js
export const postForgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw new Error("Email is required"); // 400 status inferred
    
    await sendResetEmail(email);
    res.json({ success: true });
  } catch (err) {
    next(err); // Passed to errorHandler
  }
}
```

---

## Security Considerations

### 1. **Rate Limiting Protection**

- **Brute-force attacks**: authLimiter protects password reset endpoints
- **API quota exhaustion**: aiLimiter protects Groq API quota
- **DDoS attacks**: generalLimiter provides baseline protection

### 2. **Authentication & Authorization**

- **Local auth**: Passwords hashed with bcrypt
- **OAuth 2.0**: Google authentication via Passport.js
- **Sessions**: Server-side storage in PostgreSQL (24-hour TTL)

**Protected endpoints require authentication:**
```javascript
// In controllers
export const getLibrary = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  // ...
}
```

### 3. **CORS & Proxy Trust**

```javascript
// Allow frontend origin only
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

// Trust X-Forwarded-* headers from reverse proxy
app.set("trust proxy", 1);
```

### 4. **Input Validation**

Validate at system boundaries (user input, external APIs):

```javascript
// ✅ Validate user input
const { email, password } = req.body;
if (!email?.trim() || !password?.trim()) {
  throw new Error("Email and password required");
}

// ✅ Validate external API responses
const anime = await kitsuFetch(ids);
if (!Array.isArray(anime)) {
  throw new Error("Invalid Kitsu response");
}
```

### 5. **Environment Variables**

Sensitive data stored in `.env` (never committed):

```
DATABASE_URL=...
SESSION_SECRET=...
GROQ_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Adding New Features

### Example: Adding a New Rate-Limited Endpoint

```javascript
// 1. Create the rate limiter (src/middleware/rateLimiters/newFeatureLimiter.js)
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const newFeatureLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: "Too many requests for this feature.",
  keyGenerator: ipKeyGenerator,
});

// 2. Export it (src/middleware/index.js)
export { newFeatureLimiter } from "./rateLimiters/newFeatureLimiter.js";

// 3. Use it in routes (src/routes/newRoutes.js)
import { newFeatureLimiter } from "../middleware/index.js";

router.post("/new-feature", newFeatureLimiter, controller.handle);

// 4. Add the route to app (index.js)
app.use("/api/new", newRoutes);
```

### Example: Adding a New Service

```javascript
// 1. Create service file (src/services/newService.js)
export const myBusinessLogic = async (input) => {
  // Implementation
};

// 2. Use in controller (src/controllers/newController.js)
import { myBusinessLogic } from "../services/newService.js";

export const handler = async (req, res, next) => {
  const result = await myBusinessLogic(req.body);
  res.json(result);
};

// 3. Wire up routes (src/routes/newRoutes.js)
import * as controller from "../controllers/newController.js";
router.post("/endpoint", controller.handler);
```

---

## Performance & Caching

### Database Query Optimization

- Use indexed columns (user_id, created_at)
- Cursor-based pagination for large datasets
- Cache frequent queries in memory or PostgreSQL

### Response Caching

- AI results cached per-user in DB
- Cache invalidation on library changes
- TTL-based expiration for trending data

### Rate Limiting Impact

- **Auth limiter**: Minimal overhead (5 requests over 15 minutes)
- **AI limiter**: Prevents quota exhaustion without impacting legitimate usage
- **General limiter**: 100 req/min covers normal browsing (~3-5 req/page load)

---

## Debugging & Monitoring

### Enable Debug Logs

```bash
DEBUG=reccoflix:* npm start
```

### Rate Limit Hit Debugging

```javascript
// In middleware/index.js, add logging
export const authLimiter = rateLimit({
  // ...
  onLimitReached: (req, res, options) => {
    console.log(`Rate limit hit for ${req.ip} on ${req.path}`);
  }
});
```

### Monitor Groq Usage

Check actual token usage in Groq dashboard vs. estimated quota to adjust rate limits.

---

## Summary

ReccoFlix uses:
- **Modular architecture** with clear separation of concerns
- **Three-tier rate limiting** with IPv6-safe key generation
- **Service layer abstraction** for reusable business logic
- **Cache-first strategy** to minimize external API calls
- **Centralized error handling** for consistent error responses

This design enables scalability, maintainability, and security while keeping the codebase organized and testable.
