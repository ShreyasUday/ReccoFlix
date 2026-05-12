import express from "express";
import passport from "passport";
import rateLimit from "express-rate-limit";
import * as authController from "../controllers/authController.js";

const router = express.Router();

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many password reset requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/me", authController.getMe);
router.post("/login", authController.postLogin);
router.post("/register", authController.postRegister);
router.get("/logout", authController.logout);

router.post("/forgot-password", forgotPasswordLimiter, authController.postForgotPassword);
router.post("/reset-password/:token", authController.postResetPassword);

// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], prompt: "select_account" }));
router.get("/google/callback", 
  (req, res, next) => {
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
