import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import { configurePassport } from "./src/config/passport.js";
import dotenv from "dotenv";
import db from "./src/config/database.js";
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import animeRoutes from "./src/routes/animeRoutes.js";
import infoRoutes from "./src/routes/infoRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.set("trust proxy", 1);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:8080",
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session & Passport
app.use(session({
  secret: process.env.SESSION_SECRET || "secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());
configurePassport(passport);

// API Routes
app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/anime", animeRoutes);
app.use("/api/info", infoRoutes);

// SERVE FRONTEND ASSETS
app.use(express.static(path.join(__dirname, "client/dist/client")));

// Helper: Convert Express req/res to Web Standard Request/Response
async function expressToFetch(req, res) {
  // Read the body
  let body = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = JSON.stringify(req.body || {});
  }

  // Build the URL
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost';
  const url = new URL(req.originalUrl || req.url, `${protocol}://${host}`);

  // Create a Web Standard Request
  const fetchRequest = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: body,
  });

  return fetchRequest;
}

// Helper: Convert Web Standard Response to Express response
async function fetchToExpress(response, res) {
  const body = await response.text();
  
  res.status(response.status);
  response.headers.forEach((value, name) => {
    res.set(name, value);
  });
  
  res.send(body);
}

// CATCH-ALL: Handle TanStack Start SSR with Web Standard API
app.use(async (req, res, next) => {
  // If it's an API route that didn't match above, send 404
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API Route Not Found" });
  }

  try {
    const handlerPath = path.join(__dirname, "client/dist/server/index.js");
    if (fs.existsSync(handlerPath)) {
      const module = await import(`file://${handlerPath}`);
      const handler = module.default;
      
      if (handler && typeof handler.fetch === 'function') {
        // Convert Express request to Web Standard Request
        const fetchRequest = await expressToFetch(req, res);
        
        // Call the TanStack handler with Web Standard API
        const fetchResponse = await handler.fetch(fetchRequest, {}, {});
        
        // Convert Web Standard Response back to Express
        return await fetchToExpress(fetchResponse, res);
      } else {
        console.warn("Handler.fetch is not a function", handler);
      }
    } else {
      console.warn("Handler path does not exist:", handlerPath);
    }
  } catch (err) {
    console.error("TanStack Handler Error:", err.message);
    console.error("Stack:", err.stack);
  }

  // Final fallback
  res.status(200).send("ReccoFlix is initializing...");
});

app.listen(port, () => {
  console.log(`🚀 ReccoFlix Pro Server running on port ${port}`);
});
