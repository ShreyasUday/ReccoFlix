import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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
