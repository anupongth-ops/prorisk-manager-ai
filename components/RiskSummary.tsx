
import React, { useMemo } from 'react';
import { RiskItem, getRiskLevel, getRiskWeight, getRiskLevelColor } from '../types';
import { X, FileText, Download } from 'lucide-react';

interface RiskSummaryProps {
  risks: RiskItem[];
  onClose: () => void;
  filterName: string;
}

export const RiskSummary: React.FC<RiskSummaryProps> = ({ risks, onClose, filterName }) => {

  const sortedRisks = useMemo(() => {
    return [...risks].sort((a, b) => {
      const levelA = getRiskLevel(a.residualRisk.impact, a.residualRisk.likelihood);
      const levelB = getRiskLevel(b.residualRisk.impact, b.residualRisk.likelihood);

      const weightA = getRiskWeight(levelA);
      const weightB = getRiskWeight(levelB);

      if (weightA !== weightB) {
        return weightB - weightA; // Descending order (Extreme first)
      }

      // Secondary sort: Score (Impact * Likelihood)
      const scoreA = a.residualRisk.impact * a.residualRisk.likelihood;
      const scoreB = b.residualRisk.impact * b.residualRisk.likelihood;

      return scoreB - scoreA;
    });
  }, [risks]);

  const exportTopRisksToCSV = () => {
    // 1. Group by Category
    const categoryMap = new Map<string, RiskItem[]>();

    risks.forEach(risk => {
      const cat = risk.riskCategory || 'Uncategorized';
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat)?.push(risk);
    });

    const exportRows: RiskItem[] = [];

    // 2. Sort each category and take Top 3
    categoryMap.forEach((categoryRisks) => {
      // Sort by severity (High -> Low)
      categoryRisks.sort((a, b) => {
        const levelA = getRiskLevel(a.residualRisk.impact, a.residualRisk.likelihood);
        const levelB = getRiskLevel(b.residualRisk.impact, b.residualRisk.likelihood);
        const weightA = getRiskWeight(levelA);
        const weightB = getRiskWeight(levelB);

        if (weightA !== weightB) return weightB - weightA;
        return (b.residualRisk.impact * b.residualRisk.likelihood) - (a.residualRisk.impact * a.residualRisk.likelihood);
      });

      // Take top 3
      exportRows.push(...categoryRisks.slice(0, 3));
    });

    // Sort the final list by Category for readability in CSV
    exportRows.sort((a, b) => (a.riskCategory || '').localeCompare(b.riskCategory || ''));

    // 3. Construct CSV
    const csvHeaders = [
      "Risk ID",
      "Project No",
      "Category",
      "Risk Level",
      "Description",
      "Owner",
      "Status",
      "Mitigation Plan"
    ];

    const csvString = [
      csvHeaders.join(','),
      ...exportRows.map(r => {
        const level = getRiskLevel(r.residualRisk.impact, r.residualRisk.likelihood);
        // Escape quotes for CSV format
        const safeDesc = `"${(r.description || '').replace(/"/g, '""')}"`;
        const safePlan = `"${(r.actionToControl || '').replace(/"/g, '""')}"`;
        const safeCat = `"${(r.riskCategory || '')}"`;

        return [
          r.riskId,
          r.projectNo,
          safeCat,
          level,
          safeDesc,
          r.owner,
          r.status,
          safePlan
        ].join(',');
      })
    ].join('\n');

    // 4. Trigger Download (Add BOM \uFEFF for Excel UTF-8)
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Top_Risks_Summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-white/10 dark:border-slate-800 transition-all">

        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg text-blue-600 dark:text-blue-400 transition-colors">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Risk Summary Report</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Sorted by Residual Risk Level (Highest to Lowest) • {filterName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportTopRisksToCSV}
              className="flex items-center gap-2 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
              title="Export top 3 highest risks from each category to CSV"
            >
              <Download className="w-4 h-4" />
              Export Top 3/Cat. (CSV)
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-slate-400 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-auto p-6 bg-white dark:bg-slate-900 transition-colors">
          {sortedRisks.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-slate-500">
              No risks found to display in this report.
            </div>
          ) : (
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-100 dark:border-slate-800 transition-colors">
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-24">Risk ID</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-32">Level</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-32">Category</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-40">Owner</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-24 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 transition-colors">
                {sortedRisks.map((risk) => {
                  const level = getRiskLevel(risk.residualRisk.impact, risk.residualRisk.likelihood);
                  const colorClass = getRiskLevelColor(level);

                  return (
                    <tr key={risk.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-slate-100">{risk.riskId}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${colorClass} whitespace-nowrap shadow-sm transition-all`}>
                          {level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-slate-400">{risk.riskCategory}</td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-slate-300">
                        <div className="line-clamp-2" title={risk.description}>{risk.description}</div>
                        {risk.actionToControl && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-slate-500 flex items-start gap-1">
                            <span className="font-semibold">Mitigation:</span>
                            <span className="line-clamp-1">{risk.actionToControl}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-slate-400">{risk.owner}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${risk.status === 'Open' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30' :
                          risk.status === 'In Progress' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/30' :
                            'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30'
                          }`}>
                          {risk.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-800 text-center text-xs text-gray-500 dark:text-slate-500 transition-colors">
          Generated automatically by ProRisk Manager AI
        </div>
      </div>
    </div>
  );
};
