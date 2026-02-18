
import React, { useState, useEffect, useMemo } from 'react';
import {
  RiskItem, ImpactLevel, LikelihoodLevel, PossibleEffect,
  MitigationStrategy, IMPACT_LABELS, LIKELIHOOD_LABELS,
  EFFECT_LABELS, STRATEGY_LABELS, RISK_CATEGORIES, getRiskLevel, getRiskLevelColor, UserProfile
} from '../types';
import { Sparkles, Save, X, Lock } from 'lucide-react';
import { generateMitigationSuggestion } from '../services/groqService';
import { RiskMatrix } from './RiskMatrix';

interface RiskFormProps {
  initialData?: RiskItem;
  prefilledProject?: { projectNo: string; projectName: string; pmName: string; email: string } | null;
  onSave: (risk: RiskItem) => void;
  onCancel: () => void;
  existingProjects: { projectNo: string; projectName: string; pmName: string; email: string }[];
  nextId: string;
  userProfile: UserProfile | null;
}

const initialRiskState: RiskItem = {
  id: '',
  riskId: '',
  projectNo: '',
  projectName: '',
  pmName: '',
  email: '',
  riskCategory: RISK_CATEGORIES[0],
  description: '',
  initialRisk: { impact: ImpactLevel.Medium, likelihood: LikelihoodLevel.Medium },
  possibleEffect: PossibleEffect.Cost,
  mitigationStrategy: MitigationStrategy.Mitigate,
  actionToControl: '',
  residualRisk: { impact: ImpactLevel.Low, likelihood: LikelihoodLevel.Low },
  owner: '',
  raisedDate: new Date().toISOString().split('T')[0],
  deadlineDate: '',
  finishedDate: '',
  status: 'Open',
  comment: '',
  updatedAt: new Date().toISOString(),
  history: []
};

const MONTHS = [
  { val: '01', label: 'Jan' }, { val: '02', label: 'Feb' }, { val: '03', label: 'Mar' },
  { val: '04', label: 'Apr' }, { val: '05', label: 'May' }, { val: '06', label: 'Jun' },
  { val: '07', label: 'Jul' }, { val: '08', label: 'Aug' }, { val: '09', label: 'Sep' },
  { val: '10', label: 'Oct' }, { val: '11', label: 'Nov' }, { val: '12', label: 'Dec' }
];

const DateInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => {
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-');
      setYear(y || '');
      setMonth(m || '');
      setDay(d || '');
    } else {
      setYear('');
      setMonth('');
      setDay('');
    }
  }, [value]);

  const handlePartChange = (part: 'd' | 'm' | 'y', val: string) => {
    let newD = part === 'd' ? val : day;
    let newM = part === 'm' ? val : month;
    let newY = part === 'y' ? val : year;

    if (part === 'd') setDay(val);
    if (part === 'm') setMonth(val);
    if (part === 'y') setYear(val);

    if (newY && newM && newD) {
      onChange(`${newY}-${newM}-${newD}`);
    } else if (!newY && !newM && !newD) {
      onChange('');
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => String(currentYear - 5 + i));

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-1">{label}</label>
      <div className="flex gap-1">
        <select
          className="w-16 border border-gray-300 dark:border-slate-700 rounded-md px-1 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-slate-100 transition-colors"
          value={day}
          onChange={(e) => handlePartChange('d', e.target.value)}
        >
          <option value="" className="dark:bg-slate-900">DD</option>
          {days.map(d => <option key={d} value={d} className="dark:bg-slate-900">{d}</option>)}
        </select>
        <select
          className="w-20 border border-gray-300 dark:border-slate-700 rounded-md px-1 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-slate-100 transition-colors"
          value={month}
          onChange={(e) => handlePartChange('m', e.target.value)}
        >
          <option value="" className="dark:bg-slate-900">MMM</option>
          {MONTHS.map(m => <option key={m.val} value={m.val} className="dark:bg-slate-900">{m.label}</option>)}
        </select>
        <select
          className="w-20 border border-gray-300 dark:border-slate-700 rounded-md px-1 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-slate-100 transition-colors"
          value={year}
          onChange={(e) => handlePartChange('y', e.target.value)}
        >
          <option value="" className="dark:bg-slate-900">YYYY</option>
          {years.map(y => <option key={y} value={y} className="dark:bg-slate-900">{y}</option>)}
        </select>
      </div>
    </div>
  );
};

export const RiskForm: React.FC<RiskFormProps> = ({ initialData, prefilledProject, onSave, onCancel, existingProjects, nextId, userProfile }) => {
  const [formData, setFormData] = useState<RiskItem>(() => {
    if (initialData) return initialData;
    if (prefilledProject) return { ...initialRiskState, id: crypto.randomUUID(), riskId: nextId, ...prefilledProject };
    return { ...initialRiskState, id: crypto.randomUUID(), riskId: nextId };
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else if (prefilledProject) {
      setFormData(prev => ({ ...prev, ...prefilledProject, riskId: nextId }));
    } else {
      setFormData(prev => ({ ...prev, riskId: nextId }));
    }
  }, [initialData, prefilledProject, nextId]);

  const isAdmin = userProfile?.role === 'Admin';

  // Filter projects user can select
  const availableProjects = useMemo(() => {
    if (isAdmin) return existingProjects;
    return existingProjects.filter(p => userProfile?.assignedProjects?.includes(p.projectNo));
  }, [existingProjects, isAdmin, userProfile]);

  const handleChange = (field: keyof RiskItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProjectSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProjectNo = e.target.value;
    const projectData = existingProjects.find(p => p.projectNo === selectedProjectNo);

    if (projectData) {
      setFormData(prev => ({
        ...prev,
        projectNo: projectData.projectNo,
        projectName: projectData.projectName,
        pmName: projectData.pmName,
        email: projectData.email
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        projectNo: '',
        projectName: '',
        pmName: '',
        email: ''
      }));
    }
  };

  const handleMatrixChange = (parent: 'initialRisk' | 'residualRisk', impact: number, likelihood: number) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { impact, likelihood }
    }));
  };

  const handleAiGenerate = async () => {
    if (!formData.description) {
      setError("Please enter a description first.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const suggestion = await generateMitigationSuggestion(
        formData.description,
        formData.initialRisk.impact,
        formData.initialRisk.likelihood,
        formData.possibleEffect
      );

      if (suggestion) {
        setFormData(prev => ({
          ...prev,
          mitigationStrategy: suggestion.strategy,
          actionToControl: suggestion.action
        }));
      } else {
        setError("Could not generate a suggestion. Please check your API key or try again.");
      }
    } catch (e) {
      setError("AI generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const initialLevel = getRiskLevel(formData.initialRisk.impact, formData.initialRisk.likelihood);
  const residualLevel = getRiskLevel(formData.residualRisk.impact, formData.residualRisk.likelihood);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col border border-white/10 dark:border-slate-800 transition-all">

        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-sm transition-colors">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">
              {initialData ? 'Edit Risk Assessment' : 'New Risk Assessment'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Complete the risk assessment form below.</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">

          {/* Section 1: Project Info */}
          <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-200 dark:border-slate-800 transition-colors">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider">1. Project Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-1">Project No</label>
                {prefilledProject || initialData ? (
                  <div className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm font-bold text-gray-900 dark:text-slate-100 shadow-inner flex items-center justify-between transition-colors">
                    {formData.projectNo}
                    <Lock size={12} className="text-gray-300 dark:text-slate-600" />
                  </div>
                ) : (
                  <select
                    required
                    className="w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition bg-white dark:bg-slate-800 dark:text-slate-100"
                    value={formData.projectNo}
                    onChange={handleProjectSelect}
                  >
                    <option value="" className="dark:bg-slate-900">-- Select Project --</option>
                    {availableProjects.map(p => (
                      <option key={p.projectNo} value={p.projectNo} className="dark:bg-slate-900">{p.projectNo}</option>
                    ))}
                  </select>
                )}
                {!isAdmin && !prefilledProject && !initialData && availableProjects.length === 0 && (
                  <p className="text-[10px] text-red-500 mt-1 font-bold">No projects assigned to your account.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-1">Project Name</label>
                <input
                  required
                  type="text"
                  readOnly={!!prefilledProject || !!initialData || !isAdmin}
                  className={`w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition ${prefilledProject || initialData || !isAdmin ? 'bg-gray-100 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-slate-800 dark:text-slate-100'}`}
                  value={formData.projectName}
                  onChange={(e) => handleChange('projectName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-1">PM Name</label>
                <input
                  required
                  type="text"
                  readOnly={!!prefilledProject || !!initialData || !isAdmin}
                  className={`w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition ${prefilledProject || initialData || !isAdmin ? 'bg-gray-100 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-slate-800 dark:text-slate-100'}`}
                  value={formData.pmName}
                  onChange={(e) => handleChange('pmName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-1">Email</label>
                <input
                  required
                  type="email"
                  readOnly={!!prefilledProject || !!initialData || !isAdmin}
                  className={`w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition ${prefilledProject || initialData || !isAdmin ? 'bg-gray-100 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-slate-800 dark:text-slate-100'}`}
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Risk Identification */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-4 border-b dark:border-slate-800 pb-2 transition-colors">2. Risk Identification & Analysis</h3>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-1">Risk ID</label>
                    <input
                      required
                      type="text"
                      className="w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 dark:bg-slate-800/80 dark:text-slate-100 transition-colors"
                      value={formData.riskId}
                      onChange={(e) => handleChange('riskId', e.target.value)}
                      placeholder="R-001"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-1">Risk Category</label>
                    <select
                      required
                      className="w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-slate-100 transition-colors"
                      value={formData.riskCategory}
                      onChange={(e) => handleChange('riskCategory', e.target.value)}
                    >
                      <option value="" disabled className="dark:bg-slate-900">Select Category</option>
                      {RISK_CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className="dark:bg-slate-900">{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-1">Description</label>
                  <textarea
                    required
                    className="w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none bg-white dark:bg-slate-800 dark:text-slate-100 transition-colors"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe the potential risk event..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-1">Possible Effect</label>
                  <select
                    className="w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-100 transition-colors"
                    value={formData.possibleEffect}
                    onChange={(e) => handleChange('possibleEffect', e.target.value)}
                  >
                    {Object.entries(EFFECT_LABELS).map(([val, label]) => (
                      <option key={val} value={val} className="dark:bg-slate-900">{val} - {label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 transition-colors">
                  <div>
                    <span className="text-xs text-blue-500 font-bold uppercase">Impact</span>
                    <div className="font-medium dark:text-slate-200">{IMPACT_LABELS[formData.initialRisk.impact]} ({formData.initialRisk.impact})</div>
                  </div>
                  <div>
                    <span className="text-xs text-blue-500 font-bold uppercase">Likelihood</span>
                    <div className="font-medium dark:text-slate-200">{LIKELIHOOD_LABELS[formData.initialRisk.likelihood]} ({formData.initialRisk.likelihood})</div>
                  </div>
                  <div className="col-span-2 mt-1 pt-2 border-t border-blue-200 dark:border-blue-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Risk Level</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskLevelColor(initialLevel)}`}>
                      {initialLevel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <RiskMatrix
                  title="Initial Risk Assessment"
                  selectedImpact={formData.initialRisk.impact}
                  selectedLikelihood={formData.initialRisk.likelihood}
                  onSelect={(i, l) => handleMatrixChange('initialRisk', i, l)}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Mitigation */}
          <div>
            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2 mb-4 transition-colors">
              <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider">3. Mitigation & Control</h3>
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isGenerating ? 'AI Suggesting...' : 'AI Suggest'}
              </button>
            </div>
            {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-1">Strategy</label>
                    <select
                      className="w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-100 transition-colors"
                      value={formData.mitigationStrategy}
                      onChange={(e) => handleChange('mitigationStrategy', e.target.value)}
                    >
                      {Object.entries(STRATEGY_LABELS).map(([val, label]) => (
                        <option key={val} value={val} className="dark:bg-slate-900">{val} - {label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-1">Action Plan</label>
                  <textarea
                    className="w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none bg-white dark:bg-slate-800 dark:text-slate-100 transition-colors"
                    value={formData.actionToControl}
                    onChange={(e) => handleChange('actionToControl', e.target.value)}
                    placeholder="Detailed plan to mitigate the risk..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-800/30 p-3 rounded-lg border border-gray-200 dark:border-slate-800 transition-colors">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase">Residual Impact</span>
                    <div className="font-medium dark:text-slate-200">{IMPACT_LABELS[formData.residualRisk.impact]} ({formData.residualRisk.impact})</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase">Residual Likelihood</span>
                    <div className="font-medium dark:text-slate-200">{LIKELIHOOD_LABELS[formData.residualRisk.likelihood]} ({formData.residualRisk.likelihood})</div>
                  </div>
                  <div className="col-span-2 mt-1 pt-2 border-t border-gray-200 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Residual Level</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskLevelColor(residualLevel)}`}>
                      {residualLevel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <RiskMatrix
                  title="Residual Risk Assessment"
                  selectedImpact={formData.residualRisk.impact}
                  selectedLikelihood={formData.residualRisk.likelihood}
                  onSelect={(i, l) => handleMatrixChange('residualRisk', i, l)}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Administrative */}
          <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-200 dark:border-slate-800 transition-colors">
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-4">4. Administrative</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-1">Owner</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-100 transition-colors"
                  value={formData.owner}
                  onChange={(e) => handleChange('owner', e.target.value)}
                />
              </div>

              <DateInput
                label="Raised Date"
                value={formData.raisedDate}
                onChange={(val) => handleChange('raisedDate', val)}
              />

              <DateInput
                label="Deadline"
                value={formData.deadlineDate}
                onChange={(val) => handleChange('deadlineDate', val)}
              />

              <DateInput
                label="Finished Date"
                value={formData.finishedDate || ''}
                onChange={(val) => handleChange('finishedDate', val)}
              />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-1">Status</label>
                <select
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-100 transition-colors"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="Open" className="dark:bg-slate-900">Open</option>
                  <option value="In Progress" className="dark:bg-slate-900">In Progress</option>
                  <option value="Closed" className="dark:bg-slate-900">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-1">Comment</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-slate-100 transition-colors"
                  value={formData.comment}
                  onChange={(e) => handleChange('comment', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t dark:border-slate-800 transition-colors">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium flex items-center shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Assessment
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
