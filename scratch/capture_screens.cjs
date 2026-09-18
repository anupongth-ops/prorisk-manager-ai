const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join(__dirname, 'app_screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const targets = [
  { name: 'screen_excel.png', url: 'http://localhost:3000/epopm/?demo=true&view=excel&theme=light' },
  { name: 'screen_tor.png', url: 'http://localhost:3000/epopm/?demo=true&view=tor-risk&theme=light' },
  { name: 'screen_risk_form.png', url: 'http://localhost:3000/epopm/?demo=true&modal=risk-form&theme=light' },
  { name: 'screen_project_form.png', url: 'http://localhost:3000/epopm/?demo=true&modal=project-form&theme=light' }
];

for (const t of targets) {
  const outFile = path.join(outDir, t.name);
  console.log(`Capturing ${t.name} from ${t.url}...`);
  const cmd = `"${edgePath}" --headless --disable-gpu --virtual-time-budget=6000 --window-size=1920,1080 --screenshot="${outFile}" "${t.url}"`;
  try {
    execSync(cmd, { stdio: 'pipe' });
    const stats = fs.statSync(outFile);
    console.log(`[SUCCESS] ${t.name} captured (${stats.size} bytes)`);
  } catch (err) {
    console.error(`[ERROR] Failed ${t.name}:`, err.message);
  }
}
