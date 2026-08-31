import React, { useState } from 'react';
import {
    Calculator,
    Shield,
    DollarSign,
    Percent,
    PieChart,
    Sparkles,
    CheckCircle2,
    TrendingUp,
    FileCheck,
    Info,
    ChevronDown,
    ChevronUp,
    HelpCircle,
    BookOpen
} from 'lucide-react';
import {
    TorProject,
    TorRiskItem,
    TorTreatmentStrategy,
    TOR_TREATMENT_STRATEGIES,
    getTorRiskLevelColor,
    calculateEMV,
    likelihoodToDefaultProbability,
} from '../../types/torRisk';

interface TreatmentSectionProps {
    project: TorProject;
    onChange: (updated: Partial<TorProject>) => void;
}

export const TreatmentSection: React.FC<TreatmentSectionProps> = ({
    project,
    onChange,
}) => {
    const [showMethodology, setShowMethodology] = useState<boolean>(true);
    const risks = project.risks || [];
    const budget = project.estimatedBudget || 10000000;

    const handleFieldChange = (id: string, field: keyof TorRiskItem, value: any) => {
        const updated = risks.map((r) => {
            if (r.id === id) {
                const next = { ...r, [field]: value };
                if (field === 'probabilityPct' || field === 'estimatedImpactCost') {
                    next.emvValue = calculateEMV(Number(next.probabilityPct) || 0, Number(next.estimatedImpactCost) || 0);
                }
                return next;
            }
            return r;
        });
        onChange({ risks: updated });
    };

    const handleAutoCalculateAllEMV = () => {
        const updated = risks.map((r) => {
            const prob = r.probabilityPct || likelihoodToDefaultProbability(r.likelihood);
            const impactCost = r.estimatedImpactCost || Math.round(budget * (r.impact * 0.02));
            const emv = calculateEMV(prob, impactCost);
            return {
                ...r,
                probabilityPct: prob,
                estimatedImpactCost: impactCost,
                emvValue: emv,
                contingencyRationale: r.contingencyRationale || `คำนวณตาม EMV (${prob}% x ${impactCost.toLocaleString()} บาท)`,
            };
        });
        onChange({ risks: updated });
    };

    // Aggregate Calculations
    const totalImpactCost = risks.reduce((acc, r) => acc + (Number(r.estimatedImpactCost) || 0), 0);
    const totalContingencyEMV = risks.reduce((acc, r) => acc + (Number(r.emvValue) || 0), 0);
    const contingencyPctOfBudget = budget > 0 ? ((totalContingencyEMV / budget) * 100).toFixed(2) : '0.00';

    const avoidCount = risks.filter((r) => r.treatmentStrategy === 'Avoid').length;
    const reduceCount = risks.filter((r) => r.treatmentStrategy === 'Reduce').length;
    const transferCount = risks.filter((r) => r.treatmentStrategy === 'Transfer').length;
    const acceptCount = risks.filter((r) => r.treatmentStrategy === 'Accept').length;

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-blue-600/10 via-emerald-600/10 to-transparent dark:from-blue-900/20 dark:via-emerald-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ขั้นตอนที่ 4: มาตรการจัดการความเสี่ยงและงบสำรอง Contingency Cost Buffer (ISO 31000 & EMV)
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                        เลือกกลยุทธ์ 4T (Avoid, Reduce, Transfer, Accept) พร้อมคำนวณงบประมาณสำรองความเสี่ยงตามหลัก Expected Monetary Value (EMV)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowMethodology(!showMethodology)}
                        className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 text-xs font-bold rounded-xl shadow-xs transition-all"
                    >
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span>วิธีคิดคำนวณ</span>
                        {showMethodology ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        onClick={handleAutoCalculateAllEMV}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex-shrink-0"
                    >
                        <Calculator className="w-4 h-4" />
                        คำนวณ EMV อัตโนมัติทุกรายการ
                    </button>
                </div>
            </div>

            {/* Financial & Strategy Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Impact Cost */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between text-gray-500 dark:text-slate-400 text-xs mb-1">
                        <span>ความเสียหายสูงสุดรวม (Worst-case)</span>
                        <DollarSign className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-slate-100 font-mono">
                        {totalImpactCost.toLocaleString()} <span className="text-xs font-normal text-gray-500">THB</span>
                    </div>
                    <div className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                        รวมมูลค่าความเสียหายทุกรายการหากเกิดขึ้นพร้อมกันทั้งหมด
                    </div>
                </div>

                {/* Total EMV Contingency */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
                    <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs mb-1 font-semibold">
                        <span>งบสำรองความเสี่ยง EMV รวม</span>
                        <Shield className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {totalContingencyEMV.toLocaleString()} <span className="text-xs font-normal text-emerald-700 dark:text-emerald-500">THB</span>
                    </div>
                    <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 font-medium">
                        สูตร: Σ (ความเสียหาย × โอกาสเกิด %)
                    </div>
                </div>

                {/* % of Proposal Budget */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between text-gray-500 dark:text-slate-400 text-xs mb-1">
                        <span>สัดส่วนต่องบประมาณโครงการ</span>
                        <Percent className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                        {contingencyPctOfBudget}%
                    </div>
                    <div className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                        เทียบกับงบประมาณ {budget.toLocaleString()} บาท
                    </div>
                </div>

                {/* 4T Strategy Distribution */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between text-gray-500 dark:text-slate-400 text-xs mb-1">
                        <span>สัดส่วนกลยุทธ์ 4T</span>
                        <PieChart className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold mt-1">
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">A:{avoidCount}</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">R:{reduceCount}</span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">T:{transferCount}</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">AC:{acceptCount}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                        หลีกเลี่ยง | บรรเทา | ถ่ายโอน | ยอมรับ
                    </div>
                </div>
            </div>

            {/* Methodology & Calculation Explanation Box */}
            {showMethodology && (
                <div className="p-5 bg-blue-50/70 dark:bg-slate-800/80 rounded-2xl border border-blue-200 dark:border-slate-700 space-y-3 text-xs animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-blue-200 dark:border-slate-700 pb-2">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <h4 className="font-bold text-gray-900 dark:text-slate-100 text-sm">
                                📘 ที่มาและวิธีคิดคำนวณตัวเลขในตาราง (Calculation Methodology)
                            </h4>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200/60 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                            มาตรฐาน ISO 31000:2018 / PMBOK 7th
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-gray-700 dark:text-slate-300 pt-1 leading-relaxed">
                        {/* Column 1: Estimated Impact Cost */}
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-100 dark:border-slate-800 space-y-1.5">
                            <p className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                <span>1.</span> ความเสียหาย (THB)
                            </p>
                            <p className="text-[11px] text-gray-600 dark:text-slate-400">
                                <b>ที่มา:</b> ประเมินมูลค่าเสียหายสูงสุด (Worst-case) เช่น ค่าปรับสัญญา LDs (0.1%/วัน), ค่าล่วงเวลาเร่งงาน, หรือส่วนต่างราคาวัสดุ
                            </p>
                            <p className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded">
                                ค่าปรับ = งบ × %ปรับ/วัน × วันที่ล่าช้า
                            </p>
                        </div>

                        {/* Column 2: Probability % */}
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-100 dark:border-slate-800 space-y-1.5">
                            <p className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                                <span>2.</span> โอกาสเกิด (%)
                            </p>
                            <p className="text-[11px] text-gray-600 dark:text-slate-400">
                                <b>ที่มา:</b> แปลงจากระดับ Likelihood (1-5) ในขั้นตอนที่ 3:
                            </p>
                            <div className="text-[10px] font-mono text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 p-1.5 rounded space-y-0.5">
                                <div>L1=10% | L2=30% | L3=50%</div>
                                <div>L4=75% | L5=90%</div>
                            </div>
                        </div>

                        {/* Column 3: EMV Formula */}
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-100 dark:border-slate-800 space-y-1.5">
                            <p className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                <span>3.</span> งบสำรอง EMV
                            </p>
                            <p className="text-[11px] text-gray-600 dark:text-slate-400">
                                <b>ที่มา:</b> Expected Monetary Value คือมูลค่าความเสี่ยงเชิงสถิติที่ควรตั้งสำรองจริง
                            </p>
                            <p className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded font-bold">
                                EMV = ความเสียหาย × โอกาส (%)
                            </p>
                        </div>

                        {/* Column 4: Total Buffer & % */}
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-100 dark:border-slate-800 space-y-1.5">
                            <p className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                                <span>4.</span> สัดส่วนต่องบ (%)
                            </p>
                            <p className="text-[11px] text-gray-600 dark:text-slate-400">
                                <b>ที่มา:</b> นำยอดรวม EMV ทุกรายการเทียบกับงบประมาณโครงการเพื่อใช้ตั้งงบ Buffer
                            </p>
                            <p className="text-[10px] font-mono text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded">
                                % Buffer = (Σ EMV / งบโครงการ) × 100
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Treatment Register Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-slate-100 text-sm">
                            ตารางกำหนดมาตรการและงบสำรองความเสี่ยงรายข้อ (Risk Treatment & Contingency Schedule)
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">
                            ระบุมาตรการควบคุมเชิงรุก แผนสำรองฉุกเฉิน และกลยุทธ์การปรับปรุงข้อเสนอ (Proposal Strategy)
                        </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        ทั้งหมด {risks.length} รายการ
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-gray-100/70 dark:bg-slate-800/80 font-bold text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-800">
                            <tr>
                                <th className="p-3 w-16 text-center">รหัส</th>
                                <th className="p-3 w-28">กลยุทธ์ (4T)</th>
                                <th className="p-3 min-w-[220px]">มาตรการควบคุมเชิงรุก (Preventive Controls)</th>
                                <th className="p-3 min-w-[200px]">แผนสำรองฉุกเฉิน (Contingency Plan)</th>
                                <th className="p-3 w-32 text-right">ความเสียหาย (THB)</th>
                                <th className="p-3 w-20 text-center">โอกาส</th>
                                <th className="p-3 w-32 text-right">งบสำรอง EMV</th>
                                <th className="p-3 min-w-[220px]">กลยุทธ์ Proposal (ข้อสงวนสิทธิ์)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                            {risks.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-400 dark:text-slate-500">
                                        ยังไม่มีรายการความเสี่ยง กรุณาเพิ่มรายการในขั้นตอนที่ 2 หรือกด AI Scan TOR
                                    </td>
                                </tr>
                            ) : (
                                risks.map((r) => {
                                    const colors = getTorRiskLevelColor(r.riskLevel);
                                    return (
                                        <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors align-top">
                                            <td className="p-3 text-center">
                                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block">{r.riskNo}</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${colors.badge} mt-1 inline-block`}>
                                                    {r.riskLevel}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <select
                                                    value={r.treatmentStrategy || 'Reduce'}
                                                    onChange={(e) => handleFieldChange(r.id, 'treatmentStrategy', e.target.value as TorTreatmentStrategy)}
                                                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-slate-100 shadow-xs cursor-pointer"
                                                >
                                                    {TOR_TREATMENT_STRATEGIES.map((st) => (
                                                        <option key={st.id} value={st.id}>
                                                            {st.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <span className="text-[10px] text-gray-400 dark:text-slate-500 block mt-1">
                                                    {r.category}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <textarea
                                                    rows={2}
                                                    value={r.controlMeasures || ''}
                                                    onChange={(e) => handleFieldChange(r.id, 'controlMeasures', e.target.value)}
                                                    placeholder="เช่น กำหนดมาตรการควบคุมเชิงป้องกัน..."
                                                    className="w-full p-2 bg-transparent border border-gray-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <textarea
                                                    rows={2}
                                                    value={r.contingencyPlan || ''}
                                                    onChange={(e) => handleFieldChange(r.id, 'contingencyPlan', e.target.value)}
                                                    placeholder="เช่น แผนสำรองกรณีเกิดเหตุ..."
                                                    className="w-full p-2 bg-transparent border border-gray-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="p-3 text-right">
                                                <input
                                                    type="number"
                                                    value={r.estimatedImpactCost || 0}
                                                    onChange={(e) => handleFieldChange(r.id, 'estimatedImpactCost', Number(e.target.value) || 0)}
                                                    className="w-full px-2 py-1 text-right font-mono bg-transparent border border-gray-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                                <span className="text-[10px] text-gray-400 block mt-0.5">THB</span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={r.probabilityPct || 0}
                                                    onChange={(e) => handleFieldChange(r.id, 'probabilityPct', Number(e.target.value) || 0)}
                                                    className="w-16 px-1 py-1 text-center font-mono bg-transparent border border-gray-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                                <span className="text-[10px] text-gray-400 block mt-0.5">%</span>
                                            </td>
                                            <td className="p-3 text-right font-mono">
                                                <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                                    {(r.emvValue || 0).toLocaleString()}
                                                </div>
                                                <span className="text-[9px] text-gray-400 block">THB (EMV)</span>
                                            </td>
                                            <td className="p-3">
                                                <textarea
                                                    rows={2}
                                                    value={r.proposalStrategy || ''}
                                                    onChange={(e) => handleFieldChange(r.id, 'proposalStrategy', e.target.value)}
                                                    placeholder="เช่น ยื่นขอสงวนสิทธิ์ขยายเวลา, ใส่เงื่อนไขในใบเสนอราคา..."
                                                    className="w-full p-2 bg-transparent border border-gray-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        <tfoot className="bg-gray-100 dark:bg-slate-800/90 font-bold border-t-2 border-gray-300 dark:border-slate-700">
                            <tr>
                                <td colSpan={4} className="p-3 text-right text-gray-700 dark:text-slate-300">
                                    รวมงบสำรอง Contingency Cost Buffer ทั้งสิ้น:
                                </td>
                                <td className="p-3 text-right font-mono text-gray-900 dark:text-slate-100">
                                    {totalImpactCost.toLocaleString()} THB
                                </td>
                                <td className="p-3 text-center text-gray-500">-</td>
                                <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400 text-sm font-extrabold">
                                    {totalContingencyEMV.toLocaleString()} THB
                                </td>
                                <td className="p-3 text-xs text-blue-600 dark:text-blue-400 font-bold">
                                    ({contingencyPctOfBudget}% ของงบประมาณ {budget.toLocaleString()} บาท)
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};
