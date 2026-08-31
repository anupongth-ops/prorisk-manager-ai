/**
 * Types & Domain Models for TOR & Proposal Risk Assessment Module
 * Standard: ISO 31000:2018 / COSO ERM / PMBOK 7th Edition
 */

export type TorRiskCategory =
    | 'Strategic'
    | 'Operational'
    | 'Financial'
    | 'Compliance'
    | 'Technology'
    | 'Resource'
    | 'Reputational'
    | 'Schedule';

export const TOR_RISK_CATEGORIES: { id: TorRiskCategory; key: TorRiskCategory; name: string; labelTh: string; labelEn: string; color: string }[] = [
    { id: 'Strategic', key: 'Strategic', name: 'Strategic (กลยุทธ์)', labelTh: 'ความเสี่ยงเชิงกลยุทธ์', labelEn: 'Strategic Risk', color: 'indigo' },
    { id: 'Operational', key: 'Operational', name: 'Operational (ปฏิบัติการ)', labelTh: 'ความเสี่ยงด้านการปฏิบัติงาน', labelEn: 'Operational Risk', color: 'blue' },
    { id: 'Financial', key: 'Financial', name: 'Financial (การเงิน)', labelTh: 'ความเสี่ยงทางการเงิน/กระแสเงินสด', labelEn: 'Financial Risk', color: 'emerald' },
    { id: 'Compliance', key: 'Compliance', name: 'Compliance (กฎหมาย/สัญญา)', labelTh: 'ความเสี่ยงด้านกฎหมาย/สัญญา/บทปรับ', labelEn: 'Compliance / Contractual Risk', color: 'purple' },
    { id: 'Technology', key: 'Technology', name: 'Technology (เทคโนโลยี)', labelTh: 'ความเสี่ยงด้านเทคโนโลยีและข้อมูล', labelEn: 'Technology & Data Risk', color: 'cyan' },
    { id: 'Resource', key: 'Resource', name: 'Resource (ทรัพยากร/บุคคล)', labelTh: 'ความเสี่ยงด้านบุคลากรและทรัพยากร', labelEn: 'Resource / Human Risk', color: 'amber' },
    { id: 'Reputational', key: 'Reputational', name: 'Reputational (ชื่อเสียง)', labelTh: 'ความเสี่ยงด้านชื่อเสียงองค์กร', labelEn: 'Reputational Risk', color: 'rose' },
    { id: 'Schedule', key: 'Schedule', name: 'Schedule (ระยะเวลาส่งมอบ)', labelTh: 'ความเสี่ยงด้านระยะเวลา/การส่งมอบ', labelEn: 'Schedule / Delivery Risk', color: 'orange' },
];

export type TorTreatmentStrategy =
    | 'Avoid'
    | 'Reduce'
    | 'Transfer'
    | 'Accept';

export const TOR_TREATMENT_STRATEGIES: { id: TorTreatmentStrategy; key: TorTreatmentStrategy; name: string; labelTh: string; labelEn: string; desc: string; color: string }[] = [
    { id: 'Avoid', key: 'Avoid', name: 'หลีกเลี่ยง (Avoid)', labelTh: 'หลีกเลี่ยง (Avoid)', labelEn: 'Avoid Risk', desc: 'ปรับเปลี่ยนขอบเขตงานหรือตั้งเงื่อนไขตัดความเสี่ยงออกจากสัญญา', color: 'rose' },
    { id: 'Reduce', key: 'Reduce', name: 'ลด/บรรเทา (Reduce)', labelTh: 'ลด/บรรเทา (Reduce/Mitigate)', labelEn: 'Reduce / Mitigate', desc: 'กำหนดมาตรการควบคุมเชิงป้องกันเพื่อลดโอกาสเกิดหรือผลกระทบ', color: 'blue' },
    { id: 'Transfer', key: 'Transfer', name: 'โอนย้าย (Transfer)', labelTh: 'โอนย้าย (Transfer/Share)', labelEn: 'Transfer / Share', desc: 'ทำประกันภัย (CAR) หรือส่งต่อความเสี่ยงให้ซับคอนแทรคเตอร์', color: 'amber' },
    { id: 'Accept', key: 'Accept', name: 'ยอมรับ (Accept)', labelTh: 'ยอมรับ (Accept)', labelEn: 'Accept Risk', desc: 'ยอมรับความเสี่ยงคงเหลือพร้อมสำรองงบประมาณ Contingency Buffer', color: 'emerald' },
];

export type TorProjectTimeline =
    | 'Pre-Bid'
    | 'Proposal'
    | 'Mobilization'
    | 'Construction'
    | 'Commissioning'
    | 'Warranty';

export interface TorConstraint {
    id: string;
    type: 'LD' | 'Milestone' | 'Technical' | 'Warranty' | 'Financial' | 'Other';
    description: string;
    penaltyDetails?: string;
    severity: 'High' | 'Medium' | 'Low';
}

export type TorRiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface TorRiskItem {
    id: string;
    riskNo: string;                       // e.g. "TR-001"
    category: TorRiskCategory;
    cause: string;                         // สาเหตุรากเหง้า (Root Cause)
    riskEvent: string;                     // เหตุการณ์ความเสี่ยง (Risk Event)
    consequence: string;                   // ผลกระทบ (Consequence)
    torClauseRef: string;                  // ข้อ TOR อ้างอิง เช่น "TOR ข้อ 4.2 บทปรับ 0.1%/วัน"
    
    // Quantitative Scoring (ISO 31000 5x5)
    likelihood: number;                    // 1-5 (1: Rare -> 5: Almost Certain)
    impact: number;                        // 1-5 (1: Negligible -> 5: Severe)
    riskScore: number;                     // 1-25 (Likelihood x Impact)
    riskLevel: TorRiskLevel;               // Critical (15-25), High (10-14), Medium (5-9), Low (1-4)
    
    // Treatment & Contingency (ISO 31000 / EMV)
    treatmentStrategy: TorTreatmentStrategy;
    controlMeasures: string;               // มาตรการควบคุมเชิงป้องกัน
    contingencyPlan: string;               // แผนสำรองกรณีเกิดเหตุ
    estimatedImpactCost: number;           // มูลค่าความเสียหายคาดการณ์ (THB)
    probabilityPct: number;                // โอกาสเกิดเป็น % (เช่น 50%)
    emvValue: number;                      // EMV = (probabilityPct / 100) * estimatedImpactCost
    contingencyRationale: string;          // เหตุผล/สูตรคำนวณงบสำรอง
    proposalStrategy: string;              // ข้อเสนอแนะการปรับปรุงซองราคา/เทคนิค
    
    // Governance & Monitoring
    riskOwner: string;                     // ผู้รับผิดชอบ (e.g. Project Manager, Legal, Commercial Lead)
    timeline: TorProjectTimeline;          // ช่วงเวลาดำเนินการ
    kpiIndicator: string;                  // ตัวชี้วัดความเสี่ยง (Key Risk Indicator)
    status: 'Open' | 'In Progress' | 'Managed' | 'Closed';
}

export interface TorProject {
    id: string;
    proposalCode: string;                  // รหัสข้อเสนอ เช่น "PROP-2026-001"
    projectTitle: string;                  // ชื่อโครงการ
    clientName: string;                    // ชื่อลูกค้า/ผู้ว่าจ้าง
    submissionDeadline: string;            // กำหนดส่งซอง (YYYY-MM-DD)
    estimatedBudget: number;               // งบประมาณโครงการ (THB)
    currency: string;                      // "THB", "USD" etc.
    
    // Scope & Context
    objectives: string;                    // วัตถุประสงค์โครงการ
    scopeOfWork: string;                   // ขอบเขตงานสำคัญ
    constraints: TorConstraint[];          // ข้อจำกัดและบทลงโทษ LDs
    internalContext: string;               // บริบทภายใน (กำลังคน, เครื่องจักร, เงินทุน)
    externalContext: string;               // บริบทภายนอก (กฎหมาย, สภาพอากาศ, Vendor, อัตราแลกเปลี่ยน)
    
    // Risks
    risks: TorRiskItem[];
    
    // Strategic Advice & Approval
    strategicRecommendations: string;      // ข้อเสนอแนะเชิงกลยุทธ์สำหรับคณะกรรมการ
    signOffPreparer?: string;              // ผู้จัดทำ
    signOffReviewer?: string;              // ผู้ตรวจสอบ
    signOffApprover?: string;              // ผู้อนุมัติ
    signOffDate?: string;                  // วันที่ลงนาม
    
    // Metadata
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    lastUpdatedBy?: string;
}

// ─── Calculation & Helper Functions ──────────────────────────────────────────

export function getTorRiskScore(likelihood: number, impact: number): number {
    return Math.max(1, Math.min(5, likelihood || 1)) * Math.max(1, Math.min(5, impact || 1));
}

export function getTorRiskLevel(score: number): TorRiskLevel {
    if (score >= 15) return 'Critical';
    if (score >= 10) return 'High';
    if (score >= 5) return 'Medium';
    return 'Low';
}

export function getTorRiskLevelColor(level: TorRiskLevel): {
    bg: string;
    text: string;
    border: string;
    badge: string;
    dot: string;
} {
    switch (level) {
        case 'Critical':
            return {
                bg: 'bg-red-500/10 dark:bg-red-950/40',
                text: 'text-red-700 dark:text-red-400',
                border: 'border-red-300 dark:border-red-800',
                badge: 'bg-red-600 text-white font-bold',
                dot: 'bg-red-500',
            };
        case 'High':
            return {
                bg: 'bg-orange-500/10 dark:bg-orange-950/40',
                text: 'text-orange-700 dark:text-orange-400',
                border: 'border-orange-300 dark:border-orange-800',
                badge: 'bg-orange-500 text-white font-bold',
                dot: 'bg-orange-500',
            };
        case 'Medium':
            return {
                bg: 'bg-amber-500/10 dark:bg-amber-950/40',
                text: 'text-amber-700 dark:text-amber-400',
                border: 'border-amber-300 dark:border-amber-800',
                badge: 'bg-amber-500 text-white font-bold',
                dot: 'bg-amber-500',
            };
        case 'Low':
        default:
            return {
                bg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
                text: 'text-emerald-700 dark:text-emerald-400',
                border: 'border-emerald-300 dark:border-emerald-800',
                badge: 'bg-emerald-500 text-white font-bold',
                dot: 'bg-emerald-500',
            };
    }
}

export function calculateEMV(probabilityPct: number, impactCost: number): number {
    const p = Math.max(0, Math.min(100, probabilityPct || 0));
    const c = Math.max(0, impactCost || 0);
    return Math.round((p / 100) * c);
}

export function likelihoodToDefaultProbability(likelihood: number): number {
    switch (likelihood) {
        case 5: return 90;
        case 4: return 75;
        case 3: return 50;
        case 2: return 25;
        case 1:
        default: return 10;
    }
}
