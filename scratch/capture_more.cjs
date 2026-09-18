const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join(__dirname, 'app_screenshots');

function capture(name, url, timeBudget = 8000) {
  const outFile = path.join(outDir, name);
  console.log(`Testing capture ${name} from ${url}...`);
  const args = [
    '--headless',
    '--disable-gpu',
    `--virtual-time-budget=${timeBudget}`,
    '--window-size=1920,1080',
    `--screenshot=${outFile}`,
    url
  ];
  const res = spawnSync(edgePath, args, { encoding: 'utf8' });
  if (fs.existsSync(outFile)) {
    const size = fs.statSync(outFile).size;
    console.log(`Result ${name}: size = ${size} bytes`);
  } else {
    console.log(`Result ${name}: file not created!`);
  }
}

capture('screen_project_form.png', 'http://localhost:3000/epopm/?demo=true&modal=project-form&theme=light', 8000);
capture('screen_export.png', 'http://localhost:3000/epopm/?demo=true&modal=export&theme=light', 8000);
