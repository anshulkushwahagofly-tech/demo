const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_URL = 'https://skyclinics.al';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
};

function download(assetPath) {
  const targetUrl = new URL(assetPath, BASE_URL).href;
  console.log('Downloading:', targetUrl);
  return new Promise((resolve) => {
    https.get(targetUrl, { headers: HEADERS }, (res) => {
      if (res.statusCode !== 200) return resolve();
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const localPath = path.join(__dirname, assetPath);
        const dir = path.dirname(localPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(localPath, Buffer.concat(data));
        resolve();
      });
    }).on('error', () => resolve());
  });
}

async function extractFromJS() {
  const jsPath = path.join(__dirname, 'assets', 'index-BsFwCvkF.js');
  if (!fs.existsSync(jsPath)) return;
  
  const jsCode = fs.readFileSync(jsPath, 'utf8');
  
  // Find all absolute paths in the JS
  const regex = /["'](\/(assets|textures|fonts|models|images)\/[^"']+\.[a-zA-Z0-9]+)["']/g;
  let match;
  const queue = new Set();
  
  while ((match = regex.exec(jsCode)) !== null) {
    queue.add(match[1]);
  }
  
  for (let asset of queue) {
    await download(asset);
  }
}

async function extractFromCSS() {
  const cssPath = path.join(__dirname, 'assets', 'index-CE5f5pXt.css');
  if (!fs.existsSync(cssPath)) return;
  
  const cssCode = fs.readFileSync(cssPath, 'utf8');
  const regex = /url\(['"]?(\/[^'")]+)['"]?\)/g;
  let match;
  const queue = new Set();
  
  while ((match = regex.exec(cssCode)) !== null) {
    queue.add(match[1]);
  }
  
  for (let asset of queue) {
    await download(asset);
  }
}

async function run() {
  await extractFromJS();
  await extractFromCSS();
  console.log('Deep download complete.');
}
run();
