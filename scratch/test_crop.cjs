const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9224;

const edge = spawn(edgePath, [
  '--headless',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  '--window-size=1600,900',
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
      console.log('Page not found:', targets);
      edge.kill();
      return;
    }

    const ws = new WebSocket(page.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));

      // Wait for render, then evaluate modal position
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 5,
          method: 'Runtime.evaluate',
          params: {
            expression: `(() => {
              const form = document.querySelector('form');
              if (!form) return null;
              const modal = form.closest('.rounded-xl');
              if (!modal) return null;
              const r = modal.getBoundingClientRect();
              return { x: r.x, y: r.y, width: r.width, height: r.height };
            })()`,
            returnByValue: true
          }
        }));
      }, 3000);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 5) {
        const rect = msg.result && msg.result.result && msg.result.result.value;
        console.log('Modal rect:', rect);
        if (rect) {
          // Compute 16:9 crop centered on the modal
          const padY = 30;
          const targetH = rect.height + padY * 2;
          const targetW = targetH * (16 / 9);
          const targetX = Math.max(0, (rect.x + rect.width / 2) - targetW / 2);
          const targetY = Math.max(0, rect.y - padY);

          console.log('Clip:', { x: targetX, y: targetY, width: targetW, height: targetH });
          ws.send(JSON.stringify({
            id: 10,
            method: 'Page.captureScreenshot',
            params: {
              format: 'png',
              clip: {
                x: targetX,
                y: targetY,
                width: targetW,
                height: targetH,
                scale: 1
              }
            }
          }));
        } else {
          ws.send(JSON.stringify({ id: 10, method: 'Page.captureScreenshot', params: { format: 'png' } }));
        }
      } else if (msg.id === 10) {
        if (msg.result && msg.result.data) {
          const buf = Buffer.from(msg.result.data, 'base64');
          const outPath = path.join(__dirname, 'app_screenshots', 'screen_project_form_focused.png');
          fs.writeFileSync(outPath, buf);
          console.log('[SUCCESS] Saved focused screenshot, size:', buf.length, 'bytes');
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
