
// Native fetch in Node 18+
async function pullModel() {
    const model = 'llama3';
    console.log(`🚀 Starting API Pull for '${model}'...`);

    try {
        const response = await fetch('http://127.0.0.1:11434/api/pull', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: model })
        });

        if (!response.ok) {
            console.error(`❌ API Error: ${response.status} ${response.statusText}`);
            console.error(await response.text());
            return;
        }

        // Handle streaming response
        // Using Node.js native readable stream from fetch
        for await (const chunk of response.body) {
            const text = new TextDecoder().decode(chunk);
            const lines = text.split('\n').filter(Boolean);

            for (const line of lines) {
                try {
                    const json = JSON.parse(line);
                    if (json.total && json.completed) {
                        const pct = Math.round((json.completed / json.total) * 100);
                        process.stdout.write(`\rDownloading: ${pct}% `);
                    } else if (json.status) {
                        console.log(`\nStatus: ${json.status}`);
                    }
                } catch (e) {
                    // Ignore partial JSON
                }
            }
        }
        console.log("\n✅ Model pulled successfully!");
    } catch (error) {
        console.error("\n❌ Connection Error:", error.message);
    }
}

pullModel();
