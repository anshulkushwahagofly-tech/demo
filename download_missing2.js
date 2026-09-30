const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_URL = 'https://skyclinics.al';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
};

const filesToDownload = [
  '/images/albania-dental.webp',
  '/videos/a8086823bb8eb65591d2c6b31ac70b2082a62442-desktop.mp4',
  '/data/countries.geojson',
  '/videos/052c7c80acbcca38eb7bcdfa6c1aca921e1b2eba-desktop.mp4',
];

function download(assetPath) {
  const targetUrl = new URL(assetPath, BASE_URL).href;
  console.log('Downloading:', targetUrl);
  return new Promise((resolve) => {
    https.get(targetUrl, { headers: HEADERS }, (res) => {
      if (res.statusCode !== 200) {
        console.log('Failed:', targetUrl, res.statusCode);
        return resolve();
      }
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const localPath = path.join(__dirname, assetPath);
        const dir = path.dirname(localPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(localPath, Buffer.concat(data));
        console.log('Saved:', localPath);
        resolve();
      });
    }).on('error', () => resolve());
  });
}

async function run() {
  for (let file of filesToDownload) {
    await download(file);
  }
}
run();
