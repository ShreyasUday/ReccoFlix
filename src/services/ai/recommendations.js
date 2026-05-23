import Groq from "groq-sdk";

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
