import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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
