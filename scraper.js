const fs = require('fs');
const path = require('path');
const https = require('https');
const url = require('url');

const BASE_URL = 'https://skyclinics.al';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5'
};

const downloaded = new Set();
const queue = ['/'];

function download(assetPath) {
  if (downloaded.has(assetPath)) return Promise.resolve();
  downloaded.add(assetPath);
  
  const targetUrl = new URL(assetPath, BASE_URL).href;
  console.log('Downloading:', targetUrl);
  
  return new Promise((resolve, reject) => {
    https.get(targetUrl, { headers: HEADERS }, (res) => {
      if (res.statusCode !== 200) {
        console.log(`Failed to download ${targetUrl}: ${res.statusCode}`);
        return resolve(); // Skip failed
      }
      
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        
        let savePath = assetPath === '/' ? '/index.html' : assetPath;
        if(savePath.endsWith('/')) savePath += 'index.html';
        
        const localPath = path.join(__dirname, savePath);
        const dir = path.dirname(localPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // If it's a text file (HTML/CSS/JS), search for more assets
        if (savePath.match(/\.(html|css|js)$/i) || savePath === '/index.html') {
          let text = buffer.toString('utf8');
          // Find URLs in src="", href="", url()
          const regexes = [
            /href=["'](\/[^"']+)["']/g,
            /src=["'](\/[^"']+)["']/g,
            /url\(['"]?(\/[^'")]+)['"]?\)/g,
            /from ["'](\/[^"']+)["']/g, // JS imports
            /import ["'](\/[^"']+)["']/g
          ];
          
          regexes.forEach(regex => {
            let match;
            while ((match = regex.exec(text)) !== null) {
              const newAsset = match[1];
              if (!newAsset.startsWith('//') && !downloaded.has(newAsset)) {
                queue.push(newAsset);
              }
            }
          });
          
          fs.writeFileSync(localPath, text);
        } else {
          fs.writeFileSync(localPath, buffer);
        }
        resolve();
      });
    }).on('error', (err) => {
      console.log(`Error downloading ${targetUrl}:`, err.message);
      resolve();
    });
  });
}

async function start() {
  while (queue.length > 0) {
    const asset = queue.shift();
    await download(asset);
  }
  console.log('Finished downloading all discovered assets!');
}

start();
