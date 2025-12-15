import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import db from "./db.js";

dotenv.config();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

import connectPgSimple from "connect-pg-simple";
const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({
      pool: db, // Use the existing pool from db.js
      tableName: "session",
    }),
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // CRITICAL: Must be false for localhost (http)
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Middleware to make user available in all views
app.use((req, res, next) => {
  console.log("Session Middleware - req.user:", req.user);
  console.log("Session Middleware - Session ID:", req.sessionID);
  res.locals.user = req.user;
  next();
});

app.set("view engine", "ejs");
app.set("views", "./views");

// ================================
// HELPER
// ================================
function extractFranchiseKeyword(animeData) {
  return animeData.attributes.canonicalTitle.split(/[(:]/)[0].trim();
}


// ================================
// HOME
// ================================
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/category", async (req, res) => {
  try {
    const response = await axios.get(
      "https://kitsu.io/api/edge/anime?filter[status]=current&sort=popularityRank&page[limit]=10"
    );
    const trending = response.data.data;
    res.render("category", { trending });
  } catch (err) {
    console.log("Category page error:", err.message);
    res.render("category", { trending: [] });
  }
});



// ================================
// SEARCH
// ================================
app.get("/search", (req, res) => {
  res.render("search", { items: [], searched: false });
});

app.post("/search", async (req, res) => {
  const request = req.body.search_data;

  try {
    const response = await axios.get(
      `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(request)}`
    );

    const items = response.data.data;

    // If no items found, render search page with message
    if (items.length === 0) {
      return res.render("search", { items: [], searched: true });
    }

    // 🔧 FIX: search results go to browse (ORIGINAL DESIGN)
    // Pass default pagination values for search results (search doesn't have pagination yet)
    res.render("browse", {
      items,
      category: null,
      currentOffset: 0,
      nextOffset: 0,
      prevOffset: 0
    });

  } catch (err) {
    console.log("Search error:", err.message);
    res.render("search", { items: [], searched: true });
  }
});

// ================================
// BROWSE (CATEGORY)
// ================================

// ================================
// BROWSE (CATEGORY)
// ================================

app.get("/browse", async (req, res) => {
  const selectedCategory = req.query.category || "action"; // Default to action if none
  const offset = parseInt(req.query.offset) || 0;
  const limit = 20;
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");

  try {
    console.log(`DEBUG: Browse Request - Category: ${selectedCategory}, Offset: ${offset}`);
    const kitsuUrl = `https://kitsu.io/api/edge/anime?filter[text]=${selectedCategory}&page[limit]=${limit}&page[offset]=${offset}&sort=-userCount`;
    console.log(`DEBUG: Kitsu URL: ${kitsuUrl}`);

    const response = await axios.get(kitsuUrl);

    const items = response.data.data;
    const nextOffset = offset + limit;
    const prevOffset = Math.max(0, offset - limit);

    res.render("browse", {
      items,
      category: selectedCategory,
      currentOffset: offset,
      nextOffset,
      prevOffset
    });

  } catch (err) {
    console.log("Browse error:", err.message);
    res.render("browse", { items: [], category: selectedCategory, currentOffset: 0, nextOffset: 0, prevOffset: 0 });
  }
});

app.post("/browse", (req, res) => {
  let selectedCategory = "";
  const genreKeys = [
    "action", "adventure", "scifi", "fantasy", "drama",
    "comedy", "mystery", "thriller", "sports",
    "romance", "slice of life", "historical",
    "horror", "music", "supernatural"
  ];

  for (const key of genreKeys) {
    if (req.body.hasOwnProperty(key)) selectedCategory = key;
  }

  // Redirect to GET with query param
  res.redirect(`/browse?category=${selectedCategory}`);
});

// ================================
// CARD CLICK → DESCRIPTION
// ================================
app.post("/description", (req, res) => {
  const animeName = req.body.anime_name || req.body.message;
  // if (!animeName) return res.redirect("/search");
  console.log(animeName)
  res.json({
    redirectUrl: `/description?anime=${encodeURIComponent(animeName)}`
  });

});

// ================================
// DESCRIPTION PAGE
// ================================
app.get("/description", async (req, res) => {
  const animeName = req.query.anime;

  try {
    const response = await axios.get(
      `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(animeName)}&page[limit]=5`
    );

    const animeData = response.data.data[0];
    if (!animeData) {
      return res.status(404).send("Anime not found");
    }

    const canonical = animeData.attributes.canonicalTitle.toLowerCase();
    // START NEW LOGIC
    // Use Kitsu media-relationships to get proper franchise data
    const mediaRelResponse = await axios.get(
      `https://kitsu.io/api/edge/anime/${animeData.id}/media-relationships?include=destination&page[limit]=20`
    );

    const franchise = (mediaRelResponse.data.included || [])
      .filter(item => item.type === 'anime' && item.attributes.canonicalTitle.toLowerCase() !== canonical);
    // END NEW LOGIC

    const relatedResponse = await axios.get(
      `https://kitsu.io/api/edge/anime?filter[subtype]=${animeData.attributes.subtype}&page[limit]=20`
    );

    const related = relatedResponse.data.data.filter(item =>
      item.attributes.canonicalTitle.toLowerCase() !== canonical
    );

    // Check user library status
    let userAnimeStatus = null;
    if (req.isAuthenticated()) {
      const userLibraryCheck = await db.query(
        "SELECT status FROM user_library WHERE user_id = $1 AND anime_id = $2",
        [req.user.id, animeData.id]
      );
      if (userLibraryCheck.rows.length > 0) {
        userAnimeStatus = userLibraryCheck.rows[0].status;
      }
    }

    res.render("description", {
      desc: animeData,
      anime: animeName,
      franchise,
      related,
      userAnimeStatus
    });

  } catch (err) {
    console.log("Description error:", err.message);
    res.redirect("/search"); // 🔧 FIX: no missing error_page
  }
});

// ================================
// INFO PAGES
// ================================

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/privacy", (req, res) => {
  res.render("privacy");
});

app.get("/terms", (req, res) => {
  res.render("terms");
});

// ================================
// app.listen(3000, () => {
//   console.log("Server running on http://localhost:3000");
// });
// ================================
// AUTHENTICATION
// ================================

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) console.log(err);
    res.redirect("/");
  });
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.redirect("/login");
    } else {
      bcrypt.hash(password, 10, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
            "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
            [name, email, hash]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log("Success");
            res.redirect("/");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account", // Force Google to show account chooser
  })
);

app.get(
  "/auth/google/callback",
  (req, res, next) => {
    console.log("DEBUG: Hit /auth/google/callback");
    console.log("DEBUG: Query params:", req.query);
    next();
  },
  passport.authenticate("google", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    console.log("DEBUG: Auth successful, redirecting home. User:", req.user.id);
    res.redirect("/");
  }
);

passport.use("local",
  new LocalStrategy({ usernameField: "email" }, async (email, password, cb) => {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  })
);

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      console.log("Google Strategy Callback - Profile:", profile.email);
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.email,
        ]);
        if (result.rows.length === 0) {
          console.log("Google Strategy - Creating new user");
          const newUser = await db.query(
            "INSERT INTO users (email, google_id, name) VALUES ($1, $2, $3) RETURNING *",
            [profile.email, profile.id, profile.displayName]
          );
          return cb(null, newUser.rows[0]);
        } else {
          console.log("Google Strategy - User found:", result.rows[0].email);
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        console.error("Google Strategy Error:", err);
        return cb(err);
      }
    }
  )
);

passport.serializeUser((user, cb) => {
  console.log("Serializing user ID:", user.id);
  cb(null, user.id);
});

passport.deserializeUser(async (id, cb) => {
  try {
    console.log("Deserializing user ID:", id);
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    if (result.rows.length > 0) {
      cb(null, result.rows[0]);
    } else {
      cb(new Error("User not found"));
    }
  } catch (err) {
    cb(err);
  }
});

// ================================
// PROFILE & LIBRARY
// ================================

app.get("/profile", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const result = await db.query("SELECT * FROM user_library WHERE user_id = $1", [req.user.id]);
      res.render("profile", { library: result.rows });
    } catch (err) {
      console.log(err);
      res.redirect("/");
    }
  } else {
    res.redirect("/login");
  }
});

app.post("/library/add", async (req, res) => {
  if (req.isAuthenticated()) {
    const { anime_id, anime_title, poster_image, status } = req.body;
    try {
      // Upsert: Insert or Update if exists
      await db.query(
        `INSERT INTO user_library (user_id, anime_id, anime_title, poster_image, status)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, anime_id) 
         DO UPDATE SET status = $5, anime_title = $3, poster_image = $4`,
        [req.user.id, anime_id, anime_title, poster_image, status]
      );

      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(200).json({ status: 'success' });
      }

      // Fix for "Cannot GET /library/back"
      // If we came from the description page, redirect there. Otherwise profile or home.
      const referer = req.get('Referer');
      if (referer) {
        res.redirect(referer);
      } else {
        res.redirect(`/description?anime=${encodeURIComponent(anime_title)}`);
      }
    } catch (err) {
      console.log(err);
      res.redirect("/");
    }
  } else {
    res.redirect("/login");
  }
});

app.post("/library/remove", async (req, res) => {
  console.log("DEBUG: POST /library/remove called");
  if (req.isAuthenticated()) {
    // 1. Parse anime_id to integer
    const anime_id = parseInt(req.body.anime_id, 10);
    console.log(`DEBUG: Removing anime_id: ${anime_id} (parsed) for user_id: ${req.user.id}`);

    if (isNaN(anime_id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid anime ID' });
    }

    try {
      // 2. Delete row using BOTH user_id and anime_id
      const result = await db.query("DELETE FROM user_library WHERE user_id = $1 AND anime_id = $2 RETURNING *", [
        req.user.id,
        anime_id,
      ]);
      console.log(`DEBUG: Delete Result Row Count: ${result.rowCount}`);
      if (result.rowCount === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Anime not found for user'
        });
      }

      // 3. Return JSON { status: "success" } on successful delete
      return res.status(200).json({ status: 'success' });

    } catch (err) {
      console.error("DEBUG: Server Error during remove:", err);
      // Return JSON failure
      return res.status(500).json({ status: 'error' });
    }
  } else {
    console.log("DEBUG: User not authenticated");
    return res.status(401).json({ status: 'unauthorized' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
