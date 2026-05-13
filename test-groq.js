import dotenv from 'dotenv';
dotenv.config();
import Groq from 'groq-sdk';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
async function test() {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Say hi in JSON format: {\"message\": \"hi\"}" }],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" }
    });
    console.log("Success:", chatCompletion.choices[0]?.message?.content);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
test();
