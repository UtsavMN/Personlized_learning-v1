const { HfInference } = require('@huggingface/inference');
const fs = require('fs');
const dotenv = require('dotenv');

async function testHuggingFace() {
    console.log("Testing Hugging Face Integration...");

    // 1. Load Env using dotenv
    const envLocal = dotenv.config({ path: '.env.local' });
    const env = dotenv.config({ path: '.env' });

    console.log("Environment loading debug:");
    if (envLocal.error) console.log(" - .env.local failed/missing");
    else console.log(" - .env.local loaded");

    if (env.error) console.log(" - .env failed/missing");
    else console.log(" - .env loaded");

    const apiKey = process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
        console.error("❌ HUGGINGFACE_API_KEY not found in process.env");
        process.exit(1);
    }

    console.log("✅ HUGGINGFACE_API_KEY found.");
    const hf = new HfInference(apiKey);

    try {
        console.log("Attempting Summarization...");
        const result = await hf.summarization({
            model: 'facebook/bart-large-cnn',
            inputs: "The Apollo program was the third United States human spaceflight program carried out by the National Aeronautics and Space Administration (NASA).",
            parameters: { max_length: 30 }
        });
        console.log("✅ Summarization Result:", result.summary_text);
    } catch (e) {
        console.error("❌ Hugging Face API Call Failed:", e.message);
        process.exit(1);
    }
}

testHuggingFace();
