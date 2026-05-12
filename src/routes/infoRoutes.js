import express from "express";
import * as infoController from "../controllers/infoController.js";

const router = express.Router();

router.get("/about", infoController.getAbout);
router.get("/privacy", infoController.getPrivacy);
router.get("/terms", infoController.getTerms);

export default router;
