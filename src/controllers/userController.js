import { prisma } from "../config/database.js";
import bcrypt from "bcrypt";

export const getProfile = async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const library = await prisma.userLibrary.findMany({
        where: { user_id: req.user.id }
      });
      res.json({ user: req.user, library });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export const addAnimeToLibrary = async (req, res) => {
  if (req.isAuthenticated()) {
    const { anime_id, anime_title, poster_image, status } = req.body;
    try {
      const entry = await prisma.userLibrary.upsert({
        where: {
          user_id_anime_id: { user_id: req.user.id, anime_id: String(anime_id) }
        },
        update: { status, anime_title, poster_image },
        create: { user_id: req.user.id, anime_id: String(anime_id), anime_title, poster_image, status }
      });
      
      // Mark for AI refresh
      await prisma.user.update({
        where: { id: req.user.id },
        data: { needs_ai_refresh: true }
      });

      return res.status(200).json({ status: 'success', entry });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Failed to add to library" });
    }
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export const removeAnimeFromLibrary = async (req, res) => {
  if (req.isAuthenticated()) {
    const anime_id = req.body.anime_id;
    if (!anime_id) return res.status(400).json({ status: 'error', message: 'Invalid anime ID' });

    try {
      await prisma.userLibrary.delete({
        where: {
          user_id_anime_id: { user_id: req.user.id, anime_id: String(anime_id) }
        }
      });

      // Mark for AI refresh
      await prisma.user.update({
        where: { id: req.user.id },
        data: { needs_ai_refresh: true }
      });

      return res.status(200).json({ status: 'success' });
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ status: 'error', message: 'Anime not found for user' });
      }
      console.error("Server Error during remove:", err);
      return res.status(500).json({ status: 'error' });
    }
  } else {
    return res.status(401).json({ status: 'unauthorized' });
  }
};

export const toggleFavorite = async (req, res) => {
  if (req.isAuthenticated()) {
    const { anime_id, anime_title, poster_image } = req.body;
    try {
      const existing = await prisma.userLibrary.findUnique({
        where: { user_id_anime_id: { user_id: req.user.id, anime_id: String(anime_id) } }
      });

      if (!existing) {
        // If not in library, add it and mark as favorite
        const entry = await prisma.userLibrary.create({
          data: {
            user_id: req.user.id,
            anime_id: String(anime_id),
            anime_title,
            poster_image,
            status: "planned", // Default status
            is_favorite: true
          }
        });
        return res.json({ status: "success", is_favorite: true, entry });
      }

      const updated = await prisma.userLibrary.update({
        where: { id: existing.id },
        data: { is_favorite: !existing.is_favorite }
      });

      // Mark for AI refresh
      await prisma.user.update({
        where: { id: req.user.id },
        data: { needs_ai_refresh: true }
      });

      res.json({ status: "success", is_favorite: updated.is_favorite });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to toggle favorite" });
    }
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export const updateProfile = async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });

  const { name, email, currentPassword, newPassword, avatar_url, cover_url } = req.body;
  const user = req.user;

  try {
    const updateData = {};

    // 1. Handle Basic Profile Info
    if (name && name !== user.name) updateData.name = name;
    if (avatar_url && avatar_url !== user.avatar_url) updateData.avatar_url = avatar_url;
    if (cover_url && cover_url !== user.cover_url) updateData.cover_url = cover_url;


    // 2. Handle Email Change (Strict: Disable for Google users)
    if (email && email.toLowerCase() !== user.email) {
      if (user.google_id) {
        return res.status(400).json({ error: "Email for Google-linked accounts must be managed through Google." });
      }

      const normalizedEmail = email.toLowerCase();
      
      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingUser) return res.status(400).json({ error: "Email already in use." });

      // Verify password for local users
      if (user.password) {
        if (!currentPassword) return res.status(400).json({ error: "Current password required to change email." });
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ error: "Incorrect password." });
      }

      updateData.email = normalizedEmail;
    }

    // 3. Handle Password Change (Strict: Disable for Google users)
    if (newPassword) {
      if (user.google_id) {
        return res.status(400).json({ error: "Password for Google-linked accounts must be managed through Google." });
      }

      if (user.password) {
        if (!currentPassword) return res.status(400).json({ error: "Current password required to change password." });
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ error: "Incorrect current password." });
      }

      const hash = await bcrypt.hash(newPassword, 10);
      updateData.password = hash;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No changes provided." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    // Update the session user
    req.login(updatedUser, (err) => {
      if (err) return res.status(500).json({ error: "Session update failed." });
      res.json({ success: true, user: updatedUser });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile." });
  }
};
