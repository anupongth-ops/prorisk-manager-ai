import React from 'react';
import { RiskItem, RISK_CATEGORIES } from '../types';
import { PieChart, List } from 'lucide-react';

interface CategoryBarChartProps {
  risks: RiskItem[];
}

export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({ risks }) => {
  // Calculate counts per category
  const data = RISK_CATEGORIES.map(category => {
    return {
      category,
      count: risks.filter(r => r.riskCategory === category).length
    };
  }).filter(d => d.count > 0).sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 h-full flex flex-col transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <List className="w-4 h-4 text-blue-500" />
          Risk Category
        </h3>
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4 overflow-y-auto pr-2">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 py-8">
            <PieChart className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs">No risk data available</p>
          </div>
        ) : (
          data.map(d => (
            <div key={d.category} className="group w-full">
              <div className="flex justify-between text-[10px] font-bold text-gray-600 dark:text-slate-400 mb-1.5">
                <span className="truncate pr-2">{d.category}</span>
                <span>{d.count}</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${(d.count / maxCount) * 100}%` }}
                ></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
