import React from 'react';
import {
    ClipboardCheck,
    UserCheck,
    Calendar,
    Clock,
    FileSignature,
    CheckCircle2,
    Shield,
    Sparkles,
    FileText
} from 'lucide-react';
import {
    TorProject,
    TorRiskItem,
    TorProjectTimeline,
    getTorRiskLevelColor,
} from '../../types/torRisk';

interface MonitoringSectionProps {
    project: TorProject;
    onChange: (updated: Partial<TorProject>) => void;
    onOpenPdfModal: () => void;
}

const TIMELINE_OPTIONS: { key: TorProjectTimeline; labelTh: string }[] = [
    { key: 'Pre-Bid', labelTh: 'ก่อนยื่นซอง (Pre-Bid Stage)' },
    { key: 'Proposal', labelTh: 'ช่วงจัดทำข้อเสนอ (Proposal Stage)' },
    { key: 'Mobilization', labelTh: 'เตรียมความพร้อม (Mobilization Phase)' },
    { key: 'Construction', labelTh: 'ช่วงก่อสร้าง/ติดตั้ง (Construction Phase)' },
    { key: 'Commissioning', labelTh: 'ช่วงทดสอบระบบ (Commissioning Phase)' },
    { key: 'Warranty', labelTh: 'ช่วงรับประกันผลงาน (Warranty Period)' },
];

const OWNER_OPTIONS = [
    'Project Manager (ผู้จัดการโครงการ)',
    'Commercial / Bid Lead (หัวหน้าทีมเสนอราคา)',
    'Legal Counsel (ที่ปรึกษากฎหมาย/สัญญา)',
    'Engineering Lead (หัวหน้าวิศวกรออกแบบ)',
    'Procurement Lead (หัวหน้าฝ่ายจัดซื้อจัดหา)',
    'Site Construction Manager (ผู้จัดการไซต์งาน)',
    'QA/QC Manager (ผู้จัดการคุณภาพ)',
    'HSE Officer (เจ้าหน้าที่ความปลอดภัย)',
];

export const MonitoringSection: React.FC<MonitoringSectionProps> = ({
    project,
    onChange,
    onOpenPdfModal,
}) => {
    const risks = project.risks || [];

    const handleRiskChange = (id: string, field: keyof TorRiskItem, value: any) => {
        const updated = risks.map((r) => (r.id === id ? { ...r, [field]: value } : r));
        onChange({ risks: updated });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-transparent dark:from-blue-900/20 dark:via-purple-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        ขั้นตอนที่ 5: การติดตาม ทบทวน และข้อเสนอแนะเชิงกลยุทธ์ (Monitoring, Governance & Advice)
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                        กำหนดผู้รับผิดชอบ (Risk Owner), กรอบเวลาดำเนินมาตรการ (Timeline), ตัวชี้วัด KRI และสรุปคำแนะนำเชิงกลยุทธ์เสนอคณะกรรมการ
                    </p>
                </div>
                <button
                    onClick={onOpenPdfModal}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex-shrink-0"
                >
                    <FileText className="w-4 h-4" />
                    ดูตัวอย่างรายงาน PDF 5 ส่วน
                </button>
            </div>

            {/* 1. Governance Matrix Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-blue-500" />
                            ตารางโครงสร้างการกำกับดูแลความเสี่ยง (Risk Governance Matrix)
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            มอบหมายหน้าที่และตัวชี้วัด KRI เพื่อให้สามารถติดตามสถานะความเสี่ยงได้อย่างต่อเนื่อง
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold border-b border-gray-200 dark:border-slate-800">
                            <tr>
                                <th className="p-3 w-16 text-center">รหัส</th>
                                <th className="p-3 min-w-[200px]">เหตุการณ์ความเสี่ยง (Risk Event)</th>
                                <th className="p-3 w-56">ผู้รับผิดชอบ (Risk Owner)</th>
                                <th className="p-3 w-48">กรอบเวลา (Timeline)</th>
                                <th className="p-3 min-w-[200px]">ตัวชี้วัดความเสี่ยง (Key Risk Indicator: KRI)</th>
                                <th className="p-3 w-32 text-center">สถานะ (Status)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {risks.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center text-gray-400 dark:text-slate-500">
                                        ยังไม่มีรายการความเสี่ยงในโครงการ
                                    </td>
                                </tr>
                            ) : (
                                risks.map((risk) => {
                                    const colors = getTorRiskLevelColor(risk.riskLevel);
                                    return (
                                        <tr key={risk.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                            {/* Risk No */}
                                            <td className="p-3 text-center">
                                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block">
                                                    {risk.riskNo}
                                                </span>
                                                <span className={`inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold ${colors.badge}`}>
                                                    {risk.riskLevel}
                                                </span>
                                            </td>

                                            {/* Risk Event */}
                                            <td className="p-3 font-semibold text-gray-900 dark:text-slate-100">
                                                <p className="line-clamp-2">{risk.riskEvent || 'ยังไม่ได้ระบุเหตุการณ์'}</p>
                                                <span className="text-[10px] text-gray-500 dark:text-slate-400">
                                                    กลยุทธ์: {risk.treatmentStrategy}
                                                </span>
                                            </td>

                                            {/* Risk Owner */}
                                            <td className="p-3">
                                                <select
                                                    value={risk.riskOwner || 'Project Manager'}
                                                    onChange={(e) => handleRiskChange(risk.id, 'riskOwner', e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-medium text-gray-900 dark:text-slate-100 outline-none"
                                                >
                                                    {OWNER_OPTIONS.map((opt) => (
                                                        <option key={opt} value={opt.split(' ')[0]}>
                                                            {opt}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            {/* Timeline */}
                                            <td className="p-3">
                                                <select
                                                    value={risk.timeline || 'Proposal'}
                                                    onChange={(e) => handleRiskChange(risk.id, 'timeline', e.target.value as TorProjectTimeline)}
                                                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-medium text-gray-900 dark:text-slate-100 outline-none"
                                                >
                                                    {TIMELINE_OPTIONS.map((t) => (
                                                        <option key={t.key} value={t.key}>
                                                            {t.labelTh}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            {/* KRI Indicator */}
                                            <td className="p-3">
                                                <input
                                                    type="text"
                                                    value={risk.kpiIndicator || ''}
                                                    onChange={(e) => handleRiskChange(risk.id, 'kpiIndicator', e.target.value)}
                                                    placeholder="เช่น อัตราความคืบหน้ารายสัปดาห์, จำนวนข้อบกพร่อง QA..."
                                                    className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs text-gray-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </td>

                                            {/* Status */}
                                            <td className="p-3 text-center">
                                                <select
                                                    value={risk.status || 'Open'}
                                                    onChange={(e) => handleRiskChange(risk.id, 'status', e.target.value)}
                                                    className={`px-2 py-1 rounded-lg text-xs font-bold outline-none ${
                                                        risk.status === 'Closed'
                                                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                                                            : risk.status === 'Managed'
                                                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                                                            : risk.status === 'In Progress'
                                                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                                                            : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400'
                                                    }`}
                                                >
                                                    <option value="Open">Open</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Managed">Managed</option>
                                                    <option value="Closed">Closed</option>
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 2. Strategic Recommendations for Board */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-500" />
                    คำแนะนำเชิงกลยุทธ์สำหรับคณะกรรมการพิจารณาซองราคา (Strategic Advice for Proposal Committee)
                </h4>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                    สรุปประเด็นตัดสินใจสำคัญ จุดคุ้มทุน การตั้งงบสำรองความเสี่ยง และข้อควรระวังสำคัญก่อนลงนามอนุมัติยื่นซองราคาประมูล
                </p>
                <textarea
                    rows={5}
                    value={project.strategicRecommendations || ''}
                    onChange={(e) => onChange({ strategicRecommendations: e.target.value })}
                    placeholder="เช่น 1. แนะนำให้ยื่นข้อเสนอพร้อมแนบใบขอสงวนสิทธิ์ในข้อ 4.2 เพื่อจำกัดเพดานค่าปรับ LDs สูงสุดไม่เกิน 10% ของมูลค่าสัญญา
2. จัดตั้งงบสำรอง Contingency Cost Buffer จำนวนรวมตาม EMV เข้าไปในต้นทุนเสนอราคา
3. ให้ทำสัญญาประกันภัย CAR Insurance ครอบคลุมทรัพย์สินเดิมของลูกค้าก่อนเริ่มงานสนาม..."
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                />
            </div>

            {/* 3. Sign-off & Governance Block */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-emerald-500" />
                    การอนุมัติและลงนามรายงานการประเมินความเสี่ยง (Sign-off & Governance Approval)
                </h4>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                    ข้อมูลผู้จัดทำ ผู้ตรวจสอบ และผู้อนุมัติจะถูกนำไปพิมพ์ลงในเอกสารรายงาน PDF อย่างเป็นทางการ
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800 space-y-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
                            1. ผู้จัดทำรายงาน (Prepared By)
                        </span>
                        <input
                            type="text"
                            value={project.signOffPreparer || ''}
                            onChange={(e) => onChange({ signOffPreparer: e.target.value })}
                            placeholder="ชื่อ-นามสกุล / ตำแหน่ง Proposal Lead"
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800 space-y-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
                            2. ผู้ตรวจสอบ (Reviewed By)
                        </span>
                        <input
                            type="text"
                            value={project.signOffReviewer || ''}
                            onChange={(e) => onChange({ signOffReviewer: e.target.value })}
                            placeholder="ชื่อ-นามสกุล / ตำแหน่ง Risk & Legal Lead"
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800 space-y-2">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">
                            3. ผู้อนุมัติ (Approved By)
                        </span>
                        <input
                            type="text"
                            value={project.signOffApprover || ''}
                            onChange={(e) => onChange({ signOffApprover: e.target.value })}
                            placeholder="ชื่อ-นามสกุล / ตำแหน่ง Managing Director"
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
