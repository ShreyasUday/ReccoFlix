import express from "express";
import passport from "passport";
import * as authController from "../controllers/authController.js";
import { isGoogleAuthConfigured } from "../config/passport.js";
import { authLimiter, loginLimiter } from "../middleware/index.js";

const router = express.Router();

router.get("/me", authController.getMe);
router.post("/login", loginLimiter, authController.postLogin);
router.post("/register", loginLimiter, authController.postRegister);
router.get("/logout", authController.logout);

router.post("/forgot-password", authLimiter, authController.postForgotPassword);
router.post("/reset-password/:token", authController.postResetPassword);

// Google OAuth
router.get("/google", (req, res, next) => {
  if (!isGoogleAuthConfigured()) {
    return res.status(503).json({ error: "Google authentication is not configured." });
  }

  return passport.authenticate("google", { scope: ["profile", "email"], prompt: "select_account" })(req, res, next);
});
router.get("/google/callback",
  (req, res, next) => {
    if (!isGoogleAuthConfigured()) {
      return res.status(503).json({ error: "Google authentication is not configured." });
    }

    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    // CORS Redirection support: Route back to port 8080 in development, or process.env.CLIENT_URL in production
    const isProduction = process.env.NODE_ENV === "production";
    const clientUrl = isProduction 
      ? (process.env.CLIENT_URL || baseUrl).replace(/\/$/, "")
      : "http://localhost:8080";

    passport.authenticate("google", {
        failureRedirect: `${clientUrl}/login?error=auth_failed`,
        successRedirect: `${clientUrl}/`
    }, (err, user, info) => {
      if (err) {
        console.error("Google auth error:", err);
        return res.redirect(`${clientUrl}/login?error=auth_error`);
      }
      if (!user) {
        console.warn("Google auth: no user returned", info);
        return res.redirect(`${clientUrl}/login?error=no_user`);
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("Session login error:", loginErr);
          return res.redirect(`${clientUrl}/login?error=session_failed`);
        }
        console.log("Google login successful for user:", user.email);
        res.redirect(`${clientUrl}/`);
      });
    })(req, res, next);
  }
);

export default router;
