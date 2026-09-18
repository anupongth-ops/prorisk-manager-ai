const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9223;

const edge = spawn(edgePath, [
  '--headless',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  '--window-size=1920,1080',
  'http://localhost:3000/epopm/?demo=true&modal=project-form&theme=light'
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
    const page = targets.find(t => t.type === 'page' && t.url.includes('modal=project-form'));
    if (!page) {
      console.log('Page not found among targets:', targets);
      edge.kill();
      return;
    }

    console.log('Connecting to WebSocket:', page.webSocketDebuggerUrl);
    const ws = new WebSocket(page.webSocketDebuggerUrl);

    ws.onopen = () => {
      console.log('WS connected. Enabling Runtime and Page...');
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));

      // Wait 3 seconds for React to render and then take screenshot
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
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
      } else if (msg.id === 10) {
        if (msg.result && msg.result.data) {
          const buf = Buffer.from(msg.result.data, 'base64');
          const outPath = path.join(__dirname, 'app_screenshots', 'screen_project_form.png');
          fs.writeFileSync(outPath, buf);
          console.log('[SUCCESS] Saved screen_project_form.png, size:', buf.length, 'bytes');
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
