import Groq from "groq-sdk";
import axios from "axios";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Generates anime recommendations based on user's library
 */
export const getAIRecommendations = async (userAnime = [], favoriteGenres = []) => {
  if (!process.env.GROQ_API_KEY) {
    console.warn("⚠️ AI ENGINE: GROQ_API_KEY not found in .env");
    return { recommendations: [], confidence: 0 };
  }

  try {
    const watchList = userAnime.join(", ");
    const genres = favoriteGenres.join(", ");

    const prompt = `
      You are an expert anime recommendation engine. 
      The user has watched: [${watchList}].
      Their favorite genres are: [${genres}].

      Based on this data, return a JSON object with:
      1. "recommendations": An array of 15 unique anime objects, each containing:
         - "title": The anime title.
         - "reason": A 5-7 word reason why this matches the user (e.g., "Matches your Cyberpunk interest", "Similar dark tone to [User Anime]").
         - CRITICAL: Do NOT suggest sequels or different seasons of anything in the user's list.
      2. "confidence": A number (0-100).
      3. "message": A short 5-word status.

      Return ONLY the JSON.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.6,
      max_tokens: 600,
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    const result = JSON.parse(responseText);
    
    // Fallback confidence if the AI is being shy
    const calculatedConfidence = result.confidence || (userAnime.length > 0 ? Math.min(65 + (userAnime.length * 2), 98) : 0);
    
    return {
      recommendations: result.recommendations || [],
      confidence: Math.round(calculatedConfidence),
      message: result.message || "Precision Match"
    };
  } catch (err) {
    console.error("❌ AI ENGINE ERROR:", err.message);
    return { recommendations: [], confidence: 0 };
  }
};

/**
 * Generates a catchy one-liner for an anime to share
 */
export const generateShareLine = async (title, synopsis) => {
  if (!process.env.GROQ_API_KEY) return `Check out ${title} on ReccoFlix!`;

  try {
    const prompt = `
      Generate a single, extremely catchy, one-line "hook" or recommendation for the anime "${title}".
      Use the following synopsis for context: "${synopsis.substring(0, 500)}".
      
      Rules:
      1. Must be exactly one sentence.
      2. Must be persuasive and hype-filled (e.g., "If you love X, you HAVE to watch Y!").
      3. Do NOT use hashtags.
      4. Do NOT use emojis.
      5. Return ONLY the sentence.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.8,
      max_tokens: 100
    });

    return chatCompletion.choices[0]?.message?.content.trim();
  } catch (err) {
    console.error("❌ AI ENGINE: Share line generation failed:", err.message);
    return `You need to check out ${title}—it's absolutely legendary!`;
  }
};

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

/**
 * Generates a full, professional synopsis if Kitsu's is too short or missing
 */
export const generateAISynopsis = async (title, kitsuData = {}) => {
  if (!process.env.GROQ_API_KEY) return null;

  try {
    const prompt = `
      You are an expert anime journalist. Generate a professional, high-quality, 3-paragraph synopsis for the anime "${title}".
      Use these Kitsu metadata attributes for context if available:
      - Type: ${kitsuData.attributes?.subtype}
      - Rating: ${kitsuData.attributes?.averageRating}
      - Basic Info: ${kitsuData.attributes?.synopsis}
      - Age Rating: ${kitsuData.attributes?.ageRatingGuide}

      Rules:
      1. Write exactly 2 paragraphs.
      2. First paragraph: Hook the reader with the premise, characters, and tone.
      3. Second paragraph: Describe the plot tension and why this anime is worth watching (art style, themes, etc.).
      4. Tone: Atmospheric, sophisticated, and engaging.
      5. Return ONLY the synopsis text.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 600
    });

    return chatCompletion.choices[0]?.message?.content.trim();
  } catch (err) {
    console.error("❌ AI ENGINE: Synopsis generation failed:", err.message);
    return null;
  }
};

/**
 * Generates a detailed, atmospheric synopsis for a specific episode
 */
export const generateEpisodeAISynopsis = async (animeTitle, episodeNum, episodeTitle = "", seriesSynopsis = "", currentSummary = "") => {
  if (!process.env.GROQ_API_KEY) return null;

  try {
    const prompt = `
      You are a specialized anime archivist and narrative analyst. 
      Generate a factual, high-fidelity 1-paragraph plot analysis for Episode ${episodeNum} of the anime "${animeTitle}".
      
      CRITICAL CONTEXT:
      - Series: ${animeTitle}
      - Series Premise: ${seriesSynopsis.substring(0, 400)}
      - Episode Number: ${episodeNum}
      - Episode Title: ${episodeTitle || "Unknown"}
      - Existing metadata: "${currentSummary.substring(0, 300)}"
      
      Rules:
      1. NARRATIVE SYNERGY: Combine the "Series Premise" and "Episode Title" to deduce the narrative stage. If specific metadata is missing, use the premise to write an engaging, thematic, and speculative preview of what challenges might await in Episode ${episodeNum}.
      2. IMMERSION FIRST: NEVER apologize, NEVER state that you lack metadata, and NEVER break character. Always write as if you are uncovering the plot.
      3. TONE: Professional, cinematic, and investigative.
      4. Length: 3-5 sentences.
      5. Return ONLY the analysis text.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.6,
      max_tokens: 300
    });

    return chatCompletion.choices[0]?.message?.content.trim();
  } catch (err) {
    console.error(`❌ AI ENGINE: Episode ${episodeNum} synopsis failed:`, err.message);
    return null;
  }
};

/**
 * Generates anime recommendations based on a mood/vibe
 */
export const getMoodRecommendations = async (mood) => {
  if (!process.env.GROQ_API_KEY) {
    console.warn("⚠️ AI ENGINE: GROQ_API_KEY not found in .env");
    return [];
  }

  try {
    const prompt = `
      You are an expert anime curator. A user wants anime that matches this mood/vibe: "${mood}".

      Return a JSON object with:
      "picks": An array of 10 anime objects, each containing:
        - "title": The exact canonical anime title (English preferred).
        - "reason": A compelling 6-10 word reason why this fits the "${mood}" mood.

      Rules:
      1. Pick a diverse mix of well-known and hidden gems.
      2. Every pick MUST genuinely match the requested mood.
      3. No duplicate titles.
      4. Return ONLY the JSON.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.75,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    const result = JSON.parse(responseText);
    return result.picks || [];
  } catch (err) {
    console.error("❌ AI ENGINE: Mood recommendations failed:", err.message);
    return [];
  }
};

/**
 * Generates a fresh editorial trending slate. API popularity still decides the
 * baseline; Groq adds recency/context so the row feels less random.
 */
export const getTrendingRecommendations = async (signals = []) => {
  if (!process.env.GROQ_API_KEY) {
    console.warn("⚠️ AI ENGINE: GROQ_API_KEY not found in .env");
    return [];
  }

  try {
    const signalText = signals
      .filter(Boolean)
      .slice(0, 24)
      .map((title, index) => `${index + 1}. ${title}`)
      .join("\n");

    const prompt = `
      You are an anime trend analyst for ReccoFlix.

      Current API popularity/season signals:
      ${signalText || "No external signals available."}

      Return a JSON object with:
      "picks": an array of 20 anime objects, each containing:
        - "title": exact canonical anime title, English preferred if widely used.
        - "reason": a punchy 5-9 word reason why it is trending now.

      Rules:
      1. Blend current-season buzz, broad popularity, and social conversation.
      2. Prefer anime that are discoverable via Kitsu by title.
      3. Avoid duplicate franchises/seasons unless one is truly dominant.
      4. No movies-only list; mix TV/ONA/movies naturally.
      5. Return ONLY the JSON.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.65,
      max_tokens: 650,
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    const result = JSON.parse(responseText);
    return result.picks || [];
  } catch (err) {
    console.error("❌ AI ENGINE: Trending recommendations failed:", err.message);
    return [];
  }
};
