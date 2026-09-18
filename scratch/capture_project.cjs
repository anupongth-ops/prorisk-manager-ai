const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join(__dirname, 'app_screenshots');
const outFile = path.join(outDir, 'screen_project_form.png');

console.log('Capturing screen_project_form.png...');
const args = [
  '--headless',
  '--disable-gpu',
  '--virtual-time-budget=10000',
  '--window-size=1920,1080',
  `--screenshot=${outFile}`,
  'http://localhost:3000/epopm/?demo=true&modal=project-form&theme=light'
];
spawnSync(edgePath, args, { encoding: 'utf8' });
if (fs.existsSync(outFile)) {
  console.log('Finished. Size =', fs.statSync(outFile).size);
}
