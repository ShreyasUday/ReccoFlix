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
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/anime", animeRoutes);
app.use("/api/info", infoRoutes);

// SERVE FRONTEND ASSETS
app.use(express.static(path.join(__dirname, "client/dist/client")));

// CATCH-ALL: This is the safest way to handle SSR without triggering PathError
app.use(async (req, res, next) => {
  // If it's an API route that didn't match above, send 404
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API Route Not Found" });
  }

  try {
    const handlerPath = path.join(__dirname, "client/dist/server/index.js");
    if (fs.existsSync(handlerPath)) {
      const { default: handler } = await import(`file://${handlerPath}`);
      return handler(req, res, next);
    }
  } catch (err) {
    console.error("TanStack Handler Error:", err);
  }

  // Final fallback
  res.status(200).send("ReccoFlix is initializing...");
});

app.listen(port, () => {
  console.log(`🚀 ReccoFlix Pro Server running on port ${port}`);
});
