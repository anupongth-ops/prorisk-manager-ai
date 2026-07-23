
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    X, Search, BookOpen, Filter, Sparkles, CheckSquare, Square,
    ChevronDown, AlertTriangle, Loader2, ArrowRight, Info, RotateCcw
} from 'lucide-react';
import {
    RiskItem, RISK_CATEGORIES, getRiskLevel, getRiskLevelColor,
    getRiskScore, formatEffects, normalizeEffects, UserProfile
} from '../types';
import { scoreRiskSimilarity, RiskLibraryItem, ScoredRisk } from '../services/groqService';

interface RiskLibraryModalProps {
    allRisks: RiskItem[];          // full DB — filtered to other projects
    currentProjectNo?: string;     // exclude risks from active project if desired
    existingProjects: { projectNo: string; projectName: string; pmName: string; email: string; industryType?: string }[];
    userProfile: UserProfile | null;
    currentUserEmail: string;
    getNextRiskId: () => string;   // for sequential ID generation
    onImport: (risks: RiskItem[], targetProject: { projectNo: string; projectName: string; pmName: string; email: string; industryType?: string }) => Promise<void>;
    onClose: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
    'Very Low':    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Low':         'bg-yellow-100  text-yellow-700  dark:bg-yellow-900/30  dark:text-yellow-400',
    'Significant': 'bg-orange-100  text-orange-700  dark:bg-orange-900/30  dark:text-orange-400',
    'Critical':    'bg-red-100     text-red-700     dark:bg-red-900/30     dark:text-red-400',
    'Extreme':     'bg-red-900     text-white        dark:bg-red-950        dark:text-red-100',
};

const ScoreBadge = ({ score }: { score: number }) => {
    const color =
        score >= 80 ? 'bg-emerald-500' :
        score >= 60 ? 'bg-blue-500' :
        score >= 40 ? 'bg-amber-400' : 'bg-gray-400';
    return (
        <div className="flex items-center gap-1 flex-shrink-0">
            <div className={`w-1.5 h-8 rounded-full ${color}`} style={{ height: `${Math.max(8, score * 0.32)}px`, minHeight: '4px', maxHeight: '32px' }} />
            <span className={`text-[10px] font-bold ${score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : score >= 60 ? 'text-blue-600 dark:text-blue-400' : score >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
                {score}
            </span>
        </div>
    );
};

export const RiskLibraryModal: React.FC<RiskLibraryModalProps> = ({
    allRisks,
    existingProjects,
    userProfile,
    currentUserEmail,
    getNextRiskId,
    onImport,
    onClose,
}) => {
    // ── Filters ──────────────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery]       = useState('');
    const [filterProject, setFilterProject]   = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterLevel, setFilterLevel]       = useState('All');
    const [filterStatus, setFilterStatus]     = useState('All');

    // ── Selection ─────────────────────────────────────────────────────────────
    const [selected, setSelected] = useState<Set<string>>(new Set());

    // ── AI Scoring ───────────────────────────────────────────────────────────
    const [aiScores, setAiScores]             = useState<Map<string, ScoredRisk>>(new Map());
    const [aiLoading, setAiLoading]           = useState(false);
    const [aiContext, setAiContext]            = useState('');  // target project for AI
    const [showAiPanel, setShowAiPanel]       = useState(false);
    const [sortByAi, setSortByAi]             = useState(false);

    // ── Import dialog ─────────────────────────────────────────────────────────
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [targetProjectNo, setTargetProjectNo]   = useState('');
    const [importing, setImporting]               = useState(false);

    // ── Derived data ──────────────────────────────────────────────────────────
    const allProjects = useMemo(() =>
        Array.from(new Set(allRisks.map(r => r.projectNo))).sort(),
    [allRisks]);

    const filtered = useMemo(() => {
        let r = allRisks;
        if (filterProject !== 'All') r = r.filter(x => x.projectNo === filterProject);
        if (filterCategory !== 'All') r = r.filter(x => x.riskCategory === filterCategory);
        if (filterStatus !== 'All') r = r.filter(x => x.status === filterStatus);
        if (filterLevel !== 'All') {
            r = r.filter(x => {
                const lvl = getRiskLevel(x.initialRisk.impact, x.initialRisk.likelihood);
                return lvl === filterLevel;
            });
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            r = r.filter(x =>
                x.description.toLowerCase().includes(q) ||
                x.riskCategory.toLowerCase().includes(q) ||
                x.owner.toLowerCase().includes(q) ||
                x.projectName.toLowerCase().includes(q) ||
                x.actionToControl.toLowerCase().includes(q)
            );
        }
        return r;
    }, [allRisks, filterProject, filterCategory, filterLevel, filterStatus, searchQuery]);

    const sorted = useMemo(() => {
        if (!sortByAi || aiScores.size === 0) return filtered;
        return [...filtered].sort((a, b) => {
            const sa = aiScores.get(a.id)?.score ?? 50;
            const sb = aiScores.get(b.id)?.score ?? 50;
            return sb - sa;
        });
    }, [filtered, sortByAi, aiScores]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const toggleSelect = useCallback((id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const selectAll = useCallback(() => {
        setSelected(new Set(sorted.map(r => r.id)));
    }, [sorted]);

    const clearAll = useCallback(() => setSelected(new Set()), []);

    // ── AI Score trigger ──────────────────────────────────────────────────────
    const runAiScoring = useCallback(async () => {
        if (!aiContext) return;
        const targetProj = existingProjects.find(p => p.projectNo === aiContext);
        if (!targetProj) return;

        setAiLoading(true);
        try {
            const batchItems: RiskLibraryItem[] = filtered.slice(0, 50).map(r => ({
                id: r.id,
                riskId: r.riskId,
                projectNo: r.projectNo,
                projectName: r.projectName,
                industryType: r.industryType,
                riskCategory: r.riskCategory,
                description: r.description,
                actionToControl: r.actionToControl,
                initialScore: getRiskScore(r.initialRisk.impact, r.initialRisk.likelihood),
                residualScore: getRiskScore(r.residualRisk.impact, r.residualRisk.likelihood),
            }));

            const existingCategories = allRisks
                .filter(r => r.projectNo === aiContext)
                .map(r => r.riskCategory);

            const scores = await scoreRiskSimilarity(
                {
                    industryType: targetProj.industryType || 'ไม่ระบุ',
                    projectName: targetProj.projectName,
                    categories: existingCategories,
                },
                batchItems
            );

            const map = new Map<string, ScoredRisk>();
            scores.forEach(s => map.set(s.id, s));
            setAiScores(map);
            setSortByAi(true);
        } finally {
            setAiLoading(false);
        }
    }, [aiContext, filtered, allRisks, existingProjects]);

    // ── Import handler ────────────────────────────────────────────────────────
    const handleImport = useCallback(async () => {
        if (!targetProjectNo || selected.size === 0) return;
        const targetProj = existingProjects.find(p => p.projectNo === targetProjectNo);
        if (!targetProj) return;

        setImporting(true);
        try {
            const risksToImport = allRisks.filter(r => selected.has(r.id));
            await onImport(risksToImport, targetProj);
            onClose();
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการ import กรุณาลองใหม่อีกครั้ง');
            console.error(err);
        } finally {
            setImporting(false);
        }
    }, [targetProjectNo, selected, allRisks, existingProjects, onImport, onClose]);

    const resetFilters = () => {
        setSearchQuery('');
        setFilterProject('All');
        setFilterCategory('All');
        setFilterLevel('All');
        setFilterStatus('All');
    };

    const levelOptions = ['All', 'Very Low', 'Low', 'Significant', 'Critical', 'Extreme'];
    const hasFilters = searchQuery || filterProject !== 'All' || filterCategory !== 'All' || filterLevel !== 'All' || filterStatus !== 'All';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col border border-gray-100 dark:border-slate-800 overflow-hidden">

                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-blue-600 to-indigo-600 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Risk Library</h2>
                            <p className="text-blue-100 text-xs">คลังความเสี่ยงจากโครงการที่ผ่านมา — {allRisks.length.toLocaleString()} รายการ</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ── AI Scoring Panel ───────────────────────────────────────── */}
                <div className="px-6 py-3 bg-indigo-50 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/30 flex-shrink-0">
                    <button
                        onClick={() => setShowAiPanel(p => !p)}
                        className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 transition-colors"
                    >
                        <Sparkles className="w-4 h-4" />
                        AI Similarity Scoring
                        <ChevronDown className={`w-4 h-4 transition-transform ${showAiPanel ? 'rotate-180' : ''}`} />
                    </button>

                    {showAiPanel && (
                        <div className="mt-3 flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1 block">
                                    เลือกโครงการใหม่ที่จะนำ Risk ไปใช้
                                </label>
                                <select
                                    value={aiContext}
                                    onChange={e => setAiContext(e.target.value)}
                                    className="w-full border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-400 outline-none"
                                >
                                    <option value="">-- เลือกโครงการ --</option>
                                    {existingProjects.map(p => (
                                        <option key={p.projectNo} value={p.projectNo}>
                                            {p.projectNo} — {p.projectName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={runAiScoring}
                                disabled={!aiContext || aiLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex-shrink-0"
                            >
                                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {aiLoading ? 'กำลังประเมิน...' : 'วิเคราะห์ด้วย AI'}
                            </button>
                            {aiScores.size > 0 && (
                                <button
                                    onClick={() => { setSortByAi(p => !p); }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all flex-shrink-0 ${sortByAi ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700'}`}
                                >
                                    {sortByAi ? '✓ เรียงตาม AI' : 'เรียงตาม AI'}
                                </button>
                            )}
                        </div>
                    )}

                    {aiScores.size > 0 && (
                        <p className="mt-2 text-[11px] text-indigo-500 dark:text-indigo-400">
                            ✓ AI ประเมินแล้ว {aiScores.size} รายการ — แสดงคะแนน relevance (0–100) ที่แถบสี
                        </p>
                    )}
                </div>

                {/* ── Filters ────────────────────────────────────────────────── */}
                <div className="px-6 py-3 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row gap-2">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ค้นหา description, category, owner..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 outline-none"
                            />
                        </div>

                        {/* Project filter */}
                        <select
                            value={filterProject}
                            onChange={e => setFilterProject(e.target.value)}
                            className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-400 outline-none"
                        >
                            <option value="All">ทุกโครงการ</option>
                            {allProjects.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>

                        {/* Category */}
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                            className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-400 outline-none"
                        >
                            <option value="All">ทุก Category</option>
                            {RISK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        {/* Level */}
                        <select
                            value={filterLevel}
                            onChange={e => setFilterLevel(e.target.value)}
                            className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-400 outline-none"
                        >
                            {levelOptions.map(l => <option key={l} value={l}>{l === 'All' ? 'ทุก Level' : l}</option>)}
                        </select>

                        {/* Status */}
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-400 outline-none"
                        >
                            <option value="All">ทุก Status</option>
                            <option value="Closed">Closed</option>
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                        </select>

                        {hasFilters && (
                            <button onClick={resetFilters} title="Reset filters" className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Select all / count row */}
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3">
                            <button onClick={selectAll} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                เลือกทั้งหมด ({sorted.length})
                            </button>
                            <span className="text-gray-300 dark:text-slate-700">|</span>
                            <button onClick={clearAll} className="text-xs text-gray-500 dark:text-slate-500 hover:underline">
                                ล้างการเลือก
                            </button>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-slate-500">
                            แสดง {sorted.length} จาก {allRisks.length} รายการ
                            {selected.size > 0 && <span className="ml-2 font-bold text-blue-600 dark:text-blue-400">• เลือกแล้ว {selected.size} รายการ</span>}
                        </span>
                    </div>
                </div>

                {/* ── Risk List ───────────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto">
                    {sorted.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-slate-600">
                            <BookOpen className="w-10 h-10 mb-2" />
                            <p className="text-sm">ไม่พบรายการที่ตรงกับเงื่อนไข</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50 dark:divide-slate-800">
                            {sorted.map(risk => {
                                const level = getRiskLevel(risk.initialRisk.impact, risk.initialRisk.likelihood);
                                const levelColor = LEVEL_COLORS[level] || 'bg-gray-100 text-gray-700';
                                const isSelected = selected.has(risk.id);
                                const aiScore = aiScores.get(risk.id);

                                return (
                                    <div
                                        key={risk.id}
                                        onClick={() => toggleSelect(risk.id)}
                                        className={`flex items-start gap-3 px-6 py-3 cursor-pointer transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/10 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                    >
                                        {/* Checkbox */}
                                        <div className="flex-shrink-0 mt-0.5">
                                            {isSelected
                                                ? <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                : <Square className="w-5 h-5 text-gray-300 dark:text-slate-600" />
                                            }
                                        </div>

                                        {/* AI score bar */}
                                        {aiScores.size > 0 && aiScore && (
                                            <div className="flex-shrink-0 mt-1" title={`AI Score: ${aiScore.score} — ${aiScore.reason}`}>
                                                <ScoreBadge score={aiScore.score} />
                                            </div>
                                        )}

                                        {/* Main content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-slate-500">{risk.riskId}</span>
                                                <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${levelColor}`}>{level}</span>
                                                <span className="text-[10px] text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{risk.riskCategory}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${risk.status === 'Closed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : risk.status === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                    {risk.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-800 dark:text-slate-200 font-medium mt-1 line-clamp-2">{risk.description}</p>
                                            {risk.actionToControl && (
                                                <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5 line-clamp-1">
                                                    ↳ {risk.actionToControl}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">{risk.projectNo}</span>
                                                <span className="text-[10px] text-gray-400 dark:text-slate-600">{risk.projectName}</span>
                                                {aiScore && aiScores.size > 0 && (
                                                    <span className="text-[10px] text-indigo-500 dark:text-indigo-400 italic">{aiScore.reason}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Score numbers */}
                                        <div className="flex-shrink-0 text-right hidden sm:block">
                                            <div className="text-[10px] text-gray-400 dark:text-slate-600">Initial</div>
                                            <div className="text-sm font-bold text-gray-700 dark:text-slate-300">
                                                {risk.initialRisk.impact}×{risk.initialRisk.likelihood}
                                            </div>
                                            <div className="text-[10px] text-gray-400 dark:text-slate-600 mt-0.5">Residual</div>
                                            <div className="text-xs font-semibold text-gray-500 dark:text-slate-500">
                                                {risk.residualRisk.impact}×{risk.residualRisk.likelihood}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Footer ─────────────────────────────────────────────────── */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex-shrink-0">
                    {selected.size === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-500">
                            <Info className="w-4 h-4" />
                            เลือก risk ที่ต้องการจากรายการด้านบน แล้วกดปุ่ม Import
                        </div>
                    ) : !showImportDialog ? (
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                เลือกแล้ว {selected.size} รายการ
                            </span>
                            <div className="flex gap-2">
                                <button onClick={clearAll} className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    ยกเลิกการเลือก
                                </button>
                                <button
                                    onClick={() => setShowImportDialog(true)}
                                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition-all"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                    Import {selected.size} รายการ
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                                เลือกโครงการปลายทางสำหรับการ Import {selected.size} รายการ:
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <select
                                    value={targetProjectNo}
                                    onChange={e => setTargetProjectNo(e.target.value)}
                                    className="flex-1 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-400 outline-none"
                                >
                                    <option value="">-- เลือกโครงการปลายทาง --</option>
                                    {existingProjects.map(p => (
                                        <option key={p.projectNo} value={p.projectNo}>
                                            {p.projectNo} — {p.projectName}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowImportDialog(false)}
                                        className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        ย้อนกลับ
                                    </button>
                                    <button
                                        onClick={handleImport}
                                        disabled={!targetProjectNo || importing}
                                        className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-md transition-all"
                                    >
                                        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                        {importing ? 'กำลัง Import...' : `ยืนยัน Import`}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>Risk ที่ import จะถูกรีเซ็ต: Status → Open, วันที่ → วันนี้, History → เริ่มใหม่ และได้รับ Risk ID ใหม่ต่อจากฐานข้อมูล</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
