import dotenv from 'dotenv';
dotenv.config();

const { getMoodRecommendations } = await import('./src/services/aiService.js');

async function run() {
  console.log("Testing getMoodRecommendations...");
  try {
    const res = await getMoodRecommendations("Cozy");
    console.log("Result length:");
    console.log(res.length);
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
