import React from 'react';
import {
    FileText,
    Building2,
    Calendar,
    DollarSign,
    Target,
    Layers,
    AlertTriangle,
    Plus,
    Trash2,
    Sparkles,
    ShieldAlert,
    Cpu,
    Globe
} from 'lucide-react';
import { TorProject, TorConstraint } from '../../types/torRisk';

interface ContextSectionProps {
    project: TorProject;
    onChange: (updated: Partial<TorProject>) => void;
    onOpenAiModal: () => void;
}

export const ContextSection: React.FC<ContextSectionProps> = ({
    project,
    onChange,
    onOpenAiModal,
}) => {
    const handleConstraintChange = (id: string, field: keyof TorConstraint, val: any) => {
        const updated = (project.constraints || []).map(c => c.id === id ? { ...c, [field]: val } : c);
        onChange({ constraints: updated });
    };

    const handleAddConstraint = () => {
        const newConstraint: TorConstraint = {
            id: `c-${Date.now()}`,
            type: 'LD',
            description: '',
            penaltyDetails: 'ค่าปรับ 0.1% ต่อวัน (สูงสุด 10%)',
            severity: 'High',
        };
        onChange({ constraints: [...(project.constraints || []), newConstraint] });
    };

    const handleRemoveConstraint = (id: string) => {
        onChange({ constraints: (project.constraints || []).filter(c => c.id !== id) });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header / Intro Card */}
            <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent dark:from-blue-900/20 dark:via-indigo-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        ขั้นตอนที่ 1: การกำหนดขอบเขตและบริบทของโครงการ (Scope & Context Establishment)
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                        กำหนดข้อมูลโครงการ ทำความเข้าใจขอบเขตงาน วัตถุประสงค์ เงื่อนไขสัญญา/บทปรับ (LDs) และวิเคราะห์บริบทภายใน/ภายนอกตามมาตรฐาน ISO 31000
                    </p>
                </div>
                <button
                    onClick={onOpenAiModal}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex-shrink-0"
                >
                    <Sparkles className="w-4 h-4" />
                    วิเคราะห์ TOR ด้วย AI
                </button>
            </div>

            {/* 1. Project Metadata Grid */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
                    <Building2 className="w-4 h-4 text-indigo-500" />
                    1.1 ข้อมูลทั่วไปของโครงการเสนอราคา (Proposal Metadata)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                            รหัสข้อเสนอราคา (Proposal Code) *
                        </label>
                        <input
                            type="text"
                            value={project.proposalCode || ''}
                            onChange={(e) => onChange({ proposalCode: e.target.value })}
                            placeholder="e.g. PROP-2026-001"
                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                            ชื่อโครงการ (Project Title) *
                        </label>
                        <input
                            type="text"
                            value={project.projectTitle || ''}
                            onChange={(e) => onChange({ projectTitle: e.target.value })}
                            placeholder="e.g. โครงการติดตั้งระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์"
                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                            ชื่อลูกค้า/ผู้ว่าจ้าง (Client Name) *
                        </label>
                        <input
                            type="text"
                            value={project.clientName || ''}
                            onChange={(e) => onChange({ clientName: e.target.value })}
                            placeholder="e.g. การไฟฟ้าฝ่ายผลิต / PTT"
                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            กำหนดส่งซอง (Submission Deadline)
                        </label>
                        <input
                            type="date"
                            value={project.submissionDeadline || ''}
                            onChange={(e) => onChange({ submissionDeadline: e.target.value })}
                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                            งบประมาณโครงการเสนอราคา (Estimated Budget)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={project.estimatedBudget || ''}
                                onChange={(e) => onChange({ estimatedBudget: Number(e.target.value) || 0 })}
                                placeholder="e.g. 50000000"
                                className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <select
                                value={project.currency || 'THB'}
                                onChange={(e) => onChange({ currency: e.target.value })}
                                className="px-2 py-2 text-xs font-semibold bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-300 outline-none"
                            >
                                <option value="THB">THB</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="JPY">JPY</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Scope & Objectives */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-3">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-500" />
                        1.2 วัตถุประสงค์หลักของโครงการ (Project Objectives)
                    </h4>
                    <textarea
                        rows={4}
                        value={project.objectives || ''}
                        onChange={(e) => onChange({ objectives: e.target.value })}
                        placeholder="ระบุเป้าหมายหลัก เช่น เพื่อก่อสร้างโรงงานให้แล้วเสร็จภายใน 18 เดือน ตามมาตรฐานความปลอดภัยสูงสุด..."
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                    />
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-3">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-500" />
                        1.3 ขอบเขตงานสำคัญ (Scope of Work & Deliverables)
                    </h4>
                    <textarea
                        rows={4}
                        value={project.scopeOfWork || ''}
                        onChange={(e) => onChange({ scopeOfWork: e.target.value })}
                        placeholder="สรุปขอบเขตงานที่ต้องส่งมอบตาม TOR เช่น งาน Engineering, Procurement, Construction, Testing & Commissioning..."
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                    />
                </div>
            </div>

            {/* 3. Constraints & Liquidated Damages (LDs) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-500" />
                            1.4 ข้อจำกัดสำคัญและเงื่อนไขบทลงโทษค่าปรับ (Key Constraints & Liquidated Damages)
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            ระบุข้อกำหนดที่มีบทปรับ เช่น ค่าปรับส่งมอบงานล่าช้า (LDs), เงื่อนไขการันตีสมรรถนะ (Performance Guarantee), หรือ Milestone สำคัญ
                        </p>
                    </div>
                    <button
                        onClick={handleAddConstraint}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        เพิ่มข้อจำกัด/บทปรับ
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <thead className="bg-gray-100 dark:bg-slate-800/70 text-gray-700 dark:text-slate-300 font-bold border-b border-gray-200 dark:border-slate-800">
                            <tr>
                                <th className="p-2.5 w-32">ประเภท</th>
                                <th className="p-2.5">รายละเอียดข้อจำกัด / ข้อกำหนด TOR</th>
                                <th className="p-2.5 w-64">อัตราค่าปรับ / ผลกระทบ (LD Details)</th>
                                <th className="p-2.5 w-28 text-center">ระดับความเสี่ยง</th>
                                <th className="p-2.5 w-12 text-center">ลบ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {(!project.constraints || project.constraints.length === 0) ? (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-gray-400 dark:text-slate-500">
                                        ยังไม่มีรายการข้อจำกัดหรือบทลงโทษ กดปุ่ม "เพิ่มข้อจำกัด/บทปรับ" หรือใช้ปุ่ม "วิเคราะห์ TOR ด้วย AI"
                                    </td>
                                </tr>
                            ) : (
                                project.constraints.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40">
                                        <td className="p-2">
                                            <select
                                                value={c.type}
                                                onChange={(e) => handleConstraintChange(c.id, 'type', e.target.value)}
                                                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded text-xs text-gray-900 dark:text-slate-100"
                                            >
                                                <option value="LD">ค่าปรับล่าช้า (LD)</option>
                                                <option value="Milestone">กำหนดส่งมอบ (Milestone)</option>
                                                <option value="Technical">เกณฑ์เทคนิค (Technical)</option>
                                                <option value="Warranty">การรับประกัน (Warranty)</option>
                                                <option value="Financial">การเงิน/ค้ำประกัน (Financial)</option>
                                                <option value="Other">อื่นๆ (Other)</option>
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={c.description}
                                                onChange={(e) => handleConstraintChange(c.id, 'description', e.target.value)}
                                                placeholder="เช่น TOR ข้อ 14.1 ส่งมอบงานล่าช้า..."
                                                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded text-xs text-gray-900 dark:text-slate-100"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={c.penaltyDetails || ''}
                                                onChange={(e) => handleConstraintChange(c.id, 'penaltyDetails', e.target.value)}
                                                placeholder="เช่น ปรับ 0.1% ต่อวัน ไม่เกิน 10% ของมูลค่าสัญญา"
                                                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded text-xs text-gray-900 dark:text-slate-100"
                                            />
                                        </td>
                                        <td className="p-2 text-center">
                                            <select
                                                value={c.severity}
                                                onChange={(e) => handleConstraintChange(c.id, 'severity', e.target.value)}
                                                className={`px-2 py-1 rounded text-[11px] font-bold ${
                                                    c.severity === 'High'
                                                        ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                                        : c.severity === 'Medium'
                                                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                                        : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                                }`}
                                            >
                                                <option value="High">สูง (High)</option>
                                                <option value="Medium">ปานกลาง (Medium)</option>
                                                <option value="Low">ต่ำ (Low)</option>
                                            </select>
                                        </td>
                                        <td className="p-2 text-center">
                                            <button
                                                onClick={() => handleRemoveConstraint(c.id)}
                                                className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                                                title="ลบรายการ"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 4. Internal & External Context */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-3">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-purple-500" />
                        1.5 บริบทภายในองค์กร (Internal Context)
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                        วิเคราะห์ความพร้อมขององค์กร: กำลังคนและผู้เชี่ยวชาญเฉพาะทาง, เครื่องจักรและเทคโนโลยี, ความพร้อมของกระแสเงินสด (Cash Flow)
                    </p>
                    <textarea
                        rows={4}
                        value={project.internalContext || ''}
                        onChange={(e) => onChange({ internalContext: e.target.value })}
                        placeholder="เช่น ทีมวิศวกรมีความเชี่ยวชาญงาน EPC ระบบไฟฟ้า แต่ขาดแคลนช่างเทคนิคเฉพาะทางด้าน SCADA ต้องจ้าง Outsource..."
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                    />
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-3">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-cyan-500" />
                        1.6 บริบทภายนอกองค์กร (External Context)
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                        วิเคราะห์ปัจจัยสภาพแวดล้อมภายนอก: ข้อกฎหมายและใบอนุญาตราชการ, สภาพภูมิอากาศ/ฤดูฝน, ซัพพลายเออร์และราคาวัสดุก่อสร้าง, ความผันผวนของอัตราแลกเปลี่ยน
                    </p>
                    <textarea
                        rows={4}
                        value={project.externalContext || ''}
                        onChange={(e) => onChange({ externalContext: e.target.value })}
                        placeholder="เช่น พื้นที่โครงการมีฝนตกชุก 5 เดือนต่อปี อาจกระทบงานฐานราก, วัสดุสายเคเบิลนำเข้ามีความผันผวนด้านราคาและเวลาจัดส่ง (Lead Time 16 สัปดาห์)..."
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                    />
                </div>
            </div>
        </div>
    );
};
