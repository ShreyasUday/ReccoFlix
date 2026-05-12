import express from "express";
import * as userController from "../controllers/userController.js";

const router = express.Router();

router.get("/profile", userController.getProfile);
router.post("/library/add", userController.addAnimeToLibrary);
router.post("/library/remove", userController.removeAnimeFromLibrary);
router.post("/library/favorite", userController.toggleFavorite);
router.post("/update-profile", userController.updateProfile);

export default router;
