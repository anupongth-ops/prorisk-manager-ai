import React from 'react';
import Papa from 'papaparse';
import { Filter, Edit2, TrendingDown, X, Search, Download, FileSpreadsheet } from 'lucide-react';

interface DashboardControlsProps {
    projectFilter: string;
    setProjectFilter: (val: string) => void;
    uniqueProjectNos: string[];
    uniqueProjectData: any[];
    setEditingProject: (proj: any) => void;
    setShowProjectForm: (show: boolean) => void;
    showBenchmark: boolean;
    setShowBenchmark: (show: boolean) => void;
    matrixFilter: { impact: number; likelihood: number; mode: 'initial' | 'residual' } | null;
    setMatrixFilter: (filter: any) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filteredRisks: any[];
    onSwitchToExcelGrid?: () => void;
}

export function DashboardControls({
    projectFilter,
    setProjectFilter,
    uniqueProjectNos,
    uniqueProjectData,
    setEditingProject,
    setShowProjectForm,
    showBenchmark,
    setShowBenchmark,
    matrixFilter,
    setMatrixFilter,
    searchQuery,
    setSearchQuery,
    filteredRisks,
    onSwitchToExcelGrid
}: DashboardControlsProps) {

    const handleExport = () => {
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
            "Initial Risk Score (1-25)",
            "Possible Effect (C/T/Q/HSE)",
            "Strategy (A/T/M/AC)",
            "Action Plan",
            "Residual Impact (1-5)",
            "Residual Likelihood (1-5)",
            "Residual Risk Score (1-25)",
            "Owner",
            "Raised Date (DD-MMM-YYYY)",
            "Deadline Date (DD-MMM-YYYY)",
            "Finished Date (DD-MMM-YYYY)",
            "Next Review Date (DD-MMM-YYYY)",
            "Status (Open/In Progress/Closed)",
            "Comment"
        ];

        const formatExportDate = (dateStr: string) => {
            if (!dateStr) return '';
            const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (match) {
                const year = match[1];
                const monthNum = parseInt(match[2], 10);
                const day = match[3];
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return `${day}-${monthNames[monthNum - 1]}-${year}`;
            }
            return dateStr;
        };

        const data = filteredRisks.map(risk => [
            risk.projectNo || '',
            risk.projectName || '',
            risk.pmName || '',
            risk.email || '',
            risk.riskId || '',
            risk.riskCategory || '',
            risk.description || '',
            risk.initialRisk?.impact || 1,
            risk.initialRisk?.likelihood || 1,
            (risk.initialRisk?.impact || 1) * (risk.initialRisk?.likelihood || 1),
            Array.isArray(risk.possibleEffect) ? risk.possibleEffect.join('+') : (risk.possibleEffect || ''),
            risk.mitigationStrategy || '',
            risk.actionToControl || '',
            risk.residualRisk?.impact || 1,
            risk.residualRisk?.likelihood || 1,
            (risk.residualRisk?.impact || 1) * (risk.residualRisk?.likelihood || 1),
            risk.owner || '',
            formatExportDate(risk.raisedDate),
            formatExportDate(risk.deadlineDate),
            formatExportDate(risk.finishedDate),
            formatExportDate(risk.nextReviewDate),
            risk.status || 'Open',
            risk.comment || ''
        ]);

        const csvContent = Papa.unparse({ fields: headers, data: data });
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", projectFilter !== 'All' ? `risks_${projectFilter}.csv` : 'risks_all_projects.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col gap-3 mb-6">
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
                    <div className="px-3 py-2 border-r border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400">
                        <Filter className="w-4 h-4" />
                    </div>
                    <select
                        className="px-2 py-1 bg-transparent text-sm font-medium text-gray-700 dark:text-slate-200 outline-none cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                    >
                        <option value="All" className="dark:bg-slate-900">All Projects</option>
                        {uniqueProjectNos.map(p => <option key={p} value={p} className="dark:bg-slate-900">{p}</option>)}
                    </select>

                    {projectFilter !== 'All' && (
                        <button
                            onClick={() => {
                                const proj = uniqueProjectData.find(p => p.projectNo === projectFilter);
                                if (proj) {
                                    setEditingProject(proj);
                                    setShowProjectForm(true);
                                }
                            }}
                            className="ml-1 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors border-l border-gray-100 dark:border-slate-700"
                            title="Edit Project Details"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {projectFilter !== 'All' && (
                    <button
                        onClick={() => setShowBenchmark(!showBenchmark)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border ${showBenchmark
                            ? 'bg-blue-600 border-blue-600 text-white shadow-blue-100'
                            : 'bg-white border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-600'
                            }`}
                    >
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{showBenchmark ? 'Close Benchmark' : 'Industry Benchmark'}</span>
                        <span className="sm:hidden">{showBenchmark ? 'Close' : 'Benchmark'}</span>
                    </button>
                )}

                {matrixFilter && (
                    <button
                        onClick={() => setMatrixFilter(null)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all shadow-sm animate-in fade-in zoom-in duration-200"
                    >
                        <X className="w-3 h-3" />
                        <span className="hidden sm:inline">Clear Matrix: {matrixFilter.mode === 'initial' ? 'Initial' : 'Residual'} ({matrixFilter.impact}x{matrixFilter.likelihood})</span>
                        <span className="sm:hidden">Clear</span>
                    </button>
                )}

                <button
                    onClick={handleExport}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all shadow-sm"
                    title="Export Filtered Risks to CSV"
                >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                </button>

                {onSwitchToExcelGrid && (
                    <button
                        onClick={onSwitchToExcelGrid}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 border border-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm"
                        title="Open Excel Grid Data Input (EPM-03-014AT1)"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Excel Grid Input
                    </button>
                )}
            </div>

            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search risks..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-slate-200 outline-none shadow-sm transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
    );
}
