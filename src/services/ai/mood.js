import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Generates anime recommendations based on a mood/vibe
 */
export const getMoodRecommendations = async (mood, exclude = []) => {
  if (!process.env.GROQ_API_KEY) {
    console.warn("⚠️ AI ENGINE: GROQ_API_KEY not found in .env");
    return [];
  }

  try {
    let excludeInstruction = "";
    if (exclude && exclude.length > 0) {
      excludeInstruction = `\nCRITICAL EXCLUSIONS: The user has already watched the following anime, so you MUST NOT recommend any of them under any circumstances: ${exclude.map(t => `"${t}"`).join(", ")}. Recommend entirely different anime instead.\n`;
    }

    const prompt = `
      You are an expert anime curator. A user wants anime that matches this mood/vibe: "${mood}".
      ${excludeInstruction}
      Return a JSON object with:
      "picks": An array of 15 anime objects, each containing:
        - "title": The exact canonical anime title (English preferred).
        - "reason": A compelling 6-10 word reason why this fits the "${mood}" mood.

      Rules:
      1. Pick a diverse mix of well-known and hidden gems.
      2. Every pick MUST genuinely match the requested mood.
      3. No duplicate titles.
      4. Avoid all titles mentioned in the CRITICAL EXCLUSIONS list.
      5. Return ONLY the raw JSON object. Do not include any explanations or intro text outside the JSON.
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
