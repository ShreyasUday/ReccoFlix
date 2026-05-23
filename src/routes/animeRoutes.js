import express from "express";
import * as animeController from "../controllers/animeController.js";
import { aiLimiter } from "../middleware/index.js";

const router = express.Router();

router.get("/category", animeController.getCategory);
router.post("/search", animeController.postSearch);
router.get("/browse", animeController.getBrowse);
router.get("/description", animeController.getDescription);
router.get("/episodes", aiLimiter, animeController.getEpisodes);
router.get("/characters", animeController.getCharacters);
router.get("/ongoing", animeController.getOngoing);
router.get("/recommendations", aiLimiter, animeController.getRecommendations);
router.post("/share-line", aiLimiter, animeController.getShareLine);
router.get("/episode/:id/:num", aiLimiter, animeController.getEpisodeDetail);
router.get("/mood", aiLimiter, animeController.getMoodAnime);

export default router;
