import axios from "axios";

/**
 * Searches for anime metadata on Kitsu by title
 */
export const fetchKitsuDetailsByTitle = async (title) => {
  try {
    const response = await axios.get(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(title)}&page[limit]=1`);
    if (response.data.data.length > 0) {
      return response.data.data[0];
    }
    return null;
  } catch (err) {
    console.error(`❌ AI ENGINE: Kitsu search error for ${title}:`, err.message);
    return null;
  }
};
