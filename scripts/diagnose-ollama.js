// Native fetch is available in Node 18+

async function checkOllama() {
    console.log("Diagnostics: Checking Ollama Connection...");
    const url = 'http://127.0.0.1:11434/api/tags';

    try {
        console.log(`Attempting GET ${url}`);
        const response = await fetch(url);

        if (response.ok) {
            console.log("✅ Success: Ollama is reachable.");
            const data = await response.json();
            console.log("Available Models:", data.models.map(m => m.name));
            return true;
        } else {
            console.error(`❌ Error: Ollama responded with status ${response.status}`);
            console.error(await response.text());
            return false;
        }
    } catch (error) {
        console.error("❌ Fatal Error: Could not connect to Ollama.");
        console.error(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        if (error.cause) console.error("Cause:", error.cause);

        if (error.code === 'ECONNREFUSED' || (error.cause && error.cause.code === 'ECONNREFUSED')) {
            console.log("\nPossible Causes:");
            console.log("1. Ollama is NOT running. Run 'ollama serve' in a separate terminal.");
            console.log("2. Ollama is blocked by firewall.");
            console.log("3. Port 11434 is occupied.");
        }
        return false;
    }
}

async function testGeneration() {
    console.log("\nDiagnostics: Testing Text Generation (llama3)...");
    const url = 'http://127.0.0.1:11434/api/generate';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "llama3",
                prompt: "Hello",
                stream: false
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Generation Success:", data.response);
        } else {
            console.error("❌ Generation Failed:", await response.text());
        }
    } catch (e) {
        console.error("❌ Generation Error:", e.message);
    }
}

(async () => {
    const isUp = await checkOllama();
    if (isUp) await testGeneration();
})();
