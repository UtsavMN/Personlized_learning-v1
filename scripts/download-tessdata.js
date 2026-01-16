const fs = require('fs');
const https = require('https');
const path = require('path');

const url = 'https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0/eng.traineddata.gz';
const dest = path.join(__dirname, '../public/lang-data/eng.traineddata.gz');

// Ensure directory exists
const dir = path.dirname(dest);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

console.log(`Downloading ${url} to ${dest}...`);

const file = fs.createWriteStream(dest);
https.get(url, function (response) {
    if (response.statusCode !== 200) {
        console.error(`Failed to download: Status Code ${response.statusCode}`);
        process.exit(1);
    }
    response.pipe(file);
    file.on('finish', function () {
        file.close(() => {
            console.log('Download completed.');
            process.exit(0);
        });
    });
}).on('error', function (err) {
    fs.unlink(dest, () => { });
    console.error('Error downloading file:', err.message);
    process.exit(1);
});
