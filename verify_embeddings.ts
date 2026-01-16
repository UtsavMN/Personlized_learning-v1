
// Mock text for embedding
const text = "Mentora is an personalized learning AI.";

import { embeddingService } from './src/lib/ai/local-embeddings';

async function testEmbeddings() {
    console.log("Testing Embedding Service...");
    try {
        const vector = await embeddingService.generateEmbedding(text);
        console.log("✅ Success! Generated vector length:", vector.length);
        if (vector.length === 384) {
            console.log("✅ Vector dimension correct (384 for MiniLM)");
        } else {
            console.log("⚠️ Unexpected vector dimension:", vector.length);
        }
    } catch (e) {
        console.error("❌ Embedding Generation Failed:", e);
    }
}

testEmbeddings();
