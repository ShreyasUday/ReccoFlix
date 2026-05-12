import express from "express";
import * as animeController from "../controllers/animeController.js";

const router = express.Router();

router.get("/category", animeController.getCategory);
router.post("/search", animeController.postSearch);
router.get("/browse", animeController.getBrowse);
router.get("/description", animeController.getDescription);
router.get("/episodes", animeController.getEpisodes);
router.get("/characters", animeController.getCharacters);
router.get("/ongoing", animeController.getOngoing);
router.get("/recommendations", animeController.getRecommendations);
router.post("/share-line", animeController.getShareLine);
router.get("/episode/:id/:num", animeController.getEpisodeDetail);
router.get("/mood", animeController.getMoodAnime);

export default router;
