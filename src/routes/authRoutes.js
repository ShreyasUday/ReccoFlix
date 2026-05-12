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

// Google OAuth (this might need to redirect to frontend URL)
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], prompt: "select_account" }));
router.get("/google/callback", 
  (req, res, next) => {
    // Determine where to redirect back to
    const host = req.get('host');
    const protocol = req.protocol;
    // For local dev, we usually want to go back to port 8080 (the Vite frontend)
    // We can infer the protocol and host from the request
    const frontendUrl = host.includes('localhost') ? 'http://localhost:8080' : `${protocol}://${host.split(':')[0]}:8080`;
    
    passport.authenticate("google", { 
        failureRedirect: `${frontendUrl}/login`,
        successRedirect: `${frontendUrl}/`
    })(req, res, next);
  }
);

export default router;
