/**
 * export-server.cjs
 * Standalone mini HTTP server สำหรับ generate Excel จาก template
 * รัน: node export-server.cjs
 * Default port: 3099
 * 
 * Endpoint: POST http://localhost:3099/export-excel
 * Body: { risks: RiskItem[], projectNo: string }
 * Response: Excel file binary
 */

const http = require('http');
const path = require('path');
const ExcelJS = require('exceljs');

const PORT = 3099;
const TEMPLATE_PATH = path.join(__dirname, 'RefRisk', 'EPM-03-014AT1 – Typical Project Risk Register.xlsx');

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const d = parseInt(match[3], 10);
    const m = parseInt(match[2], 10) - 1;
    const y = match[1];
    return `${String(d).padStart(2,'0')}-${MONTH_NAMES[m]}-${y}`;
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

// Style definitions matching template
const HEADER_BG_COLOR = { argb: 'FFBDD7EE' }; // Light blue for category rows
const BORDER_THIN = { style: 'thin', color: { argb: 'FF000000' } };
const FONT_ARIAL = { name: 'Arial', size: 10 };
const FONT_ARIAL_BOLD = { name: 'Arial', size: 10, bold: true };
const FONT_TAHOMA_HEADER = { name: 'Tahoma', size: 18, bold: true };

function applyCellBorder(cell) {
  cell.border = {
    top: BORDER_THIN, bottom: BORDER_THIN,
    left: BORDER_THIN, right: BORDER_THIN
  };
}

function applyDataCellStyle(cell) {
  cell.font = FONT_ARIAL;
  cell.alignment = { vertical: 'top', wrapText: true };
  applyCellBorder(cell);
}

function applyCategoryStyle(cell) {
  cell.font = FONT_ARIAL_BOLD;
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: HEADER_BG_COLOR };
  cell.alignment = { vertical: 'middle', wrapText: true };
  applyCellBorder(cell);
}

async function generateExcel(risks, projectNo) {
  // Load template
  const templateWb = new ExcelJS.Workbook();
  await templateWb.xlsx.readFile(TEMPLATE_PATH);
  const srcSheet = templateWb.worksheets[0]; // Template worksheet (26 columns)

  // Create a new workbook that will contain only the exported worksheets
  const wb = new ExcelJS.Workbook();
  wb.creator = 'E-PO-PM Risk Manager';
  wb.created = new Date();

  // Get unique projects
  const projectMap = new Map();
  risks.forEach(r => {
    if (!projectMap.has(r.projectNo)) {
      projectMap.set(r.projectNo, {
        projectNo: r.projectNo,
        projectName: r.projectName,
        pmName: r.pmName,
        email: r.email
      });
    }
  });

  const projectsToExport = projectNo !== 'All'
    ? Array.from(projectMap.values()).filter(p => p.projectNo === projectNo)
    : Array.from(projectMap.values());

  for (const project of projectsToExport) {
    const projectRisks = risks.filter(r => r.projectNo === project.projectNo);
    const sheetName = project.projectNo.slice(0, 31).replace(/[:\\\/\?\*\[\]]/g, '_');
    const ws = wb.addWorksheet(sheetName);

    // 1. Copy column widths from srcSheet
    srcSheet.columns.forEach((col, i) => {
      if (col.width) {
        ws.getColumn(i + 1).width = col.width;
      }
    });

    // 2. Copy Row 1 to 9 (Header)
    for (let r = 1; r <= 9; r++) {
      const srcRow = srcSheet.getRow(r);
      const destRow = ws.getRow(r);
      destRow.height = srcRow.height;
      for (let c = 1; c <= 26; c++) {
        const srcCell = srcRow.getCell(c);
        const destCell = destRow.getCell(c);
        destCell.value = srcCell.value;
        destCell.style = srcCell.style;
      }
    }

    // 3. Set Project details and Revision details
    ws.getCell('W1').value = project.projectName;
    ws.getCell('W2').value = `${project.projectNo}-RISK-REGISTER`;
    const todayStr = formatDate(new Date().toISOString().slice(0, 10));
    ws.getCell('V4').value = 1;
    ws.getCell('W4').value = todayStr;
    ws.getCell('X4').value = project.pmName || '';

    // 4. Copy Merges that are strictly within Rows 1-9
    srcSheet.model.merges.forEach(merge => {
      const match = merge.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
      if (match) {
        const startRow = parseInt(match[2], 10);
        const endRow = parseInt(match[4], 10);
        if (startRow <= 9 && endRow <= 9) {
          ws.mergeCells(merge);
        }
      }
    });

    // ===== DATA ROWS =====
    // Group risks by category
    const categoryMap = new Map();
    projectRisks.forEach(r => {
      if (!categoryMap.has(r.riskCategory)) categoryMap.set(r.riskCategory, []);
      categoryMap.get(r.riskCategory).push(r);
    });

    // Load templates for styling
    const templateCatStyleRow = srcSheet.getRow(10); // Category style
    const templateDataStyleRow = srcSheet.getRow(12); // Data style

    let currentRow = 10; // Data starts at row 10 (overwriting the template's empty placeholder)
    let catNo = 1;

    for (const [category, catRisks] of categoryMap) {
      // Category Header Row
      const catRow = ws.getRow(currentRow);
      catRow.height = templateCatStyleRow.height;

      for (let c = 1; c <= 26; c++) {
        const destCell = catRow.getCell(c);
        destCell.style = templateCatStyleRow.getCell(c).style;
      }

      ws.getCell(currentRow, 1).value = catNo;
      ws.getCell(currentRow, 2).value = category;

      ws.mergeCells(currentRow, 2, currentRow, 6);   // Merge B:F
      ws.mergeCells(currentRow, 11, currentRow, 16); // Merge K:P

      currentRow++;
      catNo++;

      // Risk Data Rows
      for (const risk of catRisks) {
        const dataRow = ws.getRow(currentRow);
        dataRow.height = templateDataStyleRow.height || 40;

        for (let c = 1; c <= 26; c++) {
          const destCell = dataRow.getCell(c);
          destCell.style = templateDataStyleRow.getCell(c).style;
        }

        const fields = [
          [1, risk.riskId || ''],
          [2, risk.description || ''],
          [7, formatPossibleEffect(risk.possibleEffect).replace(/HSE/g, 'H')],
          [8, risk.initialRisk?.likelihood ?? 1],
          [9, risk.initialRisk?.impact ?? 1],
          [10, risk.mitigationStrategy || ''],
          [11, risk.actionToControl || ''],
          [17, risk.residualRisk?.likelihood ?? ''],
          [18, risk.residualRisk?.impact ?? ''],
          [19, risk.costToMitigate || ''], // CTM
          [20, risk.probabilityOfSuccess || ''], // POS
          [21, risk.owner || ''],
          [22, formatDate(risk.raisedDate)],
          [23, formatDate(risk.deadlineDate)],
          [24, formatDate(risk.finishedDate)],
          [25, risk.status || 'Open'],
          [26, risk.comment || ''],
        ];

        for (const [col, val] of fields) {
          ws.getCell(currentRow, col).value = val;
        }

        ws.mergeCells(currentRow, 2, currentRow, 6);   // Merge B:F
        ws.mergeCells(currentRow, 11, currentRow, 16); // Merge K:P

        currentRow++;
      }
    }

    // Add a couple of empty spacer rows
    currentRow += 2;

    // 5. Copy Row 57 to 92 (Legend / Reference tables)
    const legendStartSrcRow = 57;
    const legendEndSrcRow = 92;
    const offset = currentRow - legendStartSrcRow;

    for (let r = legendStartSrcRow; r <= legendEndSrcRow; r++) {
      const srcRow = srcSheet.getRow(r);
      const destRow = ws.getRow(currentRow);
      destRow.height = srcRow.height;

      for (let c = 1; c <= 26; c++) {
        const srcCell = srcRow.getCell(c);
        const destCell = destRow.getCell(c);
        destCell.value = srcCell.value;
        destCell.style = srcCell.style;
      }
      currentRow++;
    }

    // Copy Legend Merges with offset
    srcSheet.model.merges.forEach(merge => {
      const match = merge.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
      if (match) {
        const startRow = parseInt(match[2], 10);
        const endRow = parseInt(match[4], 10);
        if (startRow >= 57 && endRow <= 92) {
          const startCol = match[1];
          const endCol = match[3];
          const newMerge = `${startCol}${startRow + offset}:${endCol}${endRow + offset}`;
          ws.mergeCells(newMerge);
        }
      }
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

// ===== HTTP Server =====
const server = http.createServer(async (req, res) => {
  // CORS headers for browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.url === '/export-excel' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { risks, projectNo } = JSON.parse(body);
        console.log(`[export-server] Generating for projectNo="${projectNo}", ${risks.length} risks...`);
        const buffer = await generateExcel(risks, projectNo || 'All');
        const filename = projectNo && projectNo !== 'All'
          ? `RiskRegister_${projectNo}.xlsx`
          : 'RiskRegister_AllProjects.xlsx';

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('Content-Length', buffer.length);
        res.end(buffer);
        console.log(`[export-server] Done: ${filename} (${buffer.length} bytes)`);
      } catch (e) {
        console.error('[export-server] Error:', e.message);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (req.url === '/health') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok', port: PORT }));
    return;
  }

  res.statusCode = 404;
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`[export-server] Running at http://localhost:${PORT}`);
  console.log(`[export-server] Template: ${TEMPLATE_PATH}`);
});
