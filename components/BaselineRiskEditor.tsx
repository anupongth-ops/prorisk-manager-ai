
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, RefreshCw, AlertTriangle, CheckCircle, Info, ChevronUp, ChevronDown } from 'lucide-react';
import { fetchBaselineRisks, saveBaselineRisksBatch } from '../services/firebaseService';
import { RISK_CATEGORIES } from '../types';

export const BaselineRiskEditor: React.FC = () => {
    const [risks, setRisks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadRisks();
    }, []);

    const loadRisks = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchBaselineRisks();
            setRisks(data);
        } catch (err) {
            setError("Failed to load baseline risks.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddRisk = () => {
        const newRisk = {
            discipline: RISK_CATEGORIES[0],
            factor: 'New Risk Factor',
            baseImpact: 3,
            baseLikelihood: 3
        };
        setRisks([...risks, newRisk]);
    };

    const handleRemoveRisk = (index: number) => {
        setRisks(risks.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: string, value: any) => {
        const updated = [...risks];
        updated[index] = { ...updated[index], [field]: value };
        setRisks(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            await saveBaselineRisksBatch(risks);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500 text-sm font-medium">Loading baseline definitions...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                        Baseline Risk Config
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold">Total: {risks.length}</span>
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-1 italic">
                        These are the default risks generated for every new project.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleAddRisk}
                        className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all shadow-sm"
                    >
                        <Plus size={14} /> Add New Factor
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-md"
                    >
                        {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                        Save Changes
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle size={18} />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle size={18} />
                    <span className="text-sm font-medium">Baseline risks updated successfully for all future projects.</span>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto transition-all">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                    <thead className="bg-gray-50 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Discipline</th>
                            <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Risk Factor</th>
                            <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Base Impact</th>
                            <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Base Likelihood</th>
                            <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Remove</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                        {risks.map((risk, index) => (
                            <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-2">
                                    <select
                                        className="w-full bg-transparent border-none text-xs font-medium text-gray-700 dark:text-slate-200 outline-none p-1 focus:ring-1 focus:ring-blue-500 rounded cursor-pointer"
                                        value={risk.discipline}
                                        onChange={(e) => handleChange(index, 'discipline', e.target.value)}
                                    >
                                        {RISK_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        className="w-full bg-transparent border-none text-xs font-medium text-gray-700 dark:text-slate-200 outline-none p-1 focus:ring-1 focus:ring-blue-500 rounded"
                                        value={risk.factor}
                                        onChange={(e) => handleChange(index, 'factor', e.target.value)}
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handleChange(index, 'baseImpact', Math.max(1, risk.baseImpact - 1))}
                                            className="text-gray-400 hover:text-blue-500 p-0.5 rounded transition"
                                        >
                                            <ChevronDown size={14} />
                                        </button>
                                        <span className={`w-8 text-center text-sm font-black ${risk.baseImpact >= 4 ? 'text-red-500' : risk.baseImpact >= 3 ? 'text-orange-500' : 'text-emerald-500'}`}>
                                            {risk.baseImpact}
                                        </span>
                                        <button
                                            onClick={() => handleChange(index, 'baseImpact', Math.min(5, risk.baseImpact + 1))}
                                            className="text-gray-400 hover:text-blue-500 p-0.5 rounded transition"
                                        >
                                            <ChevronUp size={14} />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handleChange(index, 'baseLikelihood', Math.max(1, risk.baseLikelihood - 1))}
                                            className="text-gray-400 hover:text-blue-500 p-0.5 rounded transition"
                                        >
                                            <ChevronDown size={14} />
                                        </button>
                                        <span className={`w-8 text-center text-sm font-black ${risk.baseLikelihood >= 4 ? 'text-red-500' : risk.baseLikelihood >= 3 ? 'text-orange-500' : 'text-emerald-500'}`}>
                                            {risk.baseLikelihood}
                                        </span>
                                        <button
                                            onClick={() => handleChange(index, 'baseLikelihood', Math.min(5, risk.baseLikelihood + 1))}
                                            className="text-gray-400 hover:text-blue-500 p-0.5 rounded transition"
                                        >
                                            <ChevronUp size={14} />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-right">
                                    <button
                                        onClick={() => handleRemoveRisk(index)}
                                        className="text-gray-300 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/10 transition"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-start gap-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 p-4 rounded-xl transition-colors">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                    <p className="font-bold mb-1">How it works:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>These baseline risks are automatically added when a user selects "Generate Baseline" during project creation.</li>
                        <li>Modified values will apply to <strong>future</strong> projects and will not retroactively affect existing risks.</li>
                        <li>Adjusting the Base Impact/Likelihood here sets the "starting point" which is then further adjusted by project modifiers (Location, Technology, etc.) at project setup.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
