import React, { useState, useEffect, useRef } from 'react';
import {
    Layers,
    FileText,
    ShieldAlert,
    Activity,
    Calculator,
    ClipboardCheck,
    Sparkles,
    Printer,
    Download,
    Save,
    Plus,
    Trash2,
    ArrowLeft,
    DollarSign,
    Percent,
    AlertCircle,
    CheckCircle2,
    FolderKanban,
    RefreshCw
} from 'lucide-react';
import {
    TorProject,
    TorRiskItem,
    getTorRiskScore,
    getTorRiskLevel,
    calculateEMV,
} from '../types/torRisk';
import {
    subscribeToTorProjects,
    saveTorProject,
    deleteTorProject,
} from '../services/firebaseService';

import { ContextSection } from '../components/tor-risk/ContextSection';
import { RiskIdentificationSection } from '../components/tor-risk/RiskIdentificationSection';
import { RiskAssessmentSection } from '../components/tor-risk/RiskAssessmentSection';
import { TreatmentSection } from '../components/tor-risk/TreatmentSection';
import { MonitoringSection } from '../components/tor-risk/MonitoringSection';
import { AiAnalyzerModal } from '../components/tor-risk/AiAnalyzerModal';
import { TorPdfReportModal } from '../components/tor-risk/TorPdfReportModal';

interface TorRiskAssessmentProps {
    onBackToDashboard: () => void;
    userProfile?: any;
}

const TABS = [
    { id: 1, label: '1. ขอบเขตและบริบท', subLabel: 'Scope & Context', icon: FileText },
    { id: 2, label: '2. ระบุความเสี่ยง & TOR', subLabel: 'Risk ID & Traceability', icon: ShieldAlert },
    { id: 3, label: '3. เมทริกซ์ 5x5', subLabel: 'Assessment & Matrix', icon: Activity },
    { id: 4, label: '4. มาตรการ & Contingency', subLabel: 'Treatment & EMV Buffer', icon: Calculator },
    { id: 5, label: '5. ติดตาม & ข้อเสนอแนะ', subLabel: 'Monitoring & Advice', icon: ClipboardCheck },
];

const DEFAULT_PROJECT: TorProject = {
    id: `tor-proj-${Date.now()}`,
    proposalCode: 'PROP-2026-001',
    projectTitle: 'โครงการจัดทำข้อเสนอประกวดราคา (EPC Proposal)',
    clientName: 'หน่วยงานผู้ว่าจ้าง',
    submissionDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estimatedBudget: 50000000,
    currency: 'THB',
    objectives: 'เพื่อจัดทำข้อเสนอทางเทคนิคและพาณิชย์ที่มีความพร้อมสูงสุด บริหารความเสี่ยงอย่างรอบด้าน และป้องกันความเสี่ยงขาดทุนของโครงการ',
    scopeOfWork: 'งานจัดซื้อจัดจ้าง ก่อสร้าง ติดตั้ง ทดสอบระบบ และส่งมอบงานตามข้อกำหนดในเอกสารประกวดราคา (TOR)',
    constraints: [
        {
            id: 'c-1',
            type: 'LD',
            description: 'เงื่อนไขค่าปรับส่งมอบงานล่าช้าตาม TOR ข้อ 14.1',
            penaltyDetails: 'คิดค่าปรับ 0.1% ต่อวันของมูลค่าสัญญา สูงสุดไม่เกิน 10%',
            severity: 'High',
        },
        {
            id: 'c-2',
            type: 'Technical',
            description: 'ต้องใช้อุปกรณ์ที่ได้รับการรับรองตามมาตรฐานสากล IEC / IEEE',
            penaltyDetails: 'หากไม่ผ่านการทดสอบจะไม่ได้รับการตรวจรับงานงวดสุดท้าย',
            severity: 'Medium',
        }
    ],
    internalContext: 'ทีมวิศวกรมีความเชี่ยวชาญด้าน EPC แต่ต้องจัดเตรียมผู้รับเหมาช่วงเฉพาะทางและสำรองกระแสเงินสด',
    externalContext: 'พื้นที่โครงการมีข้อจำกัดด้านสภาพอากาศ และอุปกรณ์นำเข้ามีความผันผวนของราคา/เวลาจัดส่ง',
    risks: [
        {
            id: 'tr-sample-1',
            riskNo: 'TR-001',
            category: 'Compliance',
            cause: 'เงื่อนไขใน TOR กำหนดบทปรับค่าส่งมอบงานล่าช้าสูง 0.1% ต่อวัน และเงื่อนไขการส่งมอบเข้มงวด',
            riskEvent: 'มีความเสี่ยงที่จะถูกปรับเงินเนื่องจากงานส่งมอบล่าช้ากว่ากำหนดสัญญา (Liquidated Damages)',
            consequence: 'อาจถูกหักเงินประกันสัญญาหรือถูกปรับสูงสุด 10% ของมูลค่าโครงการ ส่งผลต่อกำไรสุทธิ',
            torClauseRef: 'TOR ข้อ 14.1 ค่าปรับส่งมอบล่าช้า',
            likelihood: 3,
            impact: 4,
            riskScore: 12,
            riskLevel: 'High',
            treatmentStrategy: 'Reduce',
            controlMeasures: 'ทำ Master Schedule ควบคุมอย่างเข้มงวด และคัดเลือกซับคอนแทรคเตอร์ที่มีประวัติส่งมอบงานตรงเวลา',
            contingencyPlan: 'เจรจาขอขยายเวลาทำงานตามเหตุสุดวิสัย (Force Majeure) และเตรียมทีมงานสำรอง',
            estimatedImpactCost: 2500000,
            probabilityPct: 50,
            emvValue: 1250000,
            contingencyRationale: 'สำรองค่าปรับล่าช้าเฉลี่ย 25 วัน ตามสถิติโครงการที่ผ่านมา',
            proposalStrategy: 'ยื่นข้อสงวนสิทธิ์ในใบเสนอราคา ขอขยายกรอบเวลากรณีได้รับอนุญาตจากหน่วยงานรัฐล่าช้า',
            riskOwner: 'Project Manager',
            timeline: 'Proposal',
            kpiIndicator: 'อัตราความคืบหน้างานจริงเทียบกับแผนงาน (SPI >= 0.95)',
            status: 'Open',
        },
        {
            id: 'tr-sample-2',
            riskNo: 'TR-002',
            category: 'Financial',
            cause: 'ความผันผวนของอัตราแลกเปลี่ยนและราคาเหล็ก/สายเคเบิลในตลาดโลก',
            riskEvent: 'ต้นทุนการจัดซื้อวัสดุและอุปกรณ์หลักสูงกว่างบประมาณที่เสนอราคา',
            consequence: 'ต้นทุนโครงการบานปลาย (Cost Overrun) และกำไรขั้นต้นลดลง',
            torClauseRef: 'TOR ข้อ 8.2 เงื่อนไขราคายืนคงที่',
            likelihood: 4,
            impact: 3,
            riskScore: 12,
            riskLevel: 'High',
            treatmentStrategy: 'Transfer',
            controlMeasures: 'ทำสัญญาตกลงราคาคงที่ (Back-to-Back Agreement) กับคู่ค้าหลัก และทำสัญญาป้องกันความเสี่ยงอัตราแลกเปลี่ยน (Hedging)',
            contingencyPlan: 'จัดหาซัพพลายเออร์ทางเลือกในประเทศเพื่อทดแทน',
            estimatedImpactCost: 1800000,
            probabilityPct: 75,
            emvValue: 1350000,
            contingencyRationale: 'สำรองส่วนต่างราคานำเข้า 5-8% ของมูลค่างานจัดซื้อ',
            proposalStrategy: 'ระบุเงื่อนไขปรับราคาตามดัชนีราคาวัสดุก่อสร้างหากระยะเวลายืนราคานานกว่า 90 วัน',
            riskOwner: 'Procurement Lead',
            timeline: 'Pre-Bid',
            kpiIndicator: 'ส่วนต่างราคา PO จริง เทียบกับราคาใน Budget Estimate',
            status: 'Open',
        },
    ],
    strategicRecommendations: `1. แนะนำให้คณะกรรมการพิจารณาซองราคาอนุมัติการตั้งงบสำรองความเสี่ยง (Contingency Buffer) ตามหลัก EMV เข้าไปในต้นทุนเสนอราคา
2. ควรกำหนดข้อสงวนสิทธิ์ (Qualification Clause) ในเรื่องการขยายเวลากรณีลูกค้าส่งมอบพื้นที่ล่าช้า
3. กำหนดให้ทำสัญญาประกันภัย CAR Insurance ครอบคลุมความเสียหายบุคคลที่สามก่อนเริ่มดำเนินงานสนาม`,
    signOffPreparer: '',
    signOffReviewer: '',
    signOffApprover: '',
    signOffDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

export const TorRiskAssessment: React.FC<TorRiskAssessmentProps> = ({
    onBackToDashboard,
    userProfile,
}) => {
    const [projects, setProjects] = useState<TorProject[]>([]);
    const [currentProject, setCurrentProject] = useState<TorProject>(DEFAULT_PROJECT);
    const [activeTab, setActiveTab] = useState<number>(1);

    const [showAiModal, setShowAiModal] = useState<boolean>(false);
    const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    const isInitialLoadRef = useRef<boolean>(true);
    const activeProjectIdRef = useRef<string>(currentProject.id);

    // Keep activeProjectIdRef in sync
    useEffect(() => {
        activeProjectIdRef.current = currentProject.id;
    }, [currentProject.id]);

    // Subscribe to Firestore TOR projects
    useEffect(() => {
        const unsubscribe = subscribeToTorProjects((list) => {
            setProjects(list);
            if (list.length > 0) {
                if (isInitialLoadRef.current) {
                    isInitialLoadRef.current = false;
                    // First load: select existing or first project
                    const existing = list.find((p) => p.id === activeProjectIdRef.current);
                    if (existing) {
                        setCurrentProject(existing);
                    } else if (list[0]) {
                        setCurrentProject(list[0]);
                    }
                } else {
                    // Update projects list without blindly replacing local state if currently viewing
                    const existing = list.find((p) => p.id === activeProjectIdRef.current);
                    if (existing) {
                        // Only update if updatedAt in Firestore is newer
                        setCurrentProject((prev) => {
                            if (!prev.updatedAt || (existing.updatedAt && new Date(existing.updatedAt) > new Date(prev.updatedAt))) {
                                return existing;
                            }
                            return prev;
                        });
                    }
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const handleProjectChange = (updated: Partial<TorProject>) => {
        setCurrentProject((prev) => ({
            ...prev,
            ...updated,
            updatedAt: new Date().toISOString(),
        }));
    };

    const handleSaveProject = async (overrideProj?: TorProject) => {
        setSaveStatus('saving');
        try {
            const toSave = overrideProj || {
                ...currentProject,
                updatedAt: new Date().toISOString(),
                lastUpdatedBy: userProfile?.email || 'User',
            };
            await saveTorProject(toSave);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2500);
        } catch (err) {
            console.error('Save TOR Project Error:', err);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 4000);
        }
    };

    const handleCreateNewProject = () => {
        const newProj: TorProject = {
            ...DEFAULT_PROJECT,
            id: `tor-${Date.now()}`,
            proposalCode: `PROP-${new Date().getFullYear()}-${String(projects.length + 1).padStart(3, '0')}`,
            projectTitle: 'โครงการข้อเสนอประมูลใหม่',
            clientName: 'ลูกค้าใหม่',
            risks: [],
            constraints: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setCurrentProject(newProj);
        activeProjectIdRef.current = newProj.id;
        setActiveTab(1);
    };

    const handleDeleteCurrentProject = async () => {
        if (window.confirm(`คุณต้องการลบโครงการ "${currentProject.projectTitle}" ใช่หรือไม่?`)) {
            try {
                await deleteTorProject(currentProject.id);
                if (projects.length > 1) {
                    const remaining = projects.filter((p) => p.id !== currentProject.id);
                    const next = remaining[0] || DEFAULT_PROJECT;
                    setCurrentProject(next);
                    activeProjectIdRef.current = next.id;
                } else {
                    handleCreateNewProject();
                }
            } catch (err) {
                console.error('Delete error:', err);
                alert('เกิดข้อผิดพลาดในการลบโครงการ');
            }
        }
    };

    const handleApplyAiResults = async (analyzed: Partial<TorProject>) => {
        console.log('[TorRiskAssessment] Applying AI results:', analyzed);
        const merged: TorProject = {
            ...currentProject,
            ...analyzed,
            constraints: Array.isArray(analyzed.constraints) ? analyzed.constraints : (currentProject.constraints || []),
            risks: Array.isArray(analyzed.risks) ? analyzed.risks : (currentProject.risks || []),
            updatedAt: new Date().toISOString(),
            lastUpdatedBy: userProfile?.email || 'User (AI Scan)',
        };

        setCurrentProject(merged);
        activeProjectIdRef.current = merged.id;
        setActiveTab(2); // Jump to Tab 2 (Risk Identification) to review
        setShowAiModal(false);

        // Directly save the merged project to Firestore
        await handleSaveProject(merged);
    };

    const handleExportCsv = () => {
        const risks = currentProject.risks || [];
        if (risks.length === 0) {
            alert('ไม่มีรายการความเสี่ยงให้ส่งออก');
            return;
        }

        const headers = [
            'Risk No',
            'Category',
            'Root Cause',
            'Risk Event',
            'Consequence',
            'TOR Clause Ref',
            'Likelihood (1-5)',
            'Impact (1-5)',
            'Risk Score (1-25)',
            'Risk Level',
            'Treatment Strategy',
            'Control Measures',
            'Contingency Plan',
            'Estimated Impact Cost (THB)',
            'Probability (%)',
            'EMV Value (THB)',
            'Proposal Strategy',
            'Risk Owner',
            'Timeline',
            'KRI',
            'Status'
        ];

        const rows = risks.map((r) => [
            `"${r.riskNo}"`,
            `"${r.category}"`,
            `"${(r.cause || '').replace(/"/g, '""')}"`,
            `"${(r.riskEvent || '').replace(/"/g, '""')}"`,
            `"${(r.consequence || '').replace(/"/g, '""')}"`,
            `"${(r.torClauseRef || '').replace(/"/g, '""')}"`,
            r.likelihood,
            r.impact,
            r.riskScore,
            `"${r.riskLevel}"`,
            `"${r.treatmentStrategy}"`,
            `"${(r.controlMeasures || '').replace(/"/g, '""')}"`,
            `"${(r.contingencyPlan || '').replace(/"/g, '""')}"`,
            r.estimatedImpactCost || 0,
            r.probabilityPct || 0,
            r.emvValue || 0,
            `"${(r.proposalStrategy || '').replace(/"/g, '""')}"`,
            `"${r.riskOwner || ''}"`,
            `"${r.timeline || ''}"`,
            `"${(r.kpiIndicator || '').replace(/"/g, '""')}"`,
            `"${r.status || 'Open'}"`
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `TOR_Risk_Register_${currentProject.proposalCode}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calculate Summary KPIs
    const risks = currentProject.risks || [];
    const budget = currentProject.estimatedBudget || 0;
    const totalContingencyEMV = risks.reduce((acc, r) => acc + (Number(r.emvValue) || 0), 0);
    const contingencyPct = budget > 0 ? ((totalContingencyEMV / budget) * 100).toFixed(2) : '0.00';
    const criticalCount = risks.filter((r) => r.riskLevel === 'Critical').length;
    const highCount = risks.filter((r) => r.riskLevel === 'High').length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 pb-16">
            {/* Top Sticky Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-14 z-20 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
                    {/* Left: Back + Title + Project Switcher */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={onBackToDashboard}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                            title="กลับไปยัง Dashboard"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">แดชบอร์ด</span>
                        </button>

                        <div className="flex items-center gap-2 border-l border-gray-200 dark:border-slate-800 pl-3">
                            <FolderKanban className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            {projects.length > 0 ? (
                                <select
                                    value={currentProject.id}
                                    onChange={(e) => {
                                        const selected = projects.find((p) => p.id === e.target.value);
                                        if (selected) setCurrentProject(selected);
                                    }}
                                    className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 dark:text-slate-100 max-w-[200px] sm:max-w-xs truncate outline-none"
                                >
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.proposalCode} - {p.projectTitle}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <span className="text-xs font-bold text-gray-900 dark:text-slate-100">
                                    {currentProject.proposalCode}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right: Actions (New, AI, PDF, CSV, Save) */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={handleCreateNewProject}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all"
                            title="สร้างโครงการ TOR ใหม่"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">โครงการใหม่</span>
                        </button>

                        <button
                            onClick={() => setShowAiModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            AI Scan TOR
                        </button>

                        <button
                            onClick={() => setShowPdfModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">รายงาน</span> PDF
                        </button>

                        <button
                            onClick={handleExportCsv}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-xl transition-all"
                            title="ส่งออก CSV"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">CSV</span>
                        </button>

                        <button
                            onClick={handleSaveProject}
                            disabled={saveStatus === 'saving'}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                                saveStatus === 'saved'
                                    ? 'bg-emerald-600 text-white'
                                    : saveStatus === 'error'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                        >
                            {saveStatus === 'saving' ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : saveStatus === 'saved' ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                                <Save className="w-3.5 h-3.5" />
                            )}
                            <span>
                                {saveStatus === 'saving' ? 'กำลังบันทึก...' : saveStatus === 'saved' ? 'บันทึกสำเร็จ' : saveStatus === 'error' ? 'บันทึกไม่สำเร็จ' : 'บันทึกโครงการ'}
                            </span>
                        </button>

                        {projects.some((p) => p.id === currentProject.id) && (
                            <button
                                onClick={handleDeleteCurrentProject}
                                className="p-1.5 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                title="ลบโครงการนี้"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Page Container */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
                {/* Project Header Banner & Metric Overview */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                                    ISO 31000:2018 / COSO ERM
                                </span>
                                <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-slate-500">
                                    {currentProject.proposalCode}
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight mt-1.5">
                                {currentProject.projectTitle}
                            </h2>
                            <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                                ผู้ว่าจ้าง: <span className="font-semibold text-gray-900 dark:text-slate-200">{currentProject.clientName || '-'}</span> | กำหนดส่งซอง: <span className="font-semibold text-gray-900 dark:text-slate-200">{currentProject.submissionDeadline || '-'}</span>
                            </p>
                        </div>

                        {/* Top KPI Metric Pills */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
                            <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-100 dark:border-slate-800">
                                <span className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold block">งบประมาณเสนอราคา</span>
                                <span className="text-sm sm:text-base font-black font-mono text-gray-900 dark:text-slate-100">
                                    {budget.toLocaleString()} <span className="text-[10px] font-normal text-gray-400">{currentProject.currency || 'THB'}</span>
                                </span>
                            </div>

                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/50">
                                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">งบสำรอง EMV</span>
                                <span className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                                    {totalContingencyEMV.toLocaleString()} <span className="text-[10px] font-bold text-emerald-600">({contingencyPct}%)</span>
                                </span>
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-gray-100 dark:border-slate-800 col-span-2 sm:col-span-1">
                                <span className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold block">ความเสี่ยงทั้งหมด ({risks.length})</span>
                                <div className="flex items-center gap-2 mt-0.5 text-xs font-bold">
                                    <span className="text-red-600 dark:text-red-400">🔴 {criticalCount}</span>
                                    <span className="text-orange-500 dark:text-orange-400">🟠 {highCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5-Step Progress Tabs Navigation Bar */}
                    <div className="mt-6 pt-5 border-t border-gray-100 dark:border-slate-800">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`p-3 rounded-2xl text-left transition-all relative flex flex-col justify-between ${
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                                                : 'bg-gray-50 dark:bg-slate-800/70 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10'}`}>
                                                {tab.id}/5
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold truncate">{tab.label}</p>
                                            <p className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-gray-400 dark:text-slate-500'}`}>
                                                {tab.subLabel}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Tab Content Display */}
                <div className="min-h-[500px]">
                    {activeTab === 1 && (
                        <ContextSection
                            project={currentProject}
                            onChange={handleProjectChange}
                            onOpenAiModal={() => setShowAiModal(true)}
                        />
                    )}

                    {activeTab === 2 && (
                        <RiskIdentificationSection
                            project={currentProject}
                            onChange={handleProjectChange}
                            onOpenAiModal={() => setShowAiModal(true)}
                        />
                    )}

                    {activeTab === 3 && (
                        <RiskAssessmentSection
                            project={currentProject}
                            onChange={handleProjectChange}
                        />
                    )}

                    {activeTab === 4 && (
                        <TreatmentSection
                            project={currentProject}
                            onChange={handleProjectChange}
                        />
                    )}

                    {activeTab === 5 && (
                        <MonitoringSection
                            project={currentProject}
                            onChange={handleProjectChange}
                            onOpenPdfModal={() => setShowPdfModal(true)}
                        />
                    )}
                </div>
            </main>

            {/* AI Analyzer Modal */}
            <AiAnalyzerModal
                project={currentProject}
                isOpen={showAiModal}
                onClose={() => setShowAiModal(false)}
                onApplyResults={handleApplyAiResults}
            />

            {/* 5-Section Printable PDF Report Modal */}
            <TorPdfReportModal
                project={currentProject}
                isOpen={showPdfModal}
                onClose={() => setShowPdfModal(false)}
            />
        </div>
    );
};

export default TorRiskAssessment;
