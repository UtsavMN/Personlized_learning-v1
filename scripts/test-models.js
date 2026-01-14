const https = require('https');
const fs = require('fs');

// Read .env manually since we don't assume dotenv is installed globally
let apiKey = '';
try {
    const envFile = fs.readFileSync('.env', 'utf8');
    const match = envFile.match(/GOOGLE_GENAI_API_KEY=(.*)/);
    if (match) apiKey = match[1].trim();
} catch (e) {
    console.error("Could not read .env");
    process.exit(1);
}

if (!apiKey) {
    console.error("No API Key found");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log("Available Models:");
                json.models.forEach(m => console.log(m.name));
            } else {
                console.log("Error:", json);
            }
        } catch (e) {
            console.log("Response:", data);
        }
    });
}).on('error', (e) => {
    console.error("Error:", e);
});
