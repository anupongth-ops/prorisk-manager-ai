
import React, { useState } from 'react';
import Papa from 'papaparse';
import { X, Upload, Download, AlertTriangle, CheckCircle, FileSpreadsheet, Loader2 } from 'lucide-react';
import { RiskItem, ImpactLevel, LikelihoodLevel, PossibleEffect, MitigationStrategy, RISK_CATEGORIES } from '../types';
import { fetchRisksByProject, batchSaveRisks } from '../services/firebaseService';

interface RiskImportModalProps {
  onClose: () => void;
}

export const RiskImportModal: React.FC<RiskImportModalProps> = ({ onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [updateExisting, setUpdateExisting] = useState<boolean>(true); // Default to Update Existing so dates in CSV get synced
  const [logs, setLogs] = useState<string[]>([]);
  const [summary, setSummary] = useState<{ success: number; skipped: number; failed: number } | null>(null);

  // Helper for flexible column matching
  const getRowVal = (row: any, keySubstring: string) => {
    if (!row) return undefined;
    const keys = Object.keys(row);
    const matchingKey = keys.find(k => k.toLowerCase().trim().includes(keySubstring.toLowerCase().trim()));
    return matchingKey ? row[matchingKey] : undefined;
  };

  // 1. Generate Blank CSV Template with UTF-8 BOM for Excel
  const handleDownloadTemplate = () => {
    const headers = [
      "Project No",
      "Project Name",
      "PM Name",
      "Email",
      "Risk ID",
      "Risk Category",
      "Description",
      "Initial Impact (1-5)",
      "Initial Likelihood (1-5)",
      "Possible Effect (C/T/Q/HS/E/R e.g. C+T+HS)",
      "Strategy (A/T/M/AC)",
      "Action Plan",
      "Cost to Mitigate (H/M/L)",
      "Probability of Success (H/M/L)",
      "Residual Impact (1-5)",
      "Residual Likelihood (1-5)",
      "Owner",
      "Raised Date (DD-MMM-YYYY)",
      "Deadline Date (DD-MMM-YYYY)",
      "Finished Date (DD-MMM-YYYY)",
      "Next Review Date (DD-MMM-YYYY)",
      "Status (Open/In Progress/Closed)",
      "Comment"
    ];

    const csvString = headers.join(",");
    const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "blank_risk_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setLogs([]);
      setSummary(null);
    }
  };

  // 2. Parsing and Validation Logic
  const processFile = async () => {
    if (!file) return;
    setIsProcessing(true);
    setLogs([]);
    setSummary(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        const risksToSave: RiskItem[] = [];
        const projectCache = new Map<string, Map<string, RiskItem>>(); // projectNo -> (riskIdUpper -> RiskItem)

        let successCount = 0;
        let updatedCount = 0;
        let newCount = 0;
        let skippedCount = 0;
        let failCount = 0;
        const tempLogs: string[] = [];

        try {
          // Group rows by project first to minimize DB calls
          const uniqueProjects = Array.from(new Set(rows.map(r => (getRowVal(r, 'Project No') || '')?.trim()).filter(Boolean)));

          // Pre-fetch existing Risk items for all involved projects
          for (const proj of uniqueProjects) {
            tempLogs.push(`Checking existing risks for Project: ${proj}...`);
            const existingRisks = await fetchRisksByProject(proj);
            const riskMap = new Map<string, RiskItem>();
            existingRisks.forEach(r => riskMap.set(r.riskId.toUpperCase(), r));
            projectCache.set(proj, riskMap);
          }

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2; // Accounting for header

            const pNo = getRowVal(row, 'Project No');
            const rId = getRowVal(row, 'Risk ID');
            const desc = getRowVal(row, 'Description');

            // Basic Validation
            if (!pNo || !rId || !desc) {
              tempLogs.push(`Row ${rowNum}: Missing mandatory fields (Project No, Risk ID, or Description). Skipped.`);
              failCount++;
              continue;
            }

            const projectNo = String(pNo).trim();
            const riskId = String(rId).trim();
            const description = String(desc);

            const existingMap = projectCache.get(projectNo);
            const existingRisk = existingMap?.get(riskId.toUpperCase());

            const raisedDateStr = parseDate(getRowVal(row, 'Raised Date'));
            const deadlineDateStr = parseDate(getRowVal(row, 'Deadline Date'));
            const finishedDateStr = parseDate(getRowVal(row, 'Finished Date'));
            const nextReviewDateStr = parseDate(getRowVal(row, 'Next Review Date'));

            try {
              if (existingRisk) {
                if (!updateExisting) {
                  // Mode: Skip Existing
                  tempLogs.push(`Row ${rowNum}: Risk ID "${riskId}" already exists in Project "${projectNo}". Preserving Database version. Skipped.`);
                  skippedCount++;
                  continue;
                }

                // Mode: Update Existing (UPSERT)
                const updatedRisk: RiskItem = {
                  ...existingRisk,
                  projectName: getRowVal(row, 'Project Name') || existingRisk.projectName,
                  pmName: getRowVal(row, 'PM Name') || existingRisk.pmName,
                  email: getRowVal(row, 'Email') || existingRisk.email,
                  riskCategory: validateCategory(getRowVal(row, 'Risk Category') || existingRisk.riskCategory),
                  description: description,
                  initialRisk: {
                    impact: parseLevel(getRowVal(row, 'Initial Impact')) || existingRisk.initialRisk.impact,
                    likelihood: parseLevel(getRowVal(row, 'Initial Likelihood')) || existingRisk.initialRisk.likelihood
                  },
                  possibleEffect: parseEffects(getRowVal(row, 'Possible Effect')),
                  mitigationStrategy: parseStrategy(getRowVal(row, 'Strategy')) || existingRisk.mitigationStrategy,
                  actionToControl: getRowVal(row, 'Action Plan') || existingRisk.actionToControl,
                  costToMitigate: parseHML(getRowVal(row, 'Cost to Mitigate')) || existingRisk.costToMitigate,
                  probabilityOfSuccess: parseHML(getRowVal(row, 'Probability of Success')) || existingRisk.probabilityOfSuccess,
                  residualRisk: {
                    impact: parseLevel(getRowVal(row, 'Residual Impact')) || existingRisk.residualRisk.impact,
                    likelihood: parseLevel(getRowVal(row, 'Residual Likelihood')) || existingRisk.residualRisk.likelihood
                  },
                  owner: getRowVal(row, 'Owner') || existingRisk.owner,
                  raisedDate: raisedDateStr || existingRisk.raisedDate,
                  deadlineDate: deadlineDateStr || existingRisk.deadlineDate,
                  finishedDate: finishedDateStr || existingRisk.finishedDate,
                  nextReviewDate: nextReviewDateStr || existingRisk.nextReviewDate,
                  status: parseStatus(getRowVal(row, 'Status')) || existingRisk.status,
                  comment: getRowVal(row, 'Comment') || existingRisk.comment,
                  updatedAt: new Date().toISOString()
                };

                risksToSave.push(updatedRisk);
                tempLogs.push(`Row ${rowNum}: Risk ID "${riskId}" in Project "${projectNo}" updated with CSV dates (Raised: ${updatedRisk.raisedDate}, Deadline: ${updatedRisk.deadlineDate || '-'}).`);
                successCount++;
                updatedCount++;
              } else {
                // Mode: Create New Item
                const newRiskItem: RiskItem = {
                  id: crypto.randomUUID(),
                  riskId: riskId,
                  projectNo: projectNo,
                  projectName: getRowVal(row, 'Project Name') || '',
                  pmName: getRowVal(row, 'PM Name') || '',
                  email: getRowVal(row, 'Email') || '',
                  riskCategory: validateCategory(getRowVal(row, 'Risk Category') || ''),
                  description: description,
                  initialRisk: {
                    impact: parseLevel(getRowVal(row, 'Initial Impact')),
                    likelihood: parseLevel(getRowVal(row, 'Initial Likelihood'))
                  },
                  possibleEffect: parseEffects(getRowVal(row, 'Possible Effect')),
                  mitigationStrategy: parseStrategy(getRowVal(row, 'Strategy')),
                  actionToControl: getRowVal(row, 'Action Plan') || '',
                  costToMitigate: parseHML(getRowVal(row, 'Cost to Mitigate')),
                  probabilityOfSuccess: parseHML(getRowVal(row, 'Probability of Success')),
                  residualRisk: {
                    impact: parseLevel(getRowVal(row, 'Residual Impact')),
                    likelihood: parseLevel(getRowVal(row, 'Residual Likelihood'))
                  },
                  owner: getRowVal(row, 'Owner') || '',
                  raisedDate: raisedDateStr || new Date().toISOString().split('T')[0],
                  deadlineDate: deadlineDateStr || '',
                  finishedDate: finishedDateStr || '',
                  nextReviewDate: nextReviewDateStr || '',
                  status: parseStatus(getRowVal(row, 'Status')),
                  comment: getRowVal(row, 'Comment') || '',
                  updatedAt: new Date().toISOString(),
                  history: []
                };

                risksToSave.push(newRiskItem);
                existingMap?.set(riskId.toUpperCase(), newRiskItem);
                tempLogs.push(`Row ${rowNum}: New Risk ID "${riskId}" added.`);
                successCount++;
                newCount++;
              }
            } catch (e) {
              tempLogs.push(`Row ${rowNum}: Data format error. Skipped.`);
              failCount++;
            }
          }

          // Batch Upload
          if (risksToSave.length > 0) {
            tempLogs.push(`Saving ${risksToSave.length} records (${updatedCount} updated, ${newCount} new) to Database...`);
            await batchSaveRisks(risksToSave);
            tempLogs.push("Import and sync complete!");
          } else {
            tempLogs.push("No valid records found to upload.");
          }

          setSummary({ success: successCount, skipped: skippedCount, failed: failCount });

        } catch (err) {
          tempLogs.push("Critical Error: " + err);
        } finally {
          setLogs(tempLogs);
          setIsProcessing(false);
        }
      }
    });
  };

  // --- Parsing Helpers ---
  const parseLevel = (val: any, defaultVal = 1): number => {
    if (val === undefined || val === null || String(val).trim() === '') return defaultVal;
    const v = String(val).trim().toUpperCase();
    if (!v) return defaultVal;

    // 1. Direct number check (e.g. "3" -> 3, 3 -> 3)
    const num = parseInt(v, 10);
    if (!isNaN(num) && num >= 1 && num <= 5) return num;

    // 2. Extract leading digit if present (e.g. "3 - Moderate", "4. Major", "2-Low", "5 (Extreme)")
    const matchDigit = v.match(/^([1-5])[\s\.\-_]/);
    if (matchDigit) {
      return parseInt(matchDigit[1], 10);
    }

    // 3. Exact matching first for labels (IMPACT_LABELS & LIKELIHOOD_LABELS)
    if (v === 'INSIGNIFICANT' || v === 'RARELY' || v === 'RARE') return 1;
    if (v === 'MINOR' || v === 'UNLIKELY') return 2;
    if (v === 'MODERATE' || v === 'OCCASIONAL' || v === 'MEDIUM' || v === 'MED') return 3;
    if (v === 'MAJOR' || v === 'LIKELY' || v === 'HIGH') return 4;
    if (v === 'SEVERE' || v === 'MOST LIKELY' || v === 'EXTREME' || v === 'VERY HIGH' || v === 'VERYHIGH' || v === 'VH') return 5;

    // 4. Substring checks in correct priority order (Compound/Longer terms first)

    // Check Level 1 compound terms
    if (
      v.includes('INSIGNIFICANT') || v.includes('NEGLIGIBLE') || v.includes('IMPROBABLE') ||
      v.includes('VERY LOW') || v.includes('VERYLOW') || v === 'VL' || v.includes('MINIMAL') ||
      v === 'ต่ำมาก' || v === 'น้อยมาก' || v === 'น้อยที่สุด'
    ) {
      return 1;
    }

    // Check Level 5 compound terms
    if (
      v.includes('MOST LIKELY') || v.includes('VERY HIGH') || v.includes('VERYHIGH') ||
      v.includes('EXTREME') || v.includes('CATASTROPHIC') || v.includes('ALMOST CERTAIN') ||
      v === 'E' || v === 'สูงมาก' || v === 'มากที่สุด'
    ) {
      return 5;
    }

    // Check Level 2 compound terms
    if (
      v.includes('UNLIKELY') || v.includes('MINOR') || v.includes('REMOTE') ||
      v.includes('SELDOM') || v.includes('SLIGHT') || v === 'L' || v === 'ต่ำ' || v === 'น้อย'
    ) {
      return 2;
    }

    // Check Level 4 compound terms
    if (
      v.includes('MAJOR') || v.includes('CRITICAL') || v.includes('SEVERE') ||
      v.includes('FREQUENT') || v.includes('LIKELY') || v.includes('HIGH') ||
      v === 'H' || v === 'สูง' || v === 'มาก'
    ) {
      return 4;
    }

    // Check Level 3 compound terms
    if (
      v.includes('MODERATE') || v.includes('MEDIUM') || v.includes('POSSIBLE') ||
      v.includes('OCCASIONAL') || v.includes('PROBABLE') || v.includes('SIGNIFICANT') ||
      v === 'M' || v === 'ปานกลาง'
    ) {
      return 3;
    }

    // Check remaining single-word "LOW" for Level 2
    if (v.includes('LOW')) {
      return 2;
    }

    return defaultVal;
  };

  const validateCategory = (val: string): string => {
    if (RISK_CATEGORIES.includes(val)) return val;
    return RISK_CATEGORIES[0];
  };

  const parseOneEffect = (v: string): PossibleEffect => {
    if (v === 'C' || v === 'COST') return PossibleEffect.Cost;
    if (v === 'T' || v === 'TIME') return PossibleEffect.Time;
    if (v === 'Q' || v === 'QUALITY') return PossibleEffect.Quality;
    if (v === 'HS' || v === 'HSE' || v === 'SAFETY' || v === 'HEALTH') return PossibleEffect.HealthSafety;
    if (v === 'E' || v === 'ENVIRONMENT' || v === 'ENV') return PossibleEffect.Environment;
    if (v === 'R' || v === 'REPUTATION' || v === 'REP') return PossibleEffect.Reputation;
    return PossibleEffect.HealthSafety;
  };

  // Parse single or multi-value effects: "C", "C+T", "C,T", "Cost+Time"
  const parseEffects = (val: string): PossibleEffect[] => {
    if (!val) return [PossibleEffect.Cost];
    const parts = val.split(/[+,;]/).map(s => s.trim().toUpperCase()).filter(Boolean);
    const mapped = parts.map(p => parseOneEffect(p));
    return mapped.length > 0 ? mapped : [PossibleEffect.Cost];
  };

  // Keep legacy single-effect parse for old CSVs
  const parseEffect = (val: string): PossibleEffect => parseOneEffect(val?.trim().toUpperCase() ?? '');

  const parseStrategy = (val: string): MitigationStrategy => {
    const v = val?.trim().toUpperCase();
    if (v === 'A') return MitigationStrategy.Avoid;
    if (v === 'T') return MitigationStrategy.Transfer;
    if (v === 'AC') return MitigationStrategy.Accept;
    return MitigationStrategy.Mitigate;
  };

  const parseHML = (val: string): 'H' | 'M' | 'L' | '' => {
    const v = val?.trim().toUpperCase();
    if (v === 'H' || v === 'HIGH') return 'H';
    if (v === 'M' || v === 'MEDIUM') return 'M';
    if (v === 'L' || v === 'LOW') return 'L';
    return '';
  };

  const parseStatus = (val: string): any => {
    const v = val?.trim().toLowerCase();
    if (v === 'closed') return 'Closed';
    if (v === 'in progress') return 'In Progress';
    return 'Open';
  };

  const MONTH_MAP: Record<string, string> = {
    'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
    'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
  };

  const parseDate = (val: any): string => {
    if (val === undefined || val === null || val === '') return '';
    const v = String(val).trim();
    if (!v || v === '#' || v === 'N/A' || v.startsWith('#')) return '';

    // 1. Try Excel numeric serial date (e.g., 45967 -> 2025-11-06)
    if (/^\d{5}(\.\d+)?$/.test(v)) {
      const serial = parseFloat(v);
      const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }

    // 2. Try YYYY-MM-DD (e.g. 2025-11-06)
    const matchYMD = v.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (matchYMD) {
      const year = matchYMD[1];
      const month = matchYMD[2].padStart(2, '0');
      const day = matchYMD[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // 3. Try D-MMM-YY or DD-MMM-YYYY or D/MMM/YY (e.g., 6-Nov-25, 25-May-2026, 3-Apr-26)
    const matchMMM = v.match(/^(\d{1,2})[-/]([a-zA-Z]{3})[-/](\d{2,4})$/);
    if (matchMMM) {
      const day = matchMMM[1].padStart(2, '0');
      const mStr = matchMMM[2].toUpperCase();
      let yearStr = matchMMM[3];
      if (yearStr.length === 2) {
        yearStr = String(2000 + parseInt(yearStr, 10));
      }
      const month = MONTH_MAP[mStr];
      if (month) {
        return `${yearStr}-${month}-${day}`;
      }
    }

    // 4. Try DD-MM-YYYY or DD-MM-YY or DD/MM/YYYY or DD/MM/YY (e.g., 06/11/2025 or 6/11/25)
    const matchDMY = v.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (matchDMY) {
      const day = matchDMY[1].padStart(2, '0');
      const month = matchDMY[2].padStart(2, '0');
      let yearStr = matchDMY[3];
      if (yearStr.length === 2) {
        yearStr = String(2000 + parseInt(yearStr, 10));
      }
      return `${yearStr}-${month}-${day}`;
    }

    // 5. Fallback: try JS Date parse
    const parsed = new Date(v);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }

    return '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] border border-white/10 dark:border-slate-800 transition-all">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 transition-colors">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="text-green-600 dark:text-green-500" />
              Import Risks from CSV
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Upload bulk data from Google Sheets or Excel.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">

          {/* Step 1: Template */}
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300">1. Get the Template</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400">Download the blank CSV form to fill out your data.</p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 shadow-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Blank Form
              </button>
            </div>
            {/* ISO 31000 Description Hint */}
            <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-900/40">
              <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 mb-1">📌 ISO 31000 — แนวทางการกรอกช่อง Description:</p>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-mono bg-blue-100/60 dark:bg-blue-900/30 px-2 py-1 rounded">
                Due to [<span className="font-bold">cause</span>], there is a risk of [<span className="font-bold">event</span>], resulting in [<span className="font-bold">effect</span>].
              </p>
              <p className="text-[10px] text-blue-500 dark:text-blue-500 mt-1 italic">เช่น: Due to late material delivery, there is a risk of construction delay, resulting in cost overrun.</p>
            </div>
          </div>

          {/* Step 2: Rules Info & Duplicate Mode Selection */}
          <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-100 dark:border-amber-900/30 transition-colors space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">2. Duplicate Risk ID Handling Mode</h3>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  เมื่อพบ <strong>Risk ID</strong> ที่มีอยู่แล้วใน <strong>Project No</strong> เดียวกันบนฐานข้อมูล:
                </p>
              </div>
            </div>

            <div className="pl-8 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-amber-900 dark:text-amber-200">
                <input
                  type="radio"
                  name="importMode"
                  checked={updateExisting}
                  onChange={() => setUpdateExisting(true)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                />
                <span className="font-bold text-blue-700 dark:text-blue-400">อัปเดตข้อมูลรายการเดิม (Update Existing)</span>
                <span className="text-gray-500 dark:text-slate-400 font-normal">— เขียนทับวันที่, สถานะ, ข้อความ จากไฟล์ CSV ลงรายการเดิม</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-amber-900 dark:text-amber-200">
                <input
                  type="radio"
                  name="importMode"
                  checked={!updateExisting}
                  onChange={() => setUpdateExisting(false)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                />
                <span className="font-bold text-amber-800 dark:text-amber-300">ข้ามรายการเดิม (Skip Existing)</span>
                <span className="text-gray-500 dark:text-slate-400 font-normal">— ข้ามรายการที่มีอยู่แล้ว คงข้อมูลเดิมในฐานข้อมูลไว้</span>
              </label>
            </div>
          </div>

          {/* Step 3: Upload */}
          <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-8 text-center hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-all relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center">
              <Upload className={`w-10 h-10 mb-3 ${file ? 'text-blue-500' : 'text-gray-400 dark:text-slate-600'}`} />
              {file ? (
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{file.name}</span>
              ) : (
                <>
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Click to upload CSV</span>
                  <span className="text-xs text-gray-400 dark:text-slate-500 mt-1">or drag and drop file here</span>
                </>
              )}
            </div>
          </div>

          {/* Step 4: Logs & Results */}
          {(isProcessing || logs.length > 0) && (
            <div className="bg-gray-900 dark:bg-black rounded-lg p-4 text-xs font-mono h-40 overflow-y-auto border border-gray-800">
              {logs.map((log, i) => (
                <div key={i} className={`${log.includes('Skipped') ? 'text-amber-400' : log.includes('Error') ? 'text-red-400' : 'text-green-400'} mb-1`}>
                  &gt; {log}
                </div>
              ))}
              {isProcessing && <div className="text-white animate-pulse">&gt; Processing...</div>}
            </div>
          )}

          {summary && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 dark:bg-green-900/10 p-2 rounded border border-green-100 dark:border-green-800/30 transition-colors">
                <div className="text-xl font-bold text-green-700 dark:text-green-400">{summary.success}</div>
                <div className="text-xs text-green-600 dark:text-green-500/80">Imported</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/10 p-2 rounded border border-amber-100 dark:border-amber-800/30 transition-colors">
                <div className="text-xl font-bold text-amber-700 dark:text-amber-400">{summary.skipped}</div>
                <div className="text-xs text-amber-600 dark:text-amber-500/80">Skipped (Duplicate)</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-100 dark:border-red-800/30 transition-colors">
                <div className="text-xl font-bold text-red-700 dark:text-red-400">{summary.failed}</div>
                <div className="text-xs text-red-600 dark:text-red-500/80">Failed</div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 rounded-b-xl flex justify-end gap-3 transition-colors">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
            disabled={isProcessing}
          >
            Close
          </button>
          <button
            onClick={processFile}
            disabled={!file || isProcessing}
            className="px-6 py-2 text-sm bg-blue-600 dark:bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 transition-all"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Start Import
          </button>
        </div>

      </div>
    </div>
  );
};
