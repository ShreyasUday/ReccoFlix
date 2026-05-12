import express from "express";
import fs from "fs";
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
import connectPgSimple from "connect-pg-simple";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config();
configurePassport();

const app = express();
const port = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:8080";

app.use(cors({ 
  origin: CLIENT_URL, 
  credentials: true 
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

const PgSession = connectPgSimple(session);
app.use(
  session({
    store: new PgSession({
      pool: db,
      tableName: "session",
    }),
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", 
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Auth Callback (Legacy redirect to client)
app.get("/auth/google/callback", 
  passport.authenticate("google", { failureRedirect: `${CLIENT_URL}/login` }), 
  (req, res) => { res.redirect(CLIENT_URL); }
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/anime", animeRoutes);
app.use("/api/info", infoRoutes);

// Serve static files (Search multiple possible build locations)
app.use(express.static(path.join(__dirname, "client/dist/client")));
app.use(express.static(path.join(__dirname, "client/dist")));

// DIAGNOSTIC: Find where the frontend files are hiding
function scanDir(dir, depth = 0) {
  if (depth > 3) return;
  try {
    const files = fs.readdirSync(dir);
    console.log(`${"  ".repeat(depth)}📁 ${dir}:`, files);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        scanDir(fullPath, depth + 1);
      }
    });
  } catch (e) {
    console.log(`${"  ".repeat(depth)}❌ Could not read ${dir}`);
  }
}

// CATCH-ALL: Send index.html for any non-API route (Handles SPA routing)
app.get(/^(?!\/api).+/, (req, res) => {
  const possiblePaths = [
    path.join(__dirname, "client/dist/client/index.html"),
    path.join(__dirname, "client/dist/index.html"),
    path.join(__dirname, "client/.output/public/index.html"),
    path.join(__dirname, "dist/index.html")
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      console.log(`✅ Found frontend at: ${p}`);
      return res.sendFile(p);
    }
  }
  
  console.log("❌ Frontend NOT FOUND. Scanning directories...");
  scanDir(path.join(__dirname, "client"));
  scanDir(path.join(__dirname, "dist"));
  
  res.status(404).send("Frontend build not found. Check Docker logs for directory scan.");
});


app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
