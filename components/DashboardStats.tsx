import React from 'react';
import { RiskItem, getRiskLevel } from '../types';

interface DashboardStatsProps {
    projectFilter: string;
    filteredRisks: RiskItem[];
    uniqueProjectData: {
        projectNo: string;
        industryType?: string;
        appliedModifiers?: string[];
    }[];
}

export function DashboardStats({ projectFilter, filteredRisks, uniqueProjectData }: DashboardStatsProps) {
    const currentProject = uniqueProjectData.find(p => p.projectNo === projectFilter);

    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm h-full flex flex-col transition-colors">
            <h2 className="text-lg font-extrabold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                Dashboard
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5 uppercase tracking-wider font-bold">
                {projectFilter === 'All' ? 'Consolidated Data' : (
                    <span className="flex items-center gap-2">
                        {projectFilter}
                        {currentProject?.industryType && (
                            <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[9px] border border-blue-100 normal-case font-medium">
                                {currentProject.industryType}
                            </span>
                        )}
                    </span>
                )}
            </p>

            {/* Applied Modifiers Column Display */}
            {projectFilter !== 'All' && currentProject?.appliedModifiers && (
                <div className="flex flex-wrap gap-1 mt-3">
                    {currentProject.appliedModifiers.map(mod => (
                        <span key={mod} className="bg-white text-gray-400 px-1.5 py-0.5 rounded-[4px] text-[7px] border border-gray-100 uppercase tracking-tighter font-bold shadow-sm">
                            {mod}
                        </span>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 gap-3 mt-6 flex-1">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold tracking-widest">Total Risks</span>
                    <span className="text-xl font-black text-gray-900 dark:text-slate-100">{filteredRisks.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                    <span className="text-[10px] text-green-600/60 dark:text-green-400/60 uppercase font-bold tracking-widest">Closed</span>
                    <span className="text-xl font-black text-green-600 dark:text-green-400">
                        {filteredRisks.filter(r => r.status === 'Closed').length}
                    </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                    <span className="text-[10px] text-red-600/60 dark:text-red-400/60 uppercase font-bold tracking-widest">Severe Risks</span>
                    <span className="text-xl font-black text-red-600 dark:text-red-400">
                        {filteredRisks.filter(r => {
                            const level = getRiskLevel(r.residualRisk.impact, r.residualRisk.likelihood);
                            return level === 'Extreme' || level === 'Critical';
                        }).length}
                    </span>
                </div>
            </div>
        </div>
    );
}
