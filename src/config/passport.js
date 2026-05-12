import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { prisma } from "./database.js";

export function isGoogleAuthConfigured() {
    return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL);
}

export function configurePassport() {
    passport.use(
        "local",
        new LocalStrategy({ usernameField: "email" }, async (email, password, cb) => {
            try {
                const normalizedEmail = email.toLowerCase();

                const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

                if (user) {
                    if (!user.password) return cb(null, false, { message: "Please log in with Google" });

                    bcrypt.compare(password, user.password, (err, valid) => {
                        if (err) return cb(err);
                        if (valid) return cb(null, user);
                        return cb(null, false, { message: "Incorrect password" });
                    });
                } else {
                    return cb(null, false, { message: "User not registered" });
                }
            } catch (err) {
                return cb(err);
            }
        })
    );

    if (isGoogleAuthConfigured()) {
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
                try {
                    const normalizedEmail = profile.email.toLowerCase();

                    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

                    const photoUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

                    if (!user) {
                        user = await prisma.user.create({
                            data: {
                                email: normalizedEmail,
                                google_id: profile.id,
                                name: profile.displayName,
                                avatar_url: photoUrl,
                                needs_ai_refresh: true
                            }
                        });
                    } else {
                        // Returning user: Update avatar if it changed or was missing
                        user = await prisma.user.update({
                            where: { id: user.id },
                            data: { 
                                google_id: user.google_id || profile.id,
                                avatar_url: user.avatar_url || photoUrl,
                                needs_ai_refresh: true 
                            }
                        });
                    }
                    return cb(null, user);
                } catch (err) {
                    return cb(err);
                }
            }
        )
        );
    } else {
        console.warn("Google OAuth disabled: missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_CALLBACK_URL");
    }

    passport.serializeUser((user, cb) => {
        cb(null, user.id);
    });

    passport.deserializeUser(async (id, cb) => {
        try {
            const user = await prisma.user.findUnique({ where: { id: id } });
            if (user) cb(null, user);
            else cb(new Error("User not found"));
        } catch (err) {
            cb(err);
        }
    });
}
