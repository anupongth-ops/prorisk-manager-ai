/**
 * generate-export.js
 * Node.js script สำหรับ generate Excel Risk Register จาก template
 * 
 * Usage: node generate-export.js --data '<JSON>' --output 'output.xlsx'
 * หรือเรียกใช้ผ่าน Vite plugin
 */

const XlsxPopulate = require('xlsx-populate');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, 'RefRisk', 'EPM-03-014AT1 – Typical Project Risk Register.xlsx');

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const d = match[3], m = parseInt(match[2], 10) - 1, y = match[1];
    return `${d}-${MONTH_NAMES[m]}-${y}`;
  }
  return dateStr;
}

function formatPossibleEffect(val) {
  if (!val) return '';
  if (Array.isArray(val)) return val.join('+');
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return Object.keys(val).join('+');
  return String(val);
}

/**
 * Generate Excel file from template
 * @param {Object[]} risks - Array of RiskItem
 * @param {string} projectNo - Project number (or 'All')
 * @returns {Promise<Buffer>} Excel file as Buffer
 */
async function generateExcel(risks, projectNo) {
  const wb = await XlsxPopulate.fromFileAsync(TEMPLATE_PATH);
  const templateSheet = wb.sheet(1); // "ตัวอย่าง Project Risk"

  // Get unique projects
  const projectMap = new Map();
  risks.forEach(r => {
    if (!projectMap.has(r.projectNo)) {
      projectMap.set(r.projectNo, { projectNo: r.projectNo, projectName: r.projectName, pmName: r.pmName, email: r.email });
    }
  });

  const projectsToExport = projectNo !== 'All'
    ? Array.from(projectMap.values()).filter(p => p.projectNo === projectNo)
    : Array.from(projectMap.values());

  // Remove the template sheet (we'll re-create or modify it)
  // Actually: clone the template sheet for each project
  const sheetName = templateSheet.name();
  
  let isFirst = true;
  
  for (const project of projectsToExport) {
    const projectRisks = risks.filter(r => r.projectNo === project.projectNo);
    
    let ws;
    if (isFirst) {
      ws = templateSheet;
      isFirst = false;
    } else {
      // Copy the template sheet
      ws = wb.addSheet(`${project.projectNo}`.slice(0, 31).replace(/[:\\\/\?\*\[\]]/g, '_'), 
        wb.sheets().length);
      // xlsx-populate doesn't have easy copy-sheet, so we work with the existing template
      // For multiple projects, we'll handle this differently
      // For now, generate separate files or use the same sheet
      break; // TODO: multi-project support
    }
    
    // Fill project info
    // Row 1: U1 = Project name (merged U1:X1)
    ws.cell('U1').value(project.projectName);
    // Row 2: V2 = Document no (merged V2:X2) - actually col 22 = V
    ws.cell('V2').value(`${project.projectNo}-RISK-REGISTER`);
    // Row 4: Rev 1 date info (col U=21=date, V=22=prepared)
    const today = new Date();
    ws.cell('U4').value(today);
    ws.cell('V4').value(project.pmName || '');
    
    // Group risks by category
    const categoryMap = new Map();
    projectRisks.forEach(r => {
      if (!categoryMap.has(r.riskCategory)) categoryMap.set(r.riskCategory, []);
      categoryMap.get(r.riskCategory).push(r);
    });
    
    // Data starts at row 11
    // Template has existing data rows - we need to:
    // 1. Clear all data rows from row 11 onwards
    // 2. Insert our data
    
    // Find last row with data in template
    const usedRange = ws.usedRange();
    const lastRow = usedRange ? usedRange.endCell().rowNumber() : 200;
    
    // Clear rows from 11 to lastRow
    for (let r = lastRow; r >= 11; r--) {
      ws.row(r).delete();
    }
    
    // Re-insert data rows
    let currentRow = 11;
    let catNo = 1;
    
    for (const [category, catRisks] of categoryMap) {
      // Category header row (styled like template row 11: light blue background)
      const catRow = ws.row(currentRow);
      ws.cell(currentRow, 1).value(catNo);
      ws.cell(currentRow, 2).value(category);
      // Merge cols 2-6 for category name
      ws.range(currentRow, 2, currentRow, 6).merged(true);
      
      // Style the category row (light blue: theme 7, tint 0.4 ≈ #BDD7EE)
      for (let c = 1; c <= 24; c++) {
        ws.cell(currentRow, c).style({
          fill: 'BDD7EE',
          bold: true,
          fontFamily: 'Arial',
          fontSize: 10,
          wrapText: true,
        });
      }
      catRow.height(27);
      currentRow++;
      catNo++;
      
      // Risk rows
      for (const risk of catRisks) {
        ws.cell(currentRow, 1).value(risk.riskId || '');
        ws.cell(currentRow, 2).value(risk.description || '');
        // Merge cols 2-6
        ws.range(currentRow, 2, currentRow, 6).merged(true);
        
        ws.cell(currentRow, 7).value(formatPossibleEffect(risk.possibleEffect));
        ws.cell(currentRow, 8).value(risk.initialRisk?.likelihood ?? 1);
        ws.cell(currentRow, 9).value(risk.initialRisk?.impact ?? 1);
        ws.cell(currentRow, 10).value(risk.mitigationStrategy || '');
        ws.cell(currentRow, 11).value(risk.actionToControl || '');
        // Merge cols 11-16 for action
        ws.range(currentRow, 11, currentRow, 16).merged(true);
        
        ws.cell(currentRow, 17).value(risk.costToMitigate || ''); // CTM (cost to mitigate)
        ws.cell(currentRow, 18).value(risk.probabilityOfSuccess || ''); // POS
        ws.cell(currentRow, 19).value(risk.owner || '');
        ws.cell(currentRow, 20).value(formatDate(risk.raisedDate));
        ws.cell(currentRow, 21).value(formatDate(risk.deadlineDate));
        ws.cell(currentRow, 22).value(formatDate(risk.finishedDate));
        ws.cell(currentRow, 23).value(risk.status || 'Open');
        ws.cell(currentRow, 24).value(risk.comment || '');
        
        // Style the data row
        for (let c = 1; c <= 24; c++) {
          ws.cell(currentRow, c).style({
            fontFamily: 'Arial',
            fontSize: 10,
            wrapText: true,
            verticalAlignment: 'top',
            border: {
              top: { style: 'thin', color: '000000' },
              bottom: { style: 'thin', color: '000000' },
              left: { style: 'thin', color: '000000' },
              right: { style: 'thin', color: '000000' },
            }
          });
        }
        ws.row(currentRow).height(27);
        currentRow++;
      }
    }
  }
  
  // Rename first sheet
  if (projectsToExport.length > 0) {
    const p = projectsToExport[0];
    const newName = (projectNo !== 'All' ? projectNo : 'Risk Register').slice(0, 31).replace(/[:\\\/\?\*\[\]]/g, '_');
    try { wb.sheet(1).name(newName); } catch(e) {}
  }
  
  return wb.outputAsync();
}

module.exports = { generateExcel };

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const dataIdx = args.indexOf('--data');
  const outIdx = args.indexOf('--output');
  
  if (dataIdx === -1 || outIdx === -1) {
    console.log('Usage: node generate-export.js --data <json_file> --output <output.xlsx>');
    process.exit(1);
  }
  
  const dataFile = args[dataIdx + 1];
  const outputFile = args[outIdx + 1];
  const projectNo = args[args.indexOf('--project') + 1] || 'All';
  
  const fs = require('fs');
  const risks = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  
  generateExcel(risks, projectNo).then(buf => {
    fs.writeFileSync(outputFile, buf);
    console.log('Generated:', outputFile);
  }).catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
  });
}
