import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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
