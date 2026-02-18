
import React from 'react';
import { getRiskLevel, getRiskLevelColor, IMPACT_LABELS, LIKELIHOOD_LABELS, RiskItem } from '../types';

interface BaselineComparisonMatrixProps {
    actualRisks: RiskItem[];
    baselineScores: { impact: number, likelihood: number, category: string }[];
    title?: string;
}

export const BaselineComparisonMatrix: React.FC<BaselineComparisonMatrixProps> = ({
    actualRisks,
    baselineScores,
    title = "Baseline vs. Actual Risk Profile"
}) => {

    // Helper to get counts for a cell
    const getActualCount = (i: number, l: number) => {
        return actualRisks.filter(r => r.residualRisk.impact === i && r.residualRisk.likelihood === l).length;
    };

    const getBaselineCount = (i: number, l: number) => {
        return baselineScores.filter(s => s.impact === i && s.likelihood === l).length;
    };

    const renderCell = (impact: number, likelihood: number) => {
        const level = getRiskLevel(impact, likelihood);
        const baseColor = getRiskLevelColor(level);
        const actualCount = getActualCount(impact, likelihood);
        const baselineCount = getBaselineCount(impact, likelihood);

        const hasBaseline = baselineCount > 0;
        const hasActual = actualCount > 0;

        return (
            <div
                key={`${impact}-${likelihood}`}
                className={`
          relative flex items-center justify-center text-xs font-medium border border-white/20 transition-all
          ${baseColor}
          h-12 w-full
          ${!hasActual && !hasBaseline ? 'opacity-30' : 'opacity-100'}
        `}
                title={`Impact: ${IMPACT_LABELS[impact]}, Likelihood: ${LIKELIHOOD_LABELS[likelihood]} - ${level}\nActual: ${actualCount}, Baseline: ${baselineCount}`}
            >
                <div className="flex gap-1 items-center">
                    {/* Baseline indicator (small, outlined) */}
                    {hasBaseline && (
                        <div className="bg-transparent border border-white dark:border-slate-200 text-white dark:text-slate-200 rounded-sm px-1 text-[8px] font-bold shadow-sm" title="Industry Baseline">
                            B:{baselineCount}
                        </div>
                    )}
                    {/* Actual indicator (filled) */}
                    {hasActual && (
                        <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded-sm px-1 text-[8px] font-black shadow-md" title="Project Actual">
                            A:{actualCount}
                        </div>
                    )}
                </div>

                {/* Visual warning if actual > baseline in critical cells */}
                {hasActual && actualCount > baselineCount && (importanceScore(impact, likelihood) >= 15) && (
                    <div className="absolute top-0 right-0 p-0.5">
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse shadow-sm" />
                    </div>
                )}
            </div>
        );
    };

    // Simple importance score to highlight critical areas
    const importanceScore = (i: number, l: number) => i * l;

    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 w-full transition-colors">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-tighter italic">{title}</h3>
                <div className="flex gap-3">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 border border-blue-400 dark:border-blue-500 rounded-sm"></div>
                        <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase">BASELINE</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-900 dark:bg-blue-600 rounded-sm"></div>
                        <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase">ACTUAL</span>
                    </div>
                </div>
            </div>

            <div className="flex">
                {/* Y-Axis Label */}
                <div className="flex items-center justify-center mr-2">
                    <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase -rotate-90 whitespace-nowrap tracking-widest">
                        Impact
                    </span>
                </div>

                <div className="flex-1">
                    {/* Grid */}
                    <div className="grid grid-cols-5 gap-0.5 mb-2">
                        {/* Y-Axis Labels (Rows) */}
                        {[5, 4, 3, 2, 1].map(impact => (
                            <React.Fragment key={impact}>
                                {[1, 2, 3, 4, 5].map(likelihood => renderCell(impact, likelihood))}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* X-Axis Label */}
                    <div className="text-center">
                        <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Likelihood</span>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-50 dark:border-slate-800 flex justify-between items-center">
                <p className="text-[10px] text-gray-400 dark:text-slate-500 italic">
                    * B = Industry Norm, A = Current Assessment
                </p>
                {baselineScores.length > 0 && (
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-800/30">
                        Verified EPC Benchmark Profile
                    </span>
                )}
            </div>
        </div>
    );
};

