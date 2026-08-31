import React, { useState } from 'react';
import {
    ShieldAlert,
    Plus,
    Trash2,
    Search,
    Filter,
    Tag,
    FileCode,
    Sparkles,
    Copy
} from 'lucide-react';
import {
    TorProject,
    TorRiskItem,
    TorRiskCategory,
    TOR_RISK_CATEGORIES,
    getTorRiskScore,
    getTorRiskLevel,
    calculateEMV,
    likelihoodToDefaultProbability,
} from '../../types/torRisk';

interface RiskIdentificationSectionProps {
    project: TorProject;
    onChange: (updated: Partial<TorProject>) => void;
    onOpenAiModal: () => void;
}

export const RiskIdentificationSection: React.FC<RiskIdentificationSectionProps> = ({
    project,
    onChange,
    onOpenAiModal,
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const risks = project.risks || [];

    const handleRiskChange = (id: string, field: keyof TorRiskItem, value: any) => {
        const updated = risks.map((r) => {
            if (r.id === id) {
                const next = { ...r, [field]: value };
                if (field === 'likelihood' || field === 'impact') {
                    next.riskScore = getTorRiskScore(next.likelihood, next.impact);
                    next.riskLevel = getTorRiskLevel(next.riskScore);
                    if (field === 'likelihood') {
                        next.probabilityPct = likelihoodToDefaultProbability(next.likelihood);
                    }
                    next.emvValue = calculateEMV(next.probabilityPct, next.estimatedImpactCost);
                }
                return next;
            }
            return r;
        });
        onChange({ risks: updated });
    };

    const handleAddRisk = () => {
        const nextIdx = risks.length + 1;
        const newRisk: TorRiskItem = {
            id: `tr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            riskNo: `TR-${String(nextIdx).padStart(3, '0')}`,
            category: 'Operational',
            cause: '',
            riskEvent: '',
            consequence: '',
            torClauseRef: 'TOR ข้อ ',
            likelihood: 3,
            impact: 3,
            riskScore: 9,
            riskLevel: 'Medium',
            treatmentStrategy: 'Reduce',
            controlMeasures: '',
            contingencyPlan: '',
            estimatedImpactCost: Math.round((project.estimatedBudget || 10000000) * 0.05),
            probabilityPct: 50,
            emvValue: Math.round((project.estimatedBudget || 10000000) * 0.025),
            contingencyRationale: 'สำรองตามมาตรฐาน EMV 50%',
            proposalStrategy: '',
            riskOwner: 'Project Manager',
            timeline: 'Proposal',
            kpiIndicator: 'การส่งมอบตรงตามกำหนด',
            status: 'Open',
        };
        onChange({ risks: [...risks, newRisk] });
    };

    const handleDuplicateRisk = (risk: TorRiskItem) => {
        const nextIdx = risks.length + 1;
        const dup: TorRiskItem = {
            ...risk,
            id: `tr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            riskNo: `TR-${String(nextIdx).padStart(3, '0')}`,
            riskEvent: `${risk.riskEvent} (สำเนา)`,
        };
        onChange({ risks: [...risks, dup] });
    };

    const handleRemoveRisk = (id: string) => {
        if (window.confirm('คุณต้องการลบรายการความเสี่ยงนี้ใช่หรือไม่?')) {
            onChange({ risks: risks.filter((r) => r.id !== id) });
        }
    };

    const filteredRisks = risks.filter((r) => {
        const matchCat = selectedCategory === 'ALL' || r.category === selectedCategory;
        const query = searchQuery.trim().toLowerCase();
        const matchSearch =
            !query ||
            r.riskNo.toLowerCase().includes(query) ||
            r.riskEvent.toLowerCase().includes(query) ||
            r.cause.toLowerCase().includes(query) ||
            r.consequence.toLowerCase().includes(query) ||
            r.torClauseRef.toLowerCase().includes(query);
        return matchCat && matchSearch;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-transparent dark:from-blue-900/20 dark:via-purple-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        ขั้นตอนที่ 2: การระบุความเสี่ยงและการเชื่อมโยงข้อกำหนด TOR (Risk Identification & Traceability)
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                        ระบุสาเหตุรากเหง้า (Cause) ➔ เหตุการณ์ความเสี่ยง (Event) ➔ ผลกระทบ (Consequence) และอ้างอิงข้อกำหนด TOR โดยตรงเพื่อให้ตรวจสอบย้อนกลับได้
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={onOpenAiModal}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                    >
                        <Sparkles className="w-4 h-4" />
                        AI สแกน TOR
                    </button>
                    <button
                        onClick={handleAddRisk}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        เพิ่มความเสี่ยงใหม่
                    </button>
                </div>
            </div>

            {/* Category Filter Pills & Search */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                        <button
                            onClick={() => setSelectedCategory('ALL')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                selectedCategory === 'ALL'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            ทั้งหมด ({risks.length})
                        </button>
                        {TOR_RISK_CATEGORIES.map((cat) => {
                            const count = risks.filter((r) => r.category === cat.key).length;
                            return (
                                <button
                                    key={cat.key}
                                    onClick={() => setSelectedCategory(cat.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                        selectedCategory === cat.key
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <span>{cat.labelEn.split(' ')[0]}</span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative w-full md:w-64 flex-shrink-0">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ค้นหาข้อ TOR / เหตุการณ์..."
                            className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Editable Risk Register Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-100 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300 font-bold border-b border-gray-200 dark:border-slate-800">
                            <tr>
                                <th className="p-3 w-20 text-center">รหัส</th>
                                <th className="p-3 w-40">หมวดหมู่ความเสี่ยง</th>
                                <th className="p-3 min-w-[180px]">สาเหตุรากเหง้า (Root Cause)</th>
                                <th className="p-3 min-w-[220px]">เหตุการณ์ความเสี่ยง (Risk Event)</th>
                                <th className="p-3 min-w-[180px]">ผลกระทบ (Consequence)</th>
                                <th className="p-3 w-48">ข้อกำหนด TOR อ้างอิง</th>
                                <th className="p-3 w-24 text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {filteredRisks.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-10 text-center text-gray-400 dark:text-slate-500">
                                        {risks.length === 0
                                            ? 'ยังไม่มีรายการความเสี่ยงในโครงการ กดปุ่ม "เพิ่มความเสี่ยงใหม่" หรือใช้ปุ่ม "AI สแกน TOR"'
                                            : 'ไม่พบรายการความเสี่ยงที่ตรงกับตัวกรอง'}
                                    </td>
                                </tr>
                            ) : (
                                filteredRisks.map((risk) => (
                                    <tr key={risk.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                        {/* Risk No */}
                                        <td className="p-2.5 text-center font-bold text-blue-600 dark:text-blue-400">
                                            <input
                                                type="text"
                                                value={risk.riskNo}
                                                onChange={(e) => handleRiskChange(risk.id, 'riskNo', e.target.value)}
                                                className="w-16 px-1.5 py-1 text-center font-mono font-bold text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-blue-600 dark:text-blue-400 outline-none"
                                            />
                                        </td>

                                        {/* Category */}
                                        <td className="p-2.5">
                                            <select
                                                value={risk.category}
                                                onChange={(e) => handleRiskChange(risk.id, 'category', e.target.value as TorRiskCategory)}
                                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-slate-100 outline-none"
                                            >
                                                {TOR_RISK_CATEGORIES.map((cat) => (
                                                    <option key={cat.key} value={cat.key}>
                                                        {cat.labelEn}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>

                                        {/* Cause */}
                                        <td className="p-2.5">
                                            <textarea
                                                rows={2}
                                                value={risk.cause}
                                                onChange={(e) => handleRiskChange(risk.id, 'cause', e.target.value)}
                                                placeholder="เนื่องจาก..."
                                                className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs text-gray-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                                            />
                                        </td>

                                        {/* Risk Event */}
                                        <td className="p-2.5">
                                            <textarea
                                                rows={2}
                                                value={risk.riskEvent}
                                                onChange={(e) => handleRiskChange(risk.id, 'riskEvent', e.target.value)}
                                                placeholder="มีความเสี่ยงที่จะ..."
                                                className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs text-gray-900 dark:text-slate-100 font-medium outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                                            />
                                        </td>

                                        {/* Consequence */}
                                        <td className="p-2.5">
                                            <textarea
                                                rows={2}
                                                value={risk.consequence}
                                                onChange={(e) => handleRiskChange(risk.id, 'consequence', e.target.value)}
                                                placeholder="ส่งผลให้เกิด..."
                                                className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs text-gray-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                                            />
                                        </td>

                                        {/* TOR Clause Ref */}
                                        <td className="p-2.5">
                                            <div className="flex items-center gap-1">
                                                <FileCode className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                <input
                                                    type="text"
                                                    value={risk.torClauseRef || ''}
                                                    onChange={(e) => handleRiskChange(risk.id, 'torClauseRef', e.target.value)}
                                                    placeholder="เช่น ข้อ 4.2 บทปรับล่าช้า"
                                                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs text-purple-700 dark:text-purple-300 font-semibold outline-none focus:ring-1 focus:ring-purple-500"
                                                />
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="p-2.5 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleDuplicateRisk(risk)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
                                                    title="คัดลอกรายการ (Duplicate)"
                                                >
                                                    <Copy className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveRisk(risk.id)}
                                                    className="p-1.5 text-gray-400 hover:text-rose-600 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
                                                    title="ลบรายการ"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer Summary */}
                <div className="p-3 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs text-gray-600 dark:text-slate-400">
                    <span>แสดง {filteredRisks.length} จากทั้งหมด {risks.length} รายการ</span>
                    <button
                        onClick={handleAddRisk}
                        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        เพิ่มความเสี่ยงแถวใหม่
                    </button>
                </div>
            </div>
        </div>
    );
};
