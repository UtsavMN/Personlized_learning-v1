
async function listModels() {
    console.log("Checking installed models via API...");
    try {
        const response = await fetch('http://127.0.0.1:11434/api/tags');
        if (!response.ok) {
            console.error("API Error:", response.status);
            return;
        }
        const data = await response.json();
        console.log("Installed Models:", JSON.stringify(data.models, null, 2));
    } catch (e) {
        console.error("Connection Error:", e.message);
    }
}
listModels();
