
import React from 'react';
import { RiskItem, getRiskLevel, getRiskLevelColor, RiskLevel } from '../types';

interface RiskBarChartProps {
  risks: RiskItem[];
}

// Reordered to show ascending severity (from lowest to highest)
const LEVELS: RiskLevel[] = ['Very Low', 'Low', 'Significant', 'Critical', 'Extreme'];

export const RiskBarChart: React.FC<RiskBarChartProps> = ({ risks }) => {
  const data = LEVELS.map(level => {
    const initialCount = risks.filter(r => getRiskLevel(r.initialRisk.impact, r.initialRisk.likelihood) === level).length;
    const residualCount = risks.filter(r => getRiskLevel(r.residualRisk.impact, r.residualRisk.likelihood) === level).length;
    return { level, initial: initialCount, residual: residualCount };
  });

  const maxCount = Math.max(...data.flatMap(d => [d.initial, d.residual]), 1);

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 h-full flex flex-col transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider">Risk Level Distribution</h3>
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm border border-gray-300 dark:border-slate-700" style={{ background: 'linear-gradient(to top, #e5e7eb, #f9fafb)' }}></div>
            Initial
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
            Residual
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 min-h-[180px]">
        {data.map((d) => {
          const levelColorClass = getRiskLevelColor(d.level).split(' ')[0]; // Take only bg- color

          return (
            <div key={d.level} className="flex-1 flex flex-col items-center group">
              <div className="w-full flex items-end justify-center gap-1 mb-2 h-[150px]">
                {/* Initial Bar */}
                <div
                  className="w-1/2 bg-gray-100 dark:bg-slate-800 border-t border-x border-gray-200 dark:border-slate-700 rounded-t-sm transition-all duration-500 relative flex justify-center"
                  style={{ height: `${(d.initial / maxCount) * 100}%` }}
                >
                  {d.initial > 0 && (
                    <span className="absolute -top-5 text-[10px] font-bold text-gray-400 dark:text-slate-500">{d.initial}</span>
                  )}
                </div>
                {/* Residual Bar */}
                <div
                  className={`w-1/2 ${levelColorClass} rounded-t-sm transition-all duration-500 relative flex justify-center shadow-sm`}
                  style={{ height: `${(d.residual / maxCount) * 100}%` }}
                >
                  {d.residual > 0 && (
                    <span className="absolute -top-5 text-[10px] font-bold text-gray-900 dark:text-slate-100">{d.residual}</span>
                  )}
                </div>
              </div>
              <span className="text-[9px] font-bold text-gray-500 dark:text-slate-400 uppercase text-center leading-tight">
                {d.level}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
