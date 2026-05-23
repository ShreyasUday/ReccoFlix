import express from "express";
import passport from "passport";
import * as authController from "../controllers/authController.js";
import { isGoogleAuthConfigured } from "../config/passport.js";
import { authLimiter } from "../middleware/index.js";

const router = express.Router();

router.get("/me", authController.getMe);
router.post("/login", authController.postLogin);
router.post("/register", authController.postRegister);
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

    // Determine where to redirect back to - use the same origin since frontend is now on same port
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    passport.authenticate("google", { 
        failureRedirect: `${baseUrl}/login?error=auth_failed`,
        successRedirect: `${baseUrl}/`
    })(req, res, next);
  }
);

export default router;
