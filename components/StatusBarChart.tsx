
import React from 'react';
import { RiskItem } from '../types';

interface StatusBarChartProps {
  risks: RiskItem[];
  comparisonRisks?: RiskItem[]; // All risks for "All Projects" comparison
}

const STATUSES = ['Open', 'In Progress', 'Closed'] as const;

export const StatusBarChart: React.FC<StatusBarChartProps> = ({ risks, comparisonRisks }) => {
  const isComparison = !!comparisonRisks;

  const data = STATUSES.map(status => {
    const count = risks.filter(r => r.status === status).length;
    const comparisonCount = comparisonRisks ? comparisonRisks.filter(r => r.status === status).length : 0;
    return { status, count, comparisonCount };
  });

  const maxCount = Math.max(
    ...data.flatMap(d => [d.count, d.comparisonCount]),
    1
  );

  const getStatusColor = (status: string, isComparisonBar = false) => {
    if (isComparisonBar) return 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700';
    switch (status) {
      case 'Open': return 'bg-red-500';
      case 'In Progress': return 'bg-yellow-500';
      case 'Closed': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 h-full flex flex-col transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider">Status Overview</h3>
        {isComparison ? (
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700"></div>
              Global
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
              Current
            </div>
          </div>
        ) : (
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
        )}
      </div>

      <div className="flex-1 flex items-end justify-between gap-4 min-h-[180px] px-2 pb-2">
        {data.map((d) => (
          <div key={d.status} className="flex-1 flex flex-col items-center group">
            <div className="w-full flex items-end justify-center gap-1 mb-2 h-[150px]">
              {isComparison && (
                <div
                  className={`w-1/2 ${getStatusColor(d.status, true)} border-t border-x rounded-t-sm transition-all duration-500 relative flex justify-center`}
                  style={{ height: `${(d.comparisonCount / maxCount) * 100}%`, minHeight: d.comparisonCount > 0 ? '4px' : '0px' }}
                >
                  {d.comparisonCount > 0 && (
                    <span className="absolute -top-5 text-[9px] font-bold text-gray-400 dark:text-slate-500">
                      {d.comparisonCount}
                    </span>
                  )}
                </div>
              )}
              <div
                className={`${isComparison ? 'w-1/2' : 'w-full'} ${getStatusColor(d.status)} rounded-t-sm transition-all duration-700 relative flex justify-center shadow-md`}
                style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count > 0 ? '8px' : '2px' }}
              >
                {d.count > 0 && (
                  <span className={`absolute -top-7 text-xs font-black ${isComparison ? 'text-gray-900 dark:text-slate-100' : 'text-gray-900 dark:text-slate-100 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-gray-100 dark:border-slate-700 shadow-sm transition-colors'}`}>
                    {d.count}
                  </span>
                )}
              </div>
            </div>
            <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mt-4 text-center leading-tight whitespace-nowrap">
              {d.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
