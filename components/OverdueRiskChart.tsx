
import React from 'react';
import { RiskItem, getRiskLevel, RiskLevel, getRiskLevelColor } from '../types';
import { Clock, AlertCircle } from 'lucide-react';

interface OverdueRiskChartProps {
  risks: RiskItem[];
}

const LEVELS: RiskLevel[] = ['Very Low', 'Low', 'Significant', 'Critical', 'Extreme'];

export const OverdueRiskChart: React.FC<OverdueRiskChartProps> = ({ risks }) => {
  const today = new Date().toISOString().split('T')[0];

  const overdueRisks = risks.filter(r =>
    r.status !== 'Closed' &&
    r.deadlineDate &&
    r.deadlineDate < today
  );

  const data = LEVELS.map(level => ({
    level,
    count: overdueRisks.filter(r => getRiskLevel(r.residualRisk.impact, r.residualRisk.likelihood) === level).length
  }));

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const totalOverdue = overdueRisks.length;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 h-full flex flex-col transition-colors">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${totalOverdue > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-slate-800'}`}>
            <Clock className={`w-4 h-4 ${totalOverdue > 0 ? 'text-red-500' : 'text-gray-400 dark:text-slate-500'}`} />
          </div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider">Overdue by Level</h3>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${totalOverdue > 0 ? 'bg-red-50 border-red-100 dark:bg-red-900/30 dark:border-red-800 text-red-700 dark:text-red-400' : 'bg-gray-50 border-gray-100 dark:bg-slate-800 dark:border-slate-700 text-gray-400 dark:text-slate-500'}`}>
          <AlertCircle className="w-3 h-3" />
          <span className="text-[10px] font-black uppercase tracking-widest">{totalOverdue} OVERDUE</span>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {[...data].reverse().map((d) => {
          const levelColor = getRiskLevelColor(d.level).split(' ')[0];
          const hasCount = d.count > 0;

          return (
            <div key={d.level} className="space-y-1.5 group">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight transition-colors">
                <span className={`${hasCount ? 'text-gray-900 dark:text-slate-100' : 'text-gray-400 dark:text-slate-600'}`}>{d.level}</span>
                <span className={`${hasCount ? 'text-red-600 dark:text-red-400' : 'text-gray-300 dark:text-slate-700'}`}>{d.count}</span>
              </div>
              <div className="h-2.5 w-full bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden border border-gray-100 dark:border-slate-700">
                <div
                  className={`h-full ${hasCount ? levelColor : 'bg-gray-200 dark:bg-slate-700'} transition-all duration-1000 ease-out rounded-full shadow-sm`}
                  style={{ width: `${hasCount ? (d.count / maxCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {totalOverdue === 0 ? (
        <div className="mt-6 pt-4 border-t border-gray-50 dark:border-slate-800 text-center">
          <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            All deadlines on track
          </div>
        </div>
      ) : (
        <div className="mt-6 pt-4 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[9px] text-gray-400 dark:text-slate-500 italic font-medium">Attention required for active risks</p>
          <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Urgent</div>
        </div>
      )}
    </div>
  );
};
