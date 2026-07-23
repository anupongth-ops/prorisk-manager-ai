
import React, { useState } from 'react';
import { X, Save, FolderPlus, Copy, Factory, ChevronRight, ChevronLeft, CheckCircle2, Info } from 'lucide-react';
import { INDUSTRY_TYPES, RiskAppetite, DEFAULT_RISK_APPETITE, ReviewFrequency, DEFAULT_REVIEW_FREQUENCY } from '../types';
import { PROJECT_MODIFIERS, ProjectModifier } from '../constants/riskConstants';

interface ProjectFormProps {
  existingProjects: { projectNo: string; projectName: string; industryType?: string; riskAppetite?: RiskAppetite; reviewFrequency?: ReviewFrequency }[];
  initialData?: { projectNo: string; projectName: string; pmName: string; email: string; industryType?: string; appliedModifiers?: string[]; riskAppetite?: RiskAppetite; reviewFrequency?: ReviewFrequency };
  isAdmin?: boolean;
  onDeleteProject?: (projectNo: string) => void;
  onSuccess: (
    project: { projectNo: string; projectName: string; pmName: string; email: string; industryType?: string; appliedModifiers?: string[]; riskAppetite?: RiskAppetite; reviewFrequency?: ReviewFrequency },
    copySourceProjectNo?: string,
    modifiers?: ProjectModifier[]
  ) => void;
  onCancel: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ existingProjects, initialData, isAdmin, onDeleteProject, onSuccess, onCancel }) => {
  const [step, setStep] = useState(1);
  const [projectNo, setProjectNo] = useState(initialData?.projectNo || '');
  const [projectName, setProjectName] = useState(initialData?.projectName || '');
  const [pmName, setPmName] = useState(initialData?.pmName || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [industryType, setIndustryType] = useState(initialData?.industryType || '');
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite>(initialData?.riskAppetite || DEFAULT_RISK_APPETITE);
  const [reviewFrequency, setReviewFrequency] = useState<ReviewFrequency>(initialData?.reviewFrequency || DEFAULT_REVIEW_FREQUENCY);
  const [copySourceProjectNo, setCopySourceProjectNo] = useState('');
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>(initialData?.appliedModifiers || []);

  const isEditing = !!initialData;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const modifiers = PROJECT_MODIFIERS.filter(m => selectedModifiers.includes(m.item));
    onSuccess({ projectNo, projectName, pmName, email, industryType, appliedModifiers: selectedModifiers, riskAppetite, reviewFrequency }, copySourceProjectNo || undefined, modifiers);
  };

  const toggleModifier = (item: string) => {
    setSelectedModifiers(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const categories = Array.from(new Set(PROJECT_MODIFIERS.map(m => m.category)));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto transition-all duration-300">
      <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full ${step === 1 ? 'max-w-md' : 'max-w-2xl'} max-h-[90vh] flex flex-col border border-white/10 dark:border-slate-800 transition-all duration-300`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 transition-colors flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                {isEditing ? 'Edit Project' : (step === 1 ? 'New Project' : 'Project Context')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {step === 1 ? 'Step 1: Basic Information' : 'Step 2: Selection of Weighting Factors'}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 ? (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="p-6 space-y-4 overflow-y-auto flex-1">
            {!isEditing && (
              <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 mb-2">
                <label className="block text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <Copy className="w-3 h-3" /> Data Inheritance (Optional)
                </label>
                <select
                  className="w-full border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition bg-white dark:bg-slate-800 dark:text-slate-100"
                  value={copySourceProjectNo}
                  onChange={(e) => setCopySourceProjectNo(e.target.value)}
                >
                  <option value="">Start from blank project</option>
                  {existingProjects.map(p => (
                    <option key={p.projectNo} value={p.projectNo}>Copy risks from: {p.projectNo}</option>
                  ))}
                </select>
                <p className="text-[10px] text-blue-400 mt-2 italic">
                  * Selecting a project will duplicate all its risk items into your new project.
                </p>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Project No</label>
              <input
                required
                type="text"
                className={`w-full border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition ${isEditing ? 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-slate-800 dark:text-slate-100'}`}
                placeholder="e.g. PJ-2025-001"
                value={projectNo}
                onChange={(e) => setProjectNo(e.target.value)}
                autoFocus={!isEditing}
                readOnly={isEditing}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Project Name</label>
              <input
                required
                type="text"
                className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition bg-white dark:bg-slate-800 dark:text-slate-100"
                placeholder="e.g. Digital Transformation Phase 1"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">PM Name</label>
                <input
                  required
                  type="text"
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition bg-white dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Full Name"
                  value={pmName}
                  onChange={(e) => setPmName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Contact Email</label>
                <input
                  required
                  type="email"
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition bg-white dark:bg-slate-800 dark:text-slate-100"
                  placeholder="pm@pttgcgroup.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Factory className="w-3 h-3" /> Industry Type
                </label>
                <select
                  required
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition bg-white dark:bg-slate-800 dark:text-slate-100"
                  value={industryType}
                  onChange={(e) => setIndustryType(e.target.value)}
                >
                  <option value="">Select Industry Type</option>
                  {INDUSTRY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  🛡️ Risk Appetite / Tolerance Threshold (ISO 31000)
                </label>
                <select
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition bg-white dark:bg-slate-800 dark:text-slate-100"
                  value={riskAppetite}
                  onChange={(e) => setRiskAppetite(e.target.value as RiskAppetite)}
                >
                  <option value="Low">Low — Residual Risk &gt; Low Requires Action Plan (Default)</option>
                  <option value="Significant">Significant — Residual Risk &gt; Significant Requires Action Plan</option>
                  <option value="Critical">Critical — High Risk Tolerance (Only Critical/Extreme Requires Action)</option>
                </select>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                  ISO 31000 Cl.5.4.1: Level above which risks exceed acceptable project tolerance.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  📅 Risk Review Frequency (ISO 31000 Cl.6.6)
                </label>
                <select
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition bg-white dark:bg-slate-800 dark:text-slate-100"
                  value={reviewFrequency}
                  onChange={(e) => setReviewFrequency(e.target.value as ReviewFrequency)}
                >
                  <option value="Monthly">Monthly — Every 30 Days (Default)</option>
                  <option value="Bi-monthly">Bi-monthly — Every 60 Days</option>
                  <option value="Quarterly">Quarterly — Every 90 Days</option>
                  <option value="Semi-Annually">Semi-Annually — Every 180 Days</option>
                  <option value="Annually">Annually — Every 365 Days</option>
                </select>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                  ISO 31000 Cl.6.6: Default monitoring cycle applied to all risks in this project.
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              {isEditing && isAdmin && onDeleteProject && (
                <button
                  type="button"
                  onClick={() => onDeleteProject(projectNo)}
                  className="px-4 py-3 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold text-sm shadow-sm transition-all"
                >
                  Delete Project
                </button>
              )}
              <div className="flex-1 flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold text-sm shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden bg-white dark:bg-slate-900 transition-colors">
            {/* Industry Selection Info */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30 flex items-center gap-3">
              <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <p className="text-xs text-indigo-800 dark:text-indigo-300 font-medium">
                Modifiers will be applied based on the <span className="font-bold underline">{industryType}</span> industry profile.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white dark:bg-slate-900 transition-colors">
              {categories.map(category => (
                <div key={category} className="space-y-3">
                  <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest border-l-2 border-blue-500 pl-2">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PROJECT_MODIFIERS.filter(m => m.category === category).map(mod => {
                      const isActive = selectedModifiers.includes(mod.item);
                      const adj = mod.values[industryType as keyof typeof mod.values] || 0;
                      return (
                        <button
                          key={mod.item}
                          type="button"
                          onClick={() => toggleModifier(mod.item)}
                          className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all group ${isActive
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm'
                            : 'bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                            }`}
                        >
                          <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600'
                            }`}>
                            {isActive && <CheckCircle2 className="w-3 h-3" />}
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${isActive ? 'text-blue-900 dark:text-blue-300' : 'text-gray-700 dark:text-slate-300'}`}>
                              {mod.item}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${adj > 0 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                                adj < 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                                  'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-500'
                                }`}>
                                {adj > 0 ? `+${adj}` : adj} {mod.applyTo}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex gap-3 transition-colors">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 font-bold text-sm flex items-center gap-2 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold text-sm shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {copySourceProjectNo ? 'Clone & Create' : 'Initialize Baseline Risks'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

