import bcrypt from "bcrypt";
import crypto from "crypto";
import { Resend } from "resend";
import { prisma } from "../config/database.js";
import passport from "passport";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const resendFromEmail = process.env.RESEND_FROM_EMAIL || "ReccoFlix <onboarding@resend.dev>";

const maskEmail = (email = "") => {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "unknown";
  return `${name.slice(0, 2)}***@${domain}`;
};

const sendEmail = async (payload) => {
  if (!resend) {
    console.warn("Email skipped: RESEND_API_KEY is not configured.");
    return null;
  }

  const result = await resend.emails.send(payload);
  if (result?.error) {
    throw new Error(`Resend send failed: ${result.error.message || JSON.stringify(result.error)}`);
  }

  return result?.data || result;
};

export const getMe = (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
};

export const logout = (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.json({ success: true, message: "Logged out" });
  });
};

export const postRegister = async (req, res) => {
  const { name, password } = req.body;
  const email = req.body.email.toLowerCase();
  
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "Email already registered." });
    
    const hash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { name, email, password: hash, needs_ai_refresh: true }
    });
    
    req.login(newUser, (err) => {
      if (err) return res.status(500).json({ error: "Login failed after register" });
      res.json({ success: true, user: newUser });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Registration failed." });
  }
};

export const postLogin = (req, res, next) => {
  console.log("Login Attempt:", req.body.email);
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Passport Auth Error:", err);
      return next(err);
    }
    if (!user) {
      console.log("Login Failed:", info.message);
      return res.status(401).json({ error: info.message });
    }
    
    req.logIn(user, async (err) => {
      if (err) {
        console.error("req.logIn Error:", err);
        return next(err);
      }
      
      console.log("Login Successful:", user.email);
      // Mark for AI refresh on "Return to site"
      await prisma.user.update({
        where: { id: user.id },
        data: { needs_ai_refresh: true }
      });

      return res.json({ success: true, user });
    });
  })(req, res, next);
};

export const postForgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Password reset requested for ${maskEmail(normalizedEmail)}`);

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    
    if (!user) {
      console.log(`Password reset skipped: no user found for ${maskEmail(normalizedEmail)}`);
      return res.json({ success: true, message: "If an account exists, a reset link has been sent." });
    }
    
    if (resend) {
      if (user.google_id && !user.password) {
        // Professional Logic: Tell Google users to use Google Login
        const result = await sendEmail({
          from: resendFromEmail,
          to: user.email,
          subject: 'Sign in to ReccoFlix',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2>Hello!</h2>
              <p>You requested a password reset, but it looks like you usually sign in to ReccoFlix using your <strong>Google Account</strong>.</p>
              <p>Since you don't have a separate password for ReccoFlix, you can just click the button below to sign in instantly:</p>
              <a href="${process.env.CLIENT_URL || 'http://localhost:8080'}/login" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Sign in with Google</a>
              <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `
        });
        console.log(`Google sign-in reminder sent to ${maskEmail(user.email)} via Resend ${result?.id || ""}`);
      } else {
        // Normal password reset for local users
        const token = crypto.randomBytes(32).toString('hex');
        const expires = Date.now() + 3600000;
        
        await prisma.user.update({
          where: { id: user.id },
          data: { reset_password_token: token, reset_password_expires: expires }
        });
        
        const baseUrl = process.env.CLIENT_URL || 'http://localhost:8080';
        const resetLink = `${baseUrl}/reset-password/${token}`;

        const result = await sendEmail({
          from: resendFromEmail,
          to: user.email,
          subject: 'Reset your ReccoFlix Password',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2>Password Reset Request</h2>
              <p>You requested to reset your password for ReccoFlix. Click the button below to set a new one:</p>
              <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
              <p style="margin-top: 20px; font-size: 12px; color: #666;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
            </div>
          `
        });
        console.log(`Password reset email sent to ${maskEmail(user.email)} via Resend ${result?.id || ""}`);
      }
    } else {
      console.warn(`Password reset email not sent for ${maskEmail(user.email)}: RESEND_API_KEY is not configured.`);
    }
    
    // Always return the same generic message for security (don't reveal if email exists)
    res.json({ success: true, message: "If an account exists, instructions have been sent to your email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
};

export const postResetPassword = async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        reset_password_token: req.params.token,
        reset_password_expires: { gt: Date.now() }
      }
    });
    
    if (!user) return res.status(400).json({ error: "Invalid or expired token." });
    
    const password = req.body.password;
    if (!password) return res.status(400).json({ error: "Password is required." });
    
    const hash = await bcrypt.hash(password, 10);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hash, reset_password_token: null, reset_password_expires: null }
    });
    
    res.json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
};
