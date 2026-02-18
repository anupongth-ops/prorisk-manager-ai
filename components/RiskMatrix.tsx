
import React from 'react';
import { getRiskLevel, getRiskLevelColor, IMPACT_LABELS, LIKELIHOOD_LABELS, RiskItem } from '../types';

interface RiskMatrixProps {
  risks?: RiskItem[]; // For dashboard mode: show counts
  mode?: 'initial' | 'residual'; // Specify which score to count in dashboard mode
  selectedImpact?: number; // For input mode
  selectedLikelihood?: number; // For input mode
  onSelect?: (impact: number, likelihood: number) => void; // For input mode
  title?: string;
}

export const RiskMatrix: React.FC<RiskMatrixProps> = ({
  risks,
  mode = 'residual',
  selectedImpact,
  selectedLikelihood,
  onSelect,
  title = "Risk Matrix"
}) => {

  const isInteractive = !!onSelect;

  // Helper to get counts for a cell if we are in dashboard mode
  const getCount = (i: number, l: number) => {
    if (!risks) return null;
    if (mode === 'initial') {
      return risks.filter(r => r.initialRisk.impact === i && r.initialRisk.likelihood === l).length;
    }
    return risks.filter(r => r.residualRisk.impact === i && r.residualRisk.likelihood === l).length;
  };

  const renderCell = (impact: number, likelihood: number) => {
    const level = getRiskLevel(impact, likelihood);
    const baseColor = getRiskLevelColor(level);
    const count = getCount(impact, likelihood);

    const isSelected = selectedImpact === impact && selectedLikelihood === likelihood;
    const hasData = count !== null && count > 0;

    return (
      <div
        key={`${impact}-${likelihood}`}
        onClick={() => isInteractive && onSelect(impact, likelihood)}
        className={`
          relative flex items-center justify-center text-xs font-medium border border-white/20 transition-all
          ${baseColor}
          ${isInteractive ? 'cursor-pointer hover:brightness-110' : 'cursor-default'}
          ${isSelected ? 'ring-4 ring-blue-500 z-10 scale-105 shadow-lg' : ''}
          ${!isInteractive && !hasData ? 'opacity-40' : 'opacity-100'}
          h-10 w-full sm:h-12
        `}
        title={`Impact: ${IMPACT_LABELS[impact]}, Likelihood: ${LIKELIHOOD_LABELS[likelihood]} - ${level}`}
      >
        {hasData && (
          <span className="bg-white dark:bg-slate-900 dark:text-slate-100 text-gray-900 rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px] shadow-sm">
            {count}
          </span>
        )}
        {isSelected && isInteractive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 dark:bg-white/10">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 w-full transition-colors">
      {title && <h3 className="text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-2 text-center uppercase tracking-wider">{title}</h3>}

      <div className="flex">
        {/* Y-Axis Label */}
        <div className="flex items-center justify-center mr-1">
          <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase -rotate-90 whitespace-nowrap tracking-wider">
            Impact
          </span>
        </div>

        <div className="flex-1">
          {/* Grid */}
          <div className="grid grid-cols-5 gap-0.5 mb-1">
            {/* Y-Axis Labels (Rows) */}
            {[5, 4, 3, 2, 1].map(impact => (
              <React.Fragment key={impact}>
                {/* Cells for this row */}
                {[1, 2, 3, 4, 5].map(likelihood => renderCell(impact, likelihood))}
              </React.Fragment>
            ))}
          </div>

          {/* X-Axis Label */}
          <div className="text-center">
            <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Likelihood</span>
          </div>
        </div>
      </div>

      {/* Legend / Labels Helper */}
      <div className="flex justify-between text-[8px] text-gray-400 dark:text-slate-500 mt-1 px-4">
        <span>Rarely</span>
        <span>Most Likely</span>
      </div>
    </div>
  );
};
