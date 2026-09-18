const { spawn } = require('child_process');
const http = require('http');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9222;

const edge = spawn(edgePath, [
  '--headless',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  'http://localhost:3000/epopm/?demo=true&modal=project-form&theme=light'
]);

setTimeout(async () => {
  try {
    http.get(`http://127.0.0.1:${port}/json`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Pages:', data);
        edge.kill();
      });
    });
  } catch (e) {
    console.error(e);
    edge.kill();
  }
}, 3000);
