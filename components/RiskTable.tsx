import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown, Lock, History, Edit2, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { RiskItem, getRiskLevel, getRiskLevelColor } from '../types';

interface RiskTableProps {
    filteredRisks: RiskItem[];
    sortConfig: { key: string; direction: 'asc' | 'desc' };
    handleSort: (key: string) => void;
    canModifyProject: (projectNo: string) => boolean;
    setViewHistoryRisk: (risk: RiskItem) => void;
    setEditingRisk: (risk: RiskItem) => void;
    setShowForm: (show: boolean) => void;
    setPrefilledProject: (proj: any) => void;
    handleDelete: (risk: RiskItem) => void;
}

export function RiskTable({
    filteredRisks,
    sortConfig,
    handleSort,
    canModifyProject,
    setViewHistoryRisk,
    setEditingRisk,
    setShowForm,
    setPrefilledProject,
    handleDelete
}: RiskTableProps) {

    const getRiskBadge = (impact: number, likelihood: number) => {
        const level = getRiskLevel(impact, likelihood);
        const colorClass = getRiskLevelColor(level);
        return (
            <div className="flex flex-col items-center">
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${colorClass} whitespace-nowrap`}>{level}</span>
                <span className="text-[10px] text-gray-400 mt-0.5">I:{impact} / L:{likelihood}</span>
            </div>
        );
    };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Reset to page 1 if the underlying data or sort changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filteredRisks, sortConfig]);

    const totalPages = Math.ceil(filteredRisks.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentRisks = filteredRisks.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden transition-colors">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                    <thead className="bg-gray-50 dark:bg-slate-800/50">
                        <tr>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition select-none group"
                                onClick={() => handleSort('riskId')}
                            >
                                <div className="flex items-center gap-1">
                                    Risk ID
                                    {sortConfig.key === 'riskId' ? (
                                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />
                                    ) : (
                                        <ArrowUpDown className="w-3 h-3 text-gray-300 group-hover:text-gray-400" />
                                    )}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Project</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider w-1/3">Description</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Initial</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Residual</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800 transition-colors">
                        {filteredRisks.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-slate-500">
                                    No risks found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            currentRisks.map(risk => {
                                const canModify = canModifyProject(risk.projectNo);
                                return (
                                    <tr key={risk.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors group/row border-b border-gray-100 dark:border-slate-800/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-100">{risk.riskId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                {risk.projectNo}
                                                {!canModify && <Lock className="w-2.5 h-2.5 text-gray-300 dark:text-slate-600" title="Read Only Access" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300 max-w-xs truncate" title={risk.description}>{risk.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {getRiskBadge(risk.initialRisk.impact, risk.initialRisk.likelihood)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {getRiskBadge(risk.residualRisk.impact, risk.residualRisk.likelihood)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${risk.status === 'Open' ? 'bg-red-100 text-red-800' :
                                                risk.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                {risk.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => setViewHistoryRisk(risk)} className="text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1" title="History"><History className="w-4 h-4" /></button>

                                                <button
                                                    onClick={() => { setEditingRisk(risk); setShowForm(true); setPrefilledProject(null); }}
                                                    className={`p-1 transition-colors ${canModify ? 'text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400' : 'text-gray-200 dark:text-slate-800 cursor-not-allowed'}`}
                                                    disabled={!canModify}
                                                    title={canModify ? "Edit Risk" : "Read Only"}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(risk)}
                                                    className={`p-1 transition-colors ${canModify ? 'text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400' : 'text-gray-200 dark:text-slate-800 cursor-not-allowed'}`}
                                                    disabled={!canModify}
                                                    title={canModify ? "Delete Risk" : "Read Only"}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {filteredRisks.length > 0 && (
                <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-700 text-sm font-medium rounded-md text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-700 text-sm font-medium rounded-md text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700 dark:text-slate-400">
                                Showing <span className="font-semibold text-gray-900 dark:text-slate-200">{filteredRisks.length === 0 ? 0 : startIndex + 1}</span> to <span className="font-semibold text-gray-900 dark:text-slate-200">{Math.min(startIndex + itemsPerPage, filteredRisks.length)}</span> of <span className="font-semibold text-gray-900 dark:text-slate-200">{filteredRisks.length}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px bg-white dark:bg-slate-800" aria-label="Pagination">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="First Page"
                                >
                                    <span className="sr-only">First</span>
                                    <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Previous Page"
                                >
                                    <span className="sr-only">Previous</span>
                                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                                </button>

                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-gray-700 dark:text-slate-300">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Next Page"
                                >
                                    <span className="sr-only">Next</span>
                                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Last Page"
                                >
                                    <span className="sr-only">Last</span>
                                    <ChevronsRight className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
