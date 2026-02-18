
import React from 'react';
import { RiskItem, RiskSnapshot, getRiskLevel, getRiskLevelColor, formatDateDisplay } from '../types';
import { X, Clock, ArrowRight, User } from 'lucide-react';

interface RiskHistoryProps {
  risk: RiskItem;
  onClose: () => void;
}

export const RiskHistory: React.FC<RiskHistoryProps> = ({ risk, onClose }) => {

  const getFieldName = (field: string) => {
    const map: Record<string, string> = {
      projectNo: 'Project No',
      projectName: 'Project Name',
      pmName: 'PM Name',
      riskCategory: 'Category',
      actionToControl: 'Mitigation Plan',
      mitigationStrategy: 'Strategy',
      possibleEffect: 'Effect',
      deadlineDate: 'Deadline',
      finishedDate: 'Finished Date',
      raisedDate: 'Raised Date',
      'initialRisk.impact': 'Initial Impact',
      'initialRisk.likelihood': 'Initial Likelihood',
      'residualRisk.impact': 'Residual Impact',
      'residualRisk.likelihood': 'Residual Likelihood',
      owner: 'Owner',
      status: 'Status',
      comment: 'Comment',
      description: 'Description'
    };
    return map[field] || field;
  };

  const formatValue = (key: string, val: any) => {
    if (val === null || val === undefined || val === '') return <span className="text-gray-400 dark:text-slate-500 italic">Empty</span>;
    if (key.toLowerCase().includes('date')) {
      return formatDateDisplay(String(val));
    }
    return String(val);
  };

  const renderDiffSnapshot = (snapshot: RiskSnapshot, index: number) => {
    if (!snapshot.changes || snapshot.changes.length === 0) return null;

    return (
      <div key={snapshot.versionId} className="relative pl-8 pb-8 border-l-2 border-gray-200 dark:border-slate-800 last:pb-0 transition-colors">
        <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full ring-4 ring-white dark:ring-slate-950" />
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-sm font-bold text-gray-900 dark:text-slate-100 block">Update {index + 1}</span>
              <span className="text-[10px] text-gray-500 dark:text-slate-400 flex items-center mt-0.5">
                <Clock className="w-3 h-3 mr-1" />
                {new Date(snapshot.timestamp).toLocaleString()}
              </span>
            </div>
            {snapshot.updatedBy && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-slate-800 rounded text-[10px] text-gray-600 dark:text-slate-400 font-medium border border-gray-100 dark:border-slate-700 transition-colors">
                <User className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                {snapshot.updatedBy}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {snapshot.changes.map((change, i) => (
              <div key={i} className="text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 border-b border-gray-50 dark:border-slate-800/50 last:border-0 pb-1 last:pb-0 transition-colors">
                <span className="font-medium text-gray-700 dark:text-slate-300 w-32 flex-shrink-0">
                  {getFieldName(change.field)}:
                </span>
                <div className="flex items-center text-gray-600 dark:text-slate-400 flex-1">
                  <span className="line-through text-red-400 dark:text-red-500/70 text-xs mr-2">{formatValue(change.field, change.oldValue)}</span>
                  <ArrowRight className="w-3 h-3 text-gray-400 dark:text-slate-500 mx-1" />
                  <span className="text-green-700 dark:text-green-400 font-medium">{formatValue(change.field, change.newValue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Fallback for Legacy Data (Old Snapshots with full 'data' object)
  const renderLegacySnapshot = (snapshot: RiskSnapshot, index: number) => {
    if (!snapshot.data) return null;
    const { data, timestamp } = snapshot;
    const initialLevel = getRiskLevel(data.initialRisk.impact, data.initialRisk.likelihood);
    const residualLevel = getRiskLevel(data.residualRisk.impact, data.residualRisk.likelihood);

    return (
      <div key={snapshot.versionId} className="relative pl-8 pb-8 border-l-2 border-gray-200 dark:border-slate-800 last:pb-0 transition-colors">
        <div className="absolute -left-2 top-0 w-4 h-4 bg-gray-400 dark:bg-slate-600 rounded-full ring-4 ring-white dark:ring-slate-950" />
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm opacity-80 transition-colors">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-gray-600 dark:text-slate-400">Legacy Version {index + 1} (Full Snapshot)</span>
            <span className="text-xs text-gray-500 dark:text-slate-500 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(timestamp).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <p className="text-gray-500 dark:text-slate-500 text-xs">Description</p>
              <p className="font-medium text-gray-900 dark:text-slate-100 truncate" title={data.description}>{data.description}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-slate-500 text-xs">Status</p>
              <span className="text-xs font-medium text-gray-800 dark:text-slate-200">{data.status}</span>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-2">
              <div>
                <p className="text-gray-500 text-xs">Initial Risk</p>
                <div className="flex items-center mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs text-white font-bold ${getRiskLevelColor(initialLevel)}`}>{initialLevel}</span>
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Residual Risk</p>
                <div className="flex items-center mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs text-white font-bold ${getRiskLevelColor(residualLevel)}`}>{residualLevel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full max-w-md bg-gray-50 dark:bg-slate-950 h-full shadow-2xl flex flex-col transform transition-all duration-300 ease-in-out border-l border-white/10 dark:border-slate-800">
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center transition-colors">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">Audit Log</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">Change History for: {risk.riskId}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h3 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">Risk Metadata</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
                <p className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase">Created By</p>
                <p className="text-xs font-medium text-gray-700 dark:text-slate-300 truncate mt-0.5">{risk.createdBy || 'Unknown'}</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
                <p className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase">Last Modified</p>
                <p className="text-xs font-medium text-gray-700 dark:text-slate-300 truncate mt-0.5">{risk.lastUpdatedBy || 'Unknown'}</p>
              </div>
            </div>
          </div>

          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Update Timeline</h3>
          {risk.history.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-slate-500 py-10">
              <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-slate-800" />
              <p>No changes recorded yet.</p>
              <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">This is the original version.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {[...risk.history].reverse().map((snap, idx) => {
                if (snap.changes) return renderDiffSnapshot(snap, risk.history.length - 1 - idx);
                return renderLegacySnapshot(snap, risk.history.length - 1 - idx);
              })}

              {/* Start of Timeline Marker */}
              <div className="relative pl-8 pt-2">
                <div className="absolute -left-2 top-3 w-4 h-4 bg-green-500 rounded-full ring-4 ring-white dark:ring-slate-950" />
                <div className="text-xs text-green-700 dark:text-green-500 font-bold uppercase tracking-wider transition-colors">Risk Created</div>
                <div className="text-xs text-gray-400 dark:text-slate-500">{formatDateDisplay(risk.raisedDate)}</div>
                {risk.createdBy && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-500 dark:text-slate-600">
                    <User className="w-2.5 h-2.5" />
                    by {risk.createdBy}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
