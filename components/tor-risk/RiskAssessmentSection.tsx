import React, { useState } from 'react';
import {
    Activity,
    Grid,
    AlertCircle,
    Info,
    CheckCircle2,
    SlidersHorizontal,
    RotateCcw
} from 'lucide-react';
import {
    TorProject,
    TorRiskItem,
    getTorRiskScore,
    getTorRiskLevel,
    getTorRiskLevelColor,
    calculateEMV,
    likelihoodToDefaultProbability,
} from '../../types/torRisk';

interface RiskAssessmentSectionProps {
    project: TorProject;
    onChange: (updated: Partial<TorProject>) => void;
}

const LIKELIHOOD_LABELS: Record<number, string> = {
    1: '1 - Rare (น้อยมาก <10%)',
    2: '2 - Unlikely (น้อย 10-30%)',
    3: '3 - Possible (ปานกลาง 30-60%)',
    4: '4 - Likely (สูง 60-85%)',
    5: '5 - Almost Certain (แน่นอน >85%)',
};

const IMPACT_LABELS: Record<number, string> = {
    1: '1 - Negligible (เล็กน้อย <1% งบ)',
    2: '2 - Minor (น้อย 1-3% งบ)',
    3: '3 - Moderate (ปานกลาง 3-7% งบ)',
    4: '4 - Major (สูง 7-15% งบ / บทปรับ)',
    5: '5 - Severe (รุนแรงมาก >15% งบ / สัญญายกเลิก)',
};

// 5x5 Matrix definitions: Y (Impact 5 to 1), X (Likelihood 1 to 5)
const MATRIX_ROWS = [5, 4, 3, 2, 1];
const MATRIX_COLS = [1, 2, 3, 4, 5];

export const RiskAssessmentSection: React.FC<RiskAssessmentSectionProps> = ({
    project,
    onChange,
}) => {
    const [selectedCell, setSelectedCell] = useState<{ impact: number; likelihood: number } | null>(null);
    const [levelFilter, setLevelFilter] = useState<string>('ALL');

    const risks = project.risks || [];

    const handleScoreChange = (id: string, field: 'likelihood' | 'impact', val: number) => {
        const updated = risks.map((r) => {
            if (r.id === id) {
                const nextLikelihood = field === 'likelihood' ? val : r.likelihood;
                const nextImpact = field === 'impact' ? val : r.impact;
                const nextScore = getTorRiskScore(nextLikelihood, nextImpact);
                const nextLevel = getTorRiskLevel(nextScore);
                const nextProb = field === 'likelihood' ? likelihoodToDefaultProbability(nextLikelihood) : r.probabilityPct;
                const nextEmv = calculateEMV(nextProb, r.estimatedImpactCost);

                return {
                    ...r,
                    [field]: val,
                    riskScore: nextScore,
                    riskLevel: nextLevel,
                    probabilityPct: nextProb,
                    emvValue: nextEmv,
                };
            }
            return r;
        });
        onChange({ risks: updated });
    };

    // Calculate count for each cell
    const getCellCount = (impact: number, likelihood: number) => {
        return risks.filter((r) => r.impact === impact && r.likelihood === likelihood).length;
    };

    // Critical, High, Medium, Low Counts
    const criticalCount = risks.filter((r) => r.riskLevel === 'Critical').length;
    const highCount = risks.filter((r) => r.riskLevel === 'High').length;
    const mediumCount = risks.filter((r) => r.riskLevel === 'Medium').length;
    const lowCount = risks.filter((r) => r.riskLevel === 'Low').length;

    const filteredRisks = risks.filter((r) => {
        if (selectedCell) {
            return r.impact === selectedCell.impact && r.likelihood === selectedCell.likelihood;
        }
        if (levelFilter !== 'ALL') {
            return r.riskLevel === levelFilter;
        }
        return true;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-blue-600/10 via-amber-600/10 to-transparent dark:from-blue-900/20 dark:via-amber-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        ขั้นตอนที่ 3: การประเมินและจัดลำดับความเสี่ยง (Risk Assessment & 5x5 Matrix)
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                        ประเมินคะแนนเชิงปริมาณ (Likelihood: 1–5 x Impact: 1–5) ตามกรอบ ISO 31000 และจำแนกตามระดับความรุนแรง 4 ระดับ
                    </p>
                </div>

                {/* Severity Summary Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => { setLevelFilter(levelFilter === 'Critical' ? 'ALL' : 'Critical'); setSelectedCell(null); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            levelFilter === 'Critical' ? 'ring-2 ring-red-500 shadow-md' : ''
                        } bg-red-500/10 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800`}
                    >
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Critical: {criticalCount}
                    </button>
                    <button
                        onClick={() => { setLevelFilter(levelFilter === 'High' ? 'ALL' : 'High'); setSelectedCell(null); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            levelFilter === 'High' ? 'ring-2 ring-orange-500 shadow-md' : ''
                        } bg-orange-500/10 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800`}
                    >
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        High: {highCount}
                    </button>
                    <button
                        onClick={() => { setLevelFilter(levelFilter === 'Medium' ? 'ALL' : 'Medium'); setSelectedCell(null); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            levelFilter === 'Medium' ? 'ring-2 ring-amber-500 shadow-md' : ''
                        } bg-amber-500/10 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800`}
                    >
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Medium: {mediumCount}
                    </button>
                    <button
                        onClick={() => { setLevelFilter(levelFilter === 'Low' ? 'ALL' : 'Low'); setSelectedCell(null); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            levelFilter === 'Low' ? 'ring-2 ring-emerald-500 shadow-md' : ''
                        } bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800`}
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Low: {lowCount}
                    </button>
                </div>
            </div>

            {/* Main Content Layout: 5x5 Matrix + Assessment Table */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* 5x5 Heat Map Card */}
                <div className="xl:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                            <Grid className="w-4 h-4 text-blue-500" />
                            5x5 ISO 31000 Risk Heat Map
                        </h4>
                        {selectedCell && (
                            <button
                                onClick={() => setSelectedCell(null)}
                                className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                            >
                                <RotateCcw className="w-3 h-3" />
                                ล้างการเลือก
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                        คลิกที่ช่องพิกัดตาราง เพื่อกรองดูเฉพาะความเสี่ยงในระดับนั้น
                    </p>

                    {/* Matrix Grid Box */}
                    <div className="relative pt-2 pb-1">
                        {/* Y-Axis Label */}
                        <div className="absolute -left-6 top-1/2 -rotate-90 -translate-y-1/2 text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-wider">
                            IMPACT (ผลกระทบ) ➔
                        </div>

                        <div className="space-y-1.5 ml-4">
                            {MATRIX_ROWS.map((imp) => (
                                <div key={`row-${imp}`} className="flex items-center gap-1.5">
                                    <div className="w-6 text-right text-[11px] font-bold text-gray-400 dark:text-slate-500 flex-shrink-0">
                                        {imp}
                                    </div>
                                    <div className="grid grid-cols-5 gap-1.5 flex-1">
                                        {MATRIX_COLS.map((lik) => {
                                            const score = imp * lik;
                                            const level = getTorRiskLevel(score);
                                            const colors = getTorRiskLevelColor(level);
                                            const count = getCellCount(imp, lik);
                                            const isSelected = selectedCell?.impact === imp && selectedCell?.likelihood === lik;

                                            return (
                                                <button
                                                    key={`cell-${imp}-${lik}`}
                                                    onClick={() => setSelectedCell(isSelected ? null : { impact: imp, likelihood: lik })}
                                                    className={`h-11 rounded-xl transition-all flex flex-col items-center justify-center relative ${colors.bg} ${colors.border} border ${
                                                        isSelected
                                                            ? 'ring-2 ring-blue-500 ring-offset-2 scale-105 shadow-lg z-10'
                                                            : 'hover:scale-[1.03] hover:shadow-md'
                                                    }`}
                                                    title={`Impact: ${imp}, Likelihood: ${lik} (Score: ${score} - ${level})`}
                                                >
                                                    <span className={`text-[10px] font-bold ${colors.text}`}>
                                                        {score}
                                                    </span>
                                                    {count > 0 ? (
                                                        <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${colors.badge} shadow-xs`}>
                                                            {count}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] text-gray-300 dark:text-slate-600">-</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* X-Axis Numbers */}
                            <div className="flex items-center gap-1.5 pt-1">
                                <div className="w-6 flex-shrink-0" />
                                <div className="grid grid-cols-5 gap-1.5 flex-1 text-center">
                                    {MATRIX_COLS.map((lik) => (
                                        <span key={`lbl-${lik}`} className="text-[11px] font-bold text-gray-400 dark:text-slate-500">
                                            {lik}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* X-Axis Label */}
                        <div className="text-center text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-wider mt-2 ml-4">
                            LIKELIHOOD (โอกาสเกิด) ➔
                        </div>
                    </div>

                    {/* Criteria Info Box */}
                    <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800 text-[11px] space-y-1.5">
                        <div className="font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 text-blue-500" />
                            เกณฑ์การจัดระดับความเสี่ยง (ISO 31000)
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                <span>🔴 Critical (15–25): วิกฤต อนุมัติโดยบอร์ด</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-orange-500" />
                                <span>🟠 High (10–14): สูง มีงบสำรองและมาตรการ</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                <span>🟡 Medium (5–9): ปานกลาง ควบคุมโดย PM</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>🟢 Low (1–4): ต่ำ ยอมรับและติดตาม</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scoring Table */}
                <div className="xl:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
                    <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100">
                            ตารางประเมินคะแนนความเสี่ยง (Scoring Register)
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                            {selectedCell
                                ? `กรองพิกัด: L=${selectedCell.likelihood}, I=${selectedCell.impact} (${filteredRisks.length} รายการ)`
                                : `แสดง ${filteredRisks.length} จากทั้งหมด ${risks.length} รายการ`}
                        </span>
                    </div>

                    <div className="overflow-x-auto max-h-[600px]">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold border-b border-gray-200 dark:border-slate-800 sticky top-0 z-10">
                                <tr>
                                    <th className="p-3 w-16 text-center">รหัส</th>
                                    <th className="p-3 min-w-[200px]">เหตุการณ์ความเสี่ยง (Risk Event)</th>
                                    <th className="p-3 w-40">โอกาสเกิด (Likelihood)</th>
                                    <th className="p-3 w-40">ผลกระทบ (Impact)</th>
                                    <th className="p-3 w-20 text-center">Score</th>
                                    <th className="p-3 w-24 text-center">ระดับ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {filteredRisks.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-10 text-center text-gray-400 dark:text-slate-500">
                                            ไม่พบรายการความเสี่ยงในระดับนี้
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRisks.map((risk) => {
                                        const colors = getTorRiskLevelColor(risk.riskLevel);
                                        return (
                                            <tr key={risk.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                                {/* Risk No */}
                                                <td className="p-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                                                    {risk.riskNo}
                                                </td>

                                                {/* Risk Event & Clause */}
                                                <td className="p-3">
                                                    <p className="font-semibold text-gray-900 dark:text-slate-100 line-clamp-2">
                                                        {risk.riskEvent || 'ยังไม่ได้ระบุเหตุการณ์'}
                                                    </p>
                                                    {risk.torClauseRef && (
                                                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                                                            {risk.torClauseRef}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Likelihood Selector */}
                                                <td className="p-3">
                                                    <select
                                                        value={risk.likelihood}
                                                        onChange={(e) => handleScoreChange(risk.id, 'likelihood', Number(e.target.value))}
                                                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        {[1, 2, 3, 4, 5].map((lvl) => (
                                                            <option key={lvl} value={lvl}>
                                                                {LIKELIHOOD_LABELS[lvl]}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>

                                                {/* Impact Selector */}
                                                <td className="p-3">
                                                    <select
                                                        value={risk.impact}
                                                        onChange={(e) => handleScoreChange(risk.id, 'impact', Number(e.target.value))}
                                                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        {[1, 2, 3, 4, 5].map((lvl) => (
                                                            <option key={lvl} value={lvl}>
                                                                {IMPACT_LABELS[lvl]}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>

                                                {/* Score */}
                                                <td className="p-3 text-center font-bold text-sm">
                                                    <span className={`${colors.text}`}>
                                                        {risk.riskScore}
                                                    </span>
                                                </td>

                                                {/* Level Badge */}
                                                <td className="p-3 text-center">
                                                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${colors.badge} shadow-xs`}>
                                                        {risk.riskLevel}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
