import React from 'react';
import {
    Printer,
    X,
    FileText,
    Building2,
    Shield,
    Calendar,
    DollarSign,
    CheckCircle2,
    Layers,
    Activity,
    Calculator,
    ClipboardCheck,
    FileSignature
} from 'lucide-react';
import {
    TorProject,
    TOR_RISK_CATEGORIES,
    TOR_TREATMENT_STRATEGIES,
    getTorRiskLevelColor,
} from '../../types/torRisk';

interface TorPdfReportModalProps {
    project: TorProject;
    isOpen: boolean;
    onClose: () => void;
}

export const TorPdfReportModal: React.FC<TorPdfReportModalProps> = ({
    project,
    isOpen,
    onClose,
}) => {
    if (!isOpen) return null;

    const risks = project.risks || [];
    const constraints = project.constraints || [];
    const budget = project.estimatedBudget || 0;
    const totalImpactCost = risks.reduce((acc, r) => acc + (Number(r.estimatedImpactCost) || 0), 0);
    const totalContingencyEMV = risks.reduce((acc, r) => acc + (Number(r.emvValue) || 0), 0);
    const contingencyPct = budget > 0 ? ((totalContingencyEMV / budget) * 100).toFixed(2) : '0.00';

    const criticalRisks = risks.filter((r) => r.riskLevel === 'Critical');
    const highRisks = risks.filter((r) => r.riskLevel === 'High');
    const mediumRisks = risks.filter((r) => r.riskLevel === 'Medium');
    const lowRisks = risks.filter((r) => r.riskLevel === 'Low');

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[96vh]">
                {/* Modal Action Bar (Hidden during Print) */}
                <div className="p-4 bg-gray-900 text-white flex items-center justify-between flex-shrink-0 print:hidden">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <span className="font-bold text-sm">
                            รายงานประเมินความเสี่ยง TOR และกลยุทธ์เสนอราคา (ISO 31000 / Proposal Risk Report)
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                        >
                            <Printer className="w-4 h-4" />
                            พิมพ์ / บันทึก PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Document Body */}
                <div className="p-8 sm:p-12 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible text-xs leading-relaxed space-y-8">
                    {/* Document Header / Cover Banner */}
                    <div className="border-b-2 border-slate-900 pb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-800 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                                    PROPOSAL RISK ASSESSMENT & CONTINGENCY REPORT
                                </span>
                                <h1 className="text-xl font-black text-slate-900 mt-2">
                                    {project.projectTitle || 'โครงการตามเอกสารประกวดราคา (TOR)'}
                                </h1>
                                <p className="text-xs text-slate-600 mt-1">
                                    รหัสข้อเสนอ: <span className="font-mono font-bold text-slate-900">{project.proposalCode || 'PROP-2026'}</span> | ผู้ว่าจ้าง: <span className="font-bold text-slate-900">{project.clientName || '-'}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-slate-500 block">มาตรฐานที่อ้างอิง:</span>
                                <span className="font-bold text-slate-800 text-[11px] block">ISO 31000:2018 / COSO ERM</span>
                                <span className="text-[10px] text-slate-500 block mt-1">
                                    วันที่ประเมิน: {new Date().toLocaleDateString('th-TH')}
                                </span>
                            </div>
                        </div>

                        {/* Top Financial & Risk Summary Bar */}
                        <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200">
                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-500 block">งบประมาณเสนอราคา</span>
                                <span className="text-sm font-bold font-mono text-slate-900">
                                    {budget.toLocaleString()} {project.currency || 'THB'}
                                </span>
                            </div>
                            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                                <span className="text-[10px] text-emerald-700 block">งบสำรอง Contingency (EMV)</span>
                                <span className="text-sm font-black font-mono text-emerald-700">
                                    {totalContingencyEMV.toLocaleString()} {project.currency || 'THB'}
                                </span>
                            </div>
                            <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                                <span className="text-[10px] text-blue-700 block">สัดส่วนงบสำรอง</span>
                                <span className="text-sm font-bold text-blue-800">
                                    {contingencyPct}% ของงบโครงการ
                                </span>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-500 block">ระดับความเสี่ยง (รวม {risks.length})</span>
                                <span className="text-xs font-bold text-slate-800 flex gap-1.5 mt-0.5">
                                    <span className="text-red-600">🔴 {criticalRisks.length}</span>
                                    <span className="text-orange-500">🟠 {highRisks.length}</span>
                                    <span className="text-amber-500">🟡 {mediumRisks.length}</span>
                                    <span className="text-emerald-600">🟢 {lowRisks.length}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 1: Scope & Context */}
                    <div className="space-y-3">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-blue-900 border-b border-blue-900 pb-1 flex items-center gap-1.5">
                            <span>1.</span> การกำหนดขอบเขตและบริบทของโครงการ (Scope & Context Establishment)
                        </h2>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-bold text-slate-800 mb-1">1.1 วัตถุประสงค์โครงการ (Objectives):</h3>
                                <p className="text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 whitespace-pre-line">
                                    {project.objectives || '-'}
                                </p>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 mb-1">1.2 ขอบเขตงานสำคัญ (Scope of Work):</h3>
                                <p className="text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 whitespace-pre-line">
                                    {project.scopeOfWork || '-'}
                                </p>
                            </div>
                        </div>

                        {constraints.length > 0 && (
                            <div>
                                <h3 className="font-bold text-slate-800 mb-1.5">1.3 ข้อจำกัดและบทปรับสำคัญใน TOR (Key Constraints & LDs):</h3>
                                <table className="w-full text-left text-[11px] border border-slate-200">
                                    <thead className="bg-slate-100 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="p-1.5 w-28">ประเภท</th>
                                            <th className="p-1.5">รายละเอียดข้อกำหนด</th>
                                            <th className="p-1.5 w-60">อัตราค่าปรับ/ผลกระทบ</th>
                                            <th className="p-1.5 w-20 text-center">ระดับ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {constraints.map((c) => (
                                            <tr key={c.id}>
                                                <td className="p-1.5 font-semibold text-slate-700">{c.type}</td>
                                                <td className="p-1.5 text-slate-800">{c.description}</td>
                                                <td className="p-1.5 text-slate-600">{c.penaltyDetails || '-'}</td>
                                                <td className="p-1.5 text-center font-bold">{c.severity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-1">
                            <div>
                                <h3 className="font-bold text-slate-800 mb-1">1.4 บริบทภายในองค์กร (Internal Context):</h3>
                                <p className="text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 whitespace-pre-line text-[11px]">
                                    {project.internalContext || '-'}
                                </p>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 mb-1">1.5 บริบทภายนอกองค์กร (External Context):</h3>
                                <p className="text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 whitespace-pre-line text-[11px]">
                                    {project.externalContext || '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2 & 3: Risk Identification & Assessment */}
                    <div className="space-y-3 print:break-before-page">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-blue-900 border-b border-blue-900 pb-1 flex items-center gap-1.5">
                            <span>2 & 3.</span> ทะเบียนความเสี่ยงและการประเมิน (Risk Register & 5x5 Matrix)
                        </h2>

                        <table className="w-full text-left text-[11px] border border-slate-200">
                            <thead className="bg-slate-100 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-1.5 w-16 text-center">รหัส</th>
                                    <th className="p-1.5 w-28">หมวดหมู่</th>
                                    <th className="p-1.5">สาเหตุ (Cause) ➔ เหตุการณ์ (Event) ➔ ผลกระทบ</th>
                                    <th className="p-1.5 w-36">ข้อ TOR อ้างอิง</th>
                                    <th className="p-1.5 w-12 text-center">L</th>
                                    <th className="p-1.5 w-12 text-center">I</th>
                                    <th className="p-1.5 w-14 text-center">Score</th>
                                    <th className="p-1.5 w-20 text-center">ระดับ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {risks.map((r) => {
                                    const colors = getTorRiskLevelColor(r.riskLevel);
                                    return (
                                        <tr key={r.id} className="align-top">
                                            <td className="p-1.5 text-center font-mono font-bold text-blue-800">{r.riskNo}</td>
                                            <td className="p-1.5 font-semibold text-slate-700">{r.category}</td>
                                            <td className="p-1.5">
                                                <p className="font-bold text-slate-900">{r.riskEvent}</p>
                                                {r.cause && <p className="text-slate-600 text-[10px]">สาเหตุ: {r.cause}</p>}
                                                {r.consequence && <p className="text-slate-600 text-[10px]">ผลกระทบ: {r.consequence}</p>}
                                            </td>
                                            <td className="p-1.5 font-mono text-[10px] text-purple-900">{r.torClauseRef || '-'}</td>
                                            <td className="p-1.5 text-center">{r.likelihood}</td>
                                            <td className="p-1.5 text-center">{r.impact}</td>
                                            <td className="p-1.5 text-center font-bold text-slate-900">{r.riskScore}</td>
                                            <td className="p-1.5 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${colors.badge}`}>
                                                    {r.riskLevel}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* SECTION 4: Treatment & Contingency Buffer */}
                    <div className="space-y-3 print:break-before-page">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-blue-900 border-b border-blue-900 pb-1 flex items-center gap-1.5">
                            <span>4.</span> มาตรการจัดการความเสี่ยง งบสำรอง Contingency และกลยุทธ์ Proposal
                        </h2>

                        <table className="w-full text-left text-[11px] border border-slate-200">
                            <thead className="bg-slate-100 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-1.5 w-16 text-center">รหัส</th>
                                    <th className="p-1.5 w-24">กลยุทธ์ (4T)</th>
                                    <th className="p-1.5">มาตรการควบคุมเชิงรุก / แผนสำรองฉุกเฉิน</th>
                                    <th className="p-1.5 w-28 text-right">ความเสียหาย (THB)</th>
                                    <th className="p-1.5 w-14 text-center">โอกาส</th>
                                    <th className="p-1.5 w-28 text-right">งบสำรอง EMV</th>
                                    <th className="p-1.5 min-w-[160px]">กลยุทธ์การปรับปรุงข้อเสนอ (Proposal)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {risks.map((r) => (
                                    <tr key={r.id} className="align-top">
                                        <td className="p-1.5 text-center font-mono font-bold text-blue-800">{r.riskNo}</td>
                                        <td className="p-1.5 font-bold text-slate-800">{r.treatmentStrategy}</td>
                                        <td className="p-1.5">
                                            <p className="font-semibold text-slate-800">มาตรการ: {r.controlMeasures || '-'}</p>
                                            {r.contingencyPlan && (
                                                <p className="text-[10px] text-slate-600 mt-0.5">แผนสำรอง: {r.contingencyPlan}</p>
                                            )}
                                        </td>
                                        <td className="p-1.5 text-right font-mono">{(r.estimatedImpactCost || 0).toLocaleString()}</td>
                                        <td className="p-1.5 text-center font-mono">{r.probabilityPct || 0}%</td>
                                        <td className="p-1.5 text-right font-mono font-bold text-emerald-800">
                                            {(r.emvValue || 0).toLocaleString()}
                                        </td>
                                        <td className="p-1.5 text-[10px] text-slate-700">{r.proposalStrategy || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                                <tr>
                                    <td colSpan={3} className="p-2 text-right">รวมงบสำรอง Contingency Cost Buffer ทั้งสิ้น:</td>
                                    <td className="p-2 text-right font-mono">{totalImpactCost.toLocaleString()}</td>
                                    <td className="p-2 text-center">-</td>
                                    <td className="p-2 text-right font-mono text-emerald-800 text-xs">
                                        {totalContingencyEMV.toLocaleString()} THB
                                    </td>
                                    <td className="p-2 text-[10px] text-emerald-800">
                                        ({contingencyPct}% ของงบเสนอราคา)
                                    </td>
                                </tr>
                            </tfoot>
                        </table>

                        {/* Calculation Formula Note */}
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[9px] text-slate-600 space-y-0.5">
                            <span className="font-bold text-slate-800">📌 หลักเกณฑ์การคำนวณงบสำรองความเสี่ยง (Expected Monetary Value - EMV):</span>
                            <div className="grid grid-cols-3 gap-2 pt-0.5">
                                <div><b>1. ความเสียหาย (THB):</b> ประเมินจากค่าปรับสัญญา LDs + ค่าล่วงเวลาเร่งงาน + ความผันผวนราคาวัสดุ</div>
                                <div><b>2. โอกาสเกิด (%):</b> แปลงจากระดับ Likelihood (L1=10%, L2=30%, L3=50%, L4=75%, L5=90%)</div>
                                <div><b>3. สูตร EMV:</b> งบสำรอง EMV = ความเสียหาย (THB) × โอกาสเกิด (%)</div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 5: Governance & Strategic Advice */}
                    <div className="space-y-4 print:break-before-page">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-blue-900 border-b border-blue-900 pb-1 flex items-center gap-1.5">
                            <span>5.</span> การติดตาม ทบทวน และข้อเสนอแนะเชิงกลยุทธ์ (Monitoring & Governance)
                        </h2>

                        {/* Governance Table */}
                        <table className="w-full text-left text-[11px] border border-slate-200">
                            <thead className="bg-slate-100 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-1.5 w-16 text-center">รหัส</th>
                                    <th className="p-1.5">เหตุการณ์ความเสี่ยง</th>
                                    <th className="p-1.5 w-44">ผู้รับผิดชอบ (Risk Owner)</th>
                                    <th className="p-1.5 w-36">กรอบเวลา (Timeline)</th>
                                    <th className="p-1.5 w-48">ตัวชี้วัด (KRI)</th>
                                    <th className="p-1.5 w-20 text-center">สถานะ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {risks.map((r) => (
                                    <tr key={r.id}>
                                        <td className="p-1.5 text-center font-mono font-bold text-blue-800">{r.riskNo}</td>
                                        <td className="p-1.5 font-semibold text-slate-800">{r.riskEvent}</td>
                                        <td className="p-1.5 text-slate-700">{r.riskOwner || 'Project Manager'}</td>
                                        <td className="p-1.5 text-slate-700">{r.timeline || 'Proposal'}</td>
                                        <td className="p-1.5 text-slate-600">{r.kpiIndicator || '-'}</td>
                                        <td className="p-1.5 text-center font-bold">{r.status || 'Open'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Strategic Recommendations */}
                        <div>
                            <h3 className="font-bold text-slate-900 mb-1.5 text-xs">
                                5.1 ข้อเสนอแนะเชิงกลยุทธ์สำหรับคณะกรรมการพิจารณาซองราคา (Strategic Recommendations):
                            </h3>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-800 whitespace-pre-line text-[11px] leading-relaxed">
                                {project.strategicRecommendations || '-'}
                            </div>
                        </div>

                        {/* 5.2 Sign-off Approval Grid */}
                        <div className="pt-6">
                            <h3 className="font-bold text-slate-900 mb-3 text-xs">
                                5.2 การลงนามอนุมัติรายงานความเสี่ยง (Sign-off & Governance Approval):
                            </h3>

                            <div className="grid grid-cols-3 gap-6 text-center text-[11px]">
                                <div className="p-4 border border-slate-200 rounded-xl space-y-4">
                                    <span className="font-bold text-slate-700 block">ผู้จัดทำรายงาน (Prepared By)</span>
                                    <div className="h-12 border-b border-dashed border-slate-300" />
                                    <div>
                                        <p className="font-bold text-slate-900">{project.signOffPreparer || '( ............................................................ )'}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Proposal Lead / Risk Engineer</p>
                                    </div>
                                </div>

                                <div className="p-4 border border-slate-200 rounded-xl space-y-4">
                                    <span className="font-bold text-slate-700 block">ผู้ตรวจสอบ (Reviewed By)</span>
                                    <div className="h-12 border-b border-dashed border-slate-300" />
                                    <div>
                                        <p className="font-bold text-slate-900">{project.signOffReviewer || '( ............................................................ )'}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Risk & Legal Specialist</p>
                                    </div>
                                </div>

                                <div className="p-4 border border-slate-200 rounded-xl space-y-4">
                                    <span className="font-bold text-slate-700 block">ผู้อนุมัติ (Approved By)</span>
                                    <div className="h-12 border-b border-dashed border-slate-300" />
                                    <div>
                                        <p className="font-bold text-slate-900">{project.signOffApprover || '( ............................................................ )'}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Proposal Committee / Managing Director</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
