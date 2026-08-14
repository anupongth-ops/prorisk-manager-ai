
import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, Loader2, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { RiskItem } from '../types';

const handleClientSideExport = (targetRisks: RiskItem[], filter: string) => {
  const exportData = targetRisks.map(r => ({
    'Risk ID': r.riskId,
    'Project No.': r.projectNo,
    'Project Name': r.projectName,
    'PM Name': r.pmName,
    'Risk Category': r.riskCategory,
    'Risk Description': r.description,
    'Possible Effects': Array.isArray(r.possibleEffect) ? r.possibleEffect.join(', ') : (r.possibleEffect || ''),
    'Initial Impact (1-5)': r.initialRisk.impact,
    'Initial Likelihood (1-5)': r.initialRisk.likelihood,
    'Initial Risk Score': r.initialRisk.impact * r.initialRisk.likelihood,
    'Strategy': r.mitigationStrategy,
    'Action Plan': r.actionToControl,
    'Owner': r.owner,
    'Target Date': r.deadlineDate,
    'Residual Impact (1-5)': r.residualRisk.impact,
    'Residual Likelihood (1-5)': r.residualRisk.likelihood,
    'Residual Risk Score': r.residualRisk.impact * r.residualRisk.likelihood,
    'Status': r.status,
    'Review Frequency': r.reviewFrequency || 'Monthly',
    'Next Review Date': r.nextReviewDate || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Risk Register');

  const filename = filter !== 'All'
    ? `RiskRegister_${filter}.xlsx`
    : 'RiskRegister_AllProjects.xlsx';

  XLSX.writeFile(workbook, filename);
};

interface RiskExportModalProps {
  risks: RiskItem[];
  projectFilter: string;
  onClose: () => void;
}

export const RiskExportModal: React.FC<RiskExportModalProps> = ({ risks, projectFilter, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get unique projects from risks
  const uniqueProjects = React.useMemo(() => {
    const map = new Map<string, { projectNo: string; projectName: string; pmName: string }>();
    risks.forEach(r => {
      if (!map.has(r.projectNo)) {
        map.set(r.projectNo, { projectNo: r.projectNo, projectName: r.projectName, pmName: r.pmName });
      }
    });
    return Array.from(map.values());
  }, [risks]);


  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const payload = {
        risks: risks,
        projectNo: projectFilter
      };

      const isProd = Boolean((import.meta as any).env?.PROD);
      const apiUrl = isProd ? 'https://aeng.info/export-excel' : '/api/export-excel';

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const filename = projectFilter !== 'All'
            ? `RiskRegister_${projectFilter}.xlsx`
            : 'RiskRegister_AllProjects.xlsx';
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          onClose();
          return;
        }
      } catch (netErr) {
        console.warn('Server export API unavailable, using client-side XLSX fallback', netErr);
      }

      // Fallback to client-side XLSX generation
      handleClientSideExport(risks, projectFilter);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Unknown error during export');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">Export Risk Register</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">ส่งออกข้อมูลในรูปแบบ Excel ต้นแบบ EPM-03-014AT1</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">📋 โครงสร้างไฟล์ Excel</p>
            <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-400">
              <li>✅ รูปแบบ สี ฟอนต์ และขนาดเหมือนเอกสารต้นแบบทุกประการ</li>
              <li>✅ Header: Project Name, Document No., Rev., Date, PM</li>
              <li>✅ ข้อมูลความเสี่ยงจัดกลุ่มตาม Risk Category</li>
              <li>✅ คอลัมน์: Risk ID | Description | Effect | Probability | Severity | Strategy | Action | Owner | Dates | Status</li>
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">Export ไม่สำเร็จ</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p>
                <p className="text-xs text-red-500 dark:text-red-500 mt-1">กรุณาตรวจสอบว่ารัน npm run dev อยู่ หรือติดต่อ Admin</p>
              </div>
            </div>
          )}

          {/* Scope summary */}
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-3">ขอบเขตการ Export</p>
            {projectFilter !== 'All' ? (
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold">{projectFilter}</span>
                <span className="text-sm text-gray-600 dark:text-slate-300">
                  {risks.filter(r => r.projectNo === projectFilter).length} รายการความเสี่ยง
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  ทั้งหมด <span className="font-bold text-gray-900 dark:text-slate-100">{uniqueProjects.length}</span> โปรเจกต์,{' '}
                  <span className="font-bold text-gray-900 dark:text-slate-100">{risks.length}</span> รายการความเสี่ยง
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {uniqueProjects.slice(0, 8).map(p => (
                    <span key={p.projectNo} className="px-2 py-0.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded text-xs font-medium">
                      {p.projectNo}
                    </span>
                  ))}
                  {uniqueProjects.length > 8 && (
                    <span className="px-2 py-0.5 bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded text-xs">
                      +{uniqueProjects.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || risks.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-green-300 dark:disabled:bg-green-900/30 text-white text-sm font-bold transition-colors shadow-md shadow-green-200 dark:shadow-none"
          >
            {isExporting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> กำลัง Generate...</>
            ) : (
              <><Download className="w-4 h-4" /> Export Excel (.xlsx)</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
