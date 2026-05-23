import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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
