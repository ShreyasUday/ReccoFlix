// Re-export all AI services from their modular files
export { getAIRecommendations } from "./recommendations.js";
export { generateShareLine } from "./shareHooks.js";
export { fetchKitsuDetailsByTitle } from "./kitsuFetch.js";
export { generateAISynopsis, generateEpisodeAISynopsis } from "./synopsis.js";
export { getMoodRecommendations } from "./mood.js";
export { getTrendingRecommendations } from "./trending.js";
