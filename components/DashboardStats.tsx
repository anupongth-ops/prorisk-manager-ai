import React from 'react';
import { RiskItem, getRiskLevel, RiskAppetite, isExceedingAppetite, DEFAULT_RISK_APPETITE, isReviewOverdue, ReviewFrequency, DEFAULT_REVIEW_FREQUENCY } from '../types';

interface DashboardStatsProps {
    projectFilter: string;
    filteredRisks: RiskItem[];
    uniqueProjectData: {
        projectNo: string;
        industryType?: string;
        appliedModifiers?: string[];
        riskAppetite?: RiskAppetite;
        reviewFrequency?: ReviewFrequency;
    }[];
}

export function DashboardStats({ projectFilter, filteredRisks, uniqueProjectData }: DashboardStatsProps) {
    const currentProject = uniqueProjectData.find(p => p.projectNo === projectFilter);
    const appetiteThreshold = currentProject?.riskAppetite || DEFAULT_RISK_APPETITE;
    const reviewCycle = currentProject?.reviewFrequency || DEFAULT_REVIEW_FREQUENCY;

    const exceedingRisksCount = filteredRisks.filter(r => {
        const level = getRiskLevel(r.residualRisk.impact, r.residualRisk.likelihood);
        const app = r.riskAppetite || currentProject?.riskAppetite || DEFAULT_RISK_APPETITE;
        return isExceedingAppetite(level, app);
    }).length;

    const reviewDueCount = filteredRisks.filter(r => isReviewOverdue(r.nextReviewDate, r.status)).length;

    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm h-full flex flex-col transition-colors">
            <h2 className="text-lg font-extrabold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                Dashboard
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5 uppercase tracking-wider font-bold">
                {projectFilter === 'All' ? 'Consolidated Data' : (
                    <span className="flex items-center gap-2 flex-wrap">
                        {projectFilter}
                        {currentProject?.industryType && (
                            <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[9px] border border-blue-100 normal-case font-medium">
                                {currentProject.industryType}
                            </span>
                        )}
                        <span className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-1.5 py-0.5 rounded text-[9px] border border-purple-200 dark:border-purple-800 normal-case font-medium">
                            Appetite: &gt; {appetiteThreshold}
                        </span>
                        <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-1.5 py-0.5 rounded text-[9px] border border-indigo-200 dark:border-indigo-800 normal-case font-medium">
                            Cycle: {reviewCycle}
                        </span>
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

            <div className="grid grid-cols-1 gap-2.5 mt-4 flex-1">
                <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold tracking-widest">Total Risks</span>
                    <span className="text-lg font-black text-gray-900 dark:text-slate-100">{filteredRisks.length}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-indigo-700/80 dark:text-indigo-400 uppercase font-bold tracking-widest">Review Due</span>
                        <span className="text-[9px] text-indigo-600/70 dark:text-indigo-500 font-medium">ISO 31000 Review Cycle</span>
                    </div>
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{reviewDueCount}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-amber-700/80 dark:text-amber-400 uppercase font-bold tracking-widest">Exceeds Appetite</span>
                        <span className="text-[9px] text-amber-600/70 dark:text-amber-500 font-medium">ISO 31000 Risk Tolerance</span>
                    </div>
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">{exceedingRisksCount}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-green-50 dark:bg-green-900/10 rounded-lg">
                    <span className="text-[10px] text-green-600/60 dark:text-green-400/60 uppercase font-bold tracking-widest">Closed</span>
                    <span className="text-lg font-black text-green-600 dark:text-green-400">
                        {filteredRisks.filter(r => r.status === 'Closed').length}
                    </span>
                </div>
            </div>
        </div>
    );
}
