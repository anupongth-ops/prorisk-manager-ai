const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9225;

const edge = spawn(edgePath, [
  '--headless',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  '--window-size=1920,1080',
  'http://localhost:3000/epopm/?demo=true&modal=project-form-step2&theme=light'
]);

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

setTimeout(async () => {
  try {
    const targets = await getJson(`http://127.0.0.1:${port}/json`);
    const page = targets.find(t => t.type === 'page' && t.url.includes('modal=project-form-step2'));
    if (!page) {
      console.log('Page not found among targets:', targets);
      edge.kill();
      return;
    }

    console.log('Connecting to WebSocket:', page.webSocketDebuggerUrl);
    const ws = new WebSocket(page.webSocketDebuggerUrl);

    ws.onopen = () => {
      console.log('WS connected. Enabling Page...');
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));

      // Wait 3.5 seconds for React to render Step 2 modal
      setTimeout(() => {
        console.log('Requesting Page.captureScreenshot...');
        ws.send(JSON.stringify({
          id: 10,
          method: 'Page.captureScreenshot',
          params: { format: 'png' }
        }));
      }, 3500);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 10) {
        if (msg.result && msg.result.data) {
          const buf = Buffer.from(msg.result.data, 'base64');
          const outPath = path.join(__dirname, 'app_screenshots', 'screen_weighting_factors.png');
          fs.writeFileSync(outPath, buf);
          console.log('[SUCCESS] Saved screen_weighting_factors.png, size:', buf.length, 'bytes');
        } else {
          console.error('Screenshot error:', msg.error);
        }
        ws.close();
        edge.kill();
      }
    };

    ws.onerror = (err) => {
      console.error('WS Error:', err);
      edge.kill();
    };

  } catch (err) {
    console.error('Script Error:', err);
    edge.kill();
  }
}, 2000);
