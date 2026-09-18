const { spawnSync } = require('child_process');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const res = spawnSync(edgePath, [
  '--headless',
  '--disable-gpu',
  '--dump-dom',
  'http://localhost:3000/epopm/?demo=true&modal=project-form&theme=light'
], { encoding: 'utf8' });

fs.writeFileSync('d:\\Apps\\epopm\\prorisk-manager-ai\\scratch\\project_form_dom.html', res.stdout);
console.log('Dumped DOM length:', res.stdout.length);
