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
 * Generates a detailed, atmospheric synopsis and dynamic intelligence dossier for a specific episode
 */
export const generateEpisodeAISynopsis = async (animeTitle, episodeNum, episodeTitle = "", seriesSynopsis = "", currentSummary = "") => {
  if (!process.env.GROQ_API_KEY) return null;

  try {
    const prompt = `
      You are a specialized anime archivist and narrative analyst. 
      Analyze Episode ${episodeNum} of the anime "${animeTitle}" and synthesize a thematic intelligence dossier.
      
      CRITICAL CONTEXT:
      - Series: ${animeTitle}
      - Series Premise: ${seriesSynopsis.substring(0, 400)}
      - Episode Number: ${episodeNum}
      - Episode Title: ${episodeTitle || "Unknown"}
      - Existing metadata: "${currentSummary.substring(0, 300)}"
      
      Return a JSON object with:
      "synopsis": A factual, high-fidelity 1-paragraph plot analysis (3-5 sentences). Combine the premise and episode title/context to deduce what challenges or narrative milestones occur. Write in a sophisticated, cinematic, and investigative tone. NEVER say you don't know or apologize.
      "rating": An estimated episode-specific rating (floating number between 7.5 and 9.8) based on how epic/important this episode is in the series context.
      "length": Estimated episode length in minutes (typically 24).
      "archivistNote": A single-sentence cryptic, thematic, or highly analytical note from a cyber-archivist tracking the characters (max 20 words). Examples: "Handa's isolation matrix is fracturing; the social anomalies are becoming self-sustaining." or "The timeline oscillates. Okabe's signal grows fainter."

      Rules:
      1. Return ONLY the JSON object.
      2. Keep the tone completely immersive, cinematic, and analytical.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.65,
      max_tokens: 400,
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    const result = JSON.parse(responseText);
    return result;
  } catch (err) {
    console.error(`❌ AI ENGINE: Episode ${episodeNum} synthesis failed:`, err.message);
    return null;
  }
};
