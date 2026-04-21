import React from 'react';
import { Filter, Edit2, TrendingDown, X, Search } from 'lucide-react';

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
    setSearchQuery
}: DashboardControlsProps) {

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
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

                {projectFilter !== 'All' && (
                    <button
                        onClick={() => setShowBenchmark(!showBenchmark)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border ${showBenchmark
                            ? 'bg-blue-600 border-blue-600 text-white shadow-blue-100'
                            : 'bg-white border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-600'
                            }`}
                    >
                        <TrendingDown className="w-3.5 h-3.5" />
                        {showBenchmark ? 'Close Benchmark' : 'Industry Benchmark'}
                    </button>
                )}

                {matrixFilter && (
                    <button
                        onClick={() => setMatrixFilter(null)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all shadow-sm animate-in fade-in zoom-in duration-200"
                    >
                        <X className="w-3 h-3" />
                        Clear Matrix: {matrixFilter.mode === 'initial' ? 'Initial' : 'Residual'} ({matrixFilter.impact}x{matrixFilter.likelihood})
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
