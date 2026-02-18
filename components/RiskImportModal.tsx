
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
  const [logs, setLogs] = useState<string[]>([]);
  const [summary, setSummary] = useState<{ success: number; skipped: number; failed: number } | null>(null);

  // 1. Generate Blank CSV Template
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
      "Possible Effect (C/T/Q/HSE)",
      "Strategy (A/T/M/AC)",
      "Action Plan",
      "Residual Impact (1-5)",
      "Residual Likelihood (1-5)",
      "Owner",
      "Raised Date (DD-MMM-YYYY)",
      "Deadline Date (DD-MMM-YYYY)",
      "Finished Date (DD-MMM-YYYY)",
      "Status (Open/In Progress/Closed)",
      "Comment"
    ];

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "blank_risk_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        const newRisks: RiskItem[] = [];
        const projectCache = new Map<string, Set<string>>(); // Cache existing Risk IDs per project

        let successCount = 0;
        let skippedCount = 0;
        let failCount = 0;
        const tempLogs: string[] = [];

        try {
          // Group rows by project first to minimize DB calls
          const uniqueProjects = Array.from(new Set(rows.map(r => r['Project No']?.trim()).filter(Boolean)));

          // Pre-fetch existing Risk IDs for all involved projects
          for (const proj of uniqueProjects) {
            tempLogs.push(`Checking existing risks for Project: ${proj}...`);
            const existingRisks = await fetchRisksByProject(proj);
            const existingIds = new Set(existingRisks.map(r => r.riskId.toUpperCase())); // Normalize case
            projectCache.set(proj, existingIds);
          }

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2; // Accounting for header

            // Basic Validation
            if (!row['Project No'] || !row['Risk ID'] || !row['Description']) {
              tempLogs.push(`Row ${rowNum}: Missing mandatory fields (Project No, Risk ID, or Description). Skipped.`);
              failCount++;
              continue;
            }

            const projectNo = row['Project No'].trim();
            const riskId = row['Risk ID'].trim();
            const description = row['Description'];

            // DUPLICATE CHECK RULE
            const existingIds = projectCache.get(projectNo);
            if (existingIds && existingIds.has(riskId.toUpperCase())) {
              tempLogs.push(`Row ${rowNum}: Risk ID "${riskId}" already exists in Project "${projectNo}". Preserving Database version. Skipped.`);
              skippedCount++;
              continue;
            }

            // Add to new list
            try {
              const riskItem: RiskItem = {
                id: crypto.randomUUID(),
                riskId: riskId,
                projectNo: projectNo,
                projectName: row['Project Name'] || '',
                pmName: row['PM Name'] || '',
                email: row['Email'] || '',
                riskCategory: validateCategory(row['Risk Category']),
                description: description,
                initialRisk: {
                  impact: parseLevel(row['Initial Impact (1-5)']),
                  likelihood: parseLevel(row['Initial Likelihood (1-5)'])
                },
                possibleEffect: parseEffect(row['Possible Effect (C/T/Q/HSE)']),
                mitigationStrategy: parseStrategy(row['Strategy (A/T/M/AC)']),
                actionToControl: row['Action Plan'] || '',
                residualRisk: {
                  impact: parseLevel(row['Residual Impact (1-5)']),
                  likelihood: parseLevel(row['Residual Likelihood (1-5)'])
                },
                owner: row['Owner'] || '',
                raisedDate: parseDate(row['Raised Date (DD-MMM-YYYY)']) || new Date().toISOString().split('T')[0],
                deadlineDate: parseDate(row['Deadline Date (DD-MMM-YYYY)']) || '',
                finishedDate: parseDate(row['Finished Date (DD-MMM-YYYY)']) || '',
                status: parseStatus(row['Status (Open/In Progress/Closed)']),
                comment: row['Comment'] || '',
                updatedAt: new Date().toISOString(),
                history: [] // New import has no history
              };

              newRisks.push(riskItem);
              // Temporarily add to cache so we don't duplicate within the same CSV
              existingIds?.add(riskId.toUpperCase());
              successCount++;

            } catch (e) {
              tempLogs.push(`Row ${rowNum}: Data format error. Skipped.`);
              failCount++;
            }
          }

          // Batch Upload
          if (newRisks.length > 0) {
            tempLogs.push(`Uploading ${newRisks.length} valid records to Firebase...`);
            await batchSaveRisks(newRisks);
            tempLogs.push("Upload complete.");
          } else {
            tempLogs.push("No new valid records found to upload.");
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
  const parseLevel = (val: any): any => {
    const num = parseInt(val);
    return (num >= 1 && num <= 5) ? num : 1;
  };

  const validateCategory = (val: string): string => {
    if (RISK_CATEGORIES.includes(val)) return val;
    return RISK_CATEGORIES[0];
  };

  const parseEffect = (val: string): PossibleEffect => {
    const v = val?.trim().toUpperCase();
    if (v === 'C' || v === 'COST') return PossibleEffect.Cost;
    if (v === 'T' || v === 'TIME') return PossibleEffect.Time;
    if (v === 'Q' || v === 'QUALITY') return PossibleEffect.Quality;
    return PossibleEffect.HSE;
  };

  const parseStrategy = (val: string): MitigationStrategy => {
    const v = val?.trim().toUpperCase();
    if (v === 'A') return MitigationStrategy.Avoid;
    if (v === 'T') return MitigationStrategy.Transfer;
    if (v === 'AC') return MitigationStrategy.Accept;
    return MitigationStrategy.Mitigate;
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

  const parseDate = (val: string): string => {
    if (!val) return '';
    const v = val.trim();

    // 1. Try DD-MMM-YYYY (e.g., 04-Jun-2023 or 4-JUN-2023)
    // Regex looks for 1-2 digits, then hyphen/slash, then 3 letters, then hyphen/slash, then 4 digits
    const ddmmmyyyy = /^(\d{1,2})[-/]([a-zA-Z]{3})[-/](\d{4})$/;
    const matchMMM = v.match(ddmmmyyyy);
    if (matchMMM) {
      const day = matchMMM[1].padStart(2, '0');
      const mStr = matchMMM[2].toUpperCase();
      const year = matchMMM[3];
      const month = MONTH_MAP[mStr];

      if (month) {
        return `${year}-${month}-${day}`;
      }
    }

    // 2. Try standard DD-MM-YYYY just in case
    const ddmmyyyy = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/;
    const match = v.match(ddmmyyyy);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      return `${year}-${month}-${day}`; // Return ISO for storage
    }

    // 3. Fallback: try valid ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

    return '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 flex justify-between items-center transition-colors">
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

          {/* Step 2: Rules Info */}
          <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-100 dark:border-amber-900/30 transition-colors">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">Duplicate Rule</h3>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  If a <strong>Risk ID</strong> already exists for a specific <strong>Project No</strong> in the database,
                  the uploaded row will be <span className="font-bold underline">skipped</span>.
                  The database version is considered the master source of truth.
                </p>
              </div>
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
