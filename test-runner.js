import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MIME type map for static serving
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

function createStaticServer(port = 8080) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(__dirname, req.url.split('?')[0]);
      if (filePath === __dirname || filePath.endsWith('/')) {
        filePath = path.join(filePath, 'index.html');
      }

      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(500);
            res.end(`Server Error: ${err.code}`);
          }
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    });

    server.listen(port, () => {
      console.log(`📡 Local server listening on http://localhost:${port}`);
      resolve(server);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${port} in use; assuming existing server is running.`);
        resolve(null);
      } else {
        console.error('Server error:', err);
        resolve(null);
      }
    });
  });
}

(async () => {
  console.log('🚀 Executing Antigravity Localhost Verification Suite...');

  const server = await createStaticServer(8080);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    permissions: ['microphone'],
  });
  const page = await context.newPage();

  try {
    const response = await page.goto('http://localhost:8080');
    if (!response || response.status() !== 200) {
      throw new Error(`Local server unreachable: status ${response ? response.status() : 'NO_RESPONSE'}`);
    }
    console.log('✅ Server running on http://localhost:8080 (Status: 200)');

    await page.waitForSelector('#start-screen', { state: 'visible' });
    console.log('✅ Initial landing screen rendered');

    await page.click('#start-btn');
    await page.waitForSelector('#start-screen', { state: 'hidden' });
    console.log('✅ Audio permission trigger accepted & start screen dismissed');

    await page.waitForSelector('.speech-bubble.show', { timeout: 4000 });
    console.log('✅ Chibi intro & wobble run complete; speech bubble visible');

    await page.click('#blow-hint');
    await page.waitForSelector('#flame-1.out', { timeout: 1000 });
    await page.waitForSelector('#flame-2.out', { timeout: 1000 });
    await page.waitForSelector('#flame-3.out', { timeout: 1000 });
    console.log('✅ Blow event triggered and all 3 candle flames extinguished');

    await page.waitForSelector('#penguin.cheering', { timeout: 1000 });
    await page.waitForSelector('#card-modal.open', { timeout: 2500 });
    console.log('✅ Celebration state active and 3D card modal opened');

    console.log('\n🎉 ALL LOCALHOST VERIFICATIONS PASSED.');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    if (server) {
      server.close();
    }
  }
})();
