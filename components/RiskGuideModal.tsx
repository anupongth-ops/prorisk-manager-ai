import React, { useState } from 'react';
import {
  X, BookOpen, AlertTriangle, Activity, TrendingDown, CheckCircle2,
  RotateCcw, Eye, ChevronRight, Info, Zap, Shield, Clock, Target,
  BarChart2, ArrowRight, Circle, Play, Award
} from 'lucide-react';
import { getRiskLevel, IMPACT_LABELS, LIKELIHOOD_LABELS, getRiskLevelColor, getRiskScore } from '../types';

interface RiskGuideModalProps {
  onClose: () => void;
}

type TabKey = 'overview' | 'step1' | 'step2' | 'step3' | 'matrix' | 'step4' | 'step5' | 'step6' | 'glossary';

const TAB_LIST: { key: TabKey; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'overview', label: 'ภาพรวม', icon: BookOpen, color: 'text-blue-600 dark:text-blue-400' },
  { key: 'step1', label: '1. ระบุความเสี่ยง', icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400' },
  { key: 'step2', label: '2. ผลกระทบ (Impact)', icon: Activity, color: 'text-red-600 dark:text-red-400' },
  { key: 'step3', label: '3. โอกาสเกิด (Likelihood)', icon: BarChart2, color: 'text-orange-600 dark:text-orange-400' },
  { key: 'matrix', label: 'Risk Matrix 5×5', icon: Zap, color: 'text-purple-600 dark:text-purple-400' },
  { key: 'step4', label: '4. กลยุทธ์จัดการ', icon: Shield, color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'step5', label: '5. Residual Risk', icon: TrendingDown, color: 'text-indigo-600 dark:text-indigo-400' },
  { key: 'step6', label: '6. ติดตาม & ทบทวน', icon: Eye, color: 'text-teal-600 dark:text-teal-400' },
  { key: 'glossary', label: 'คำศัพท์ & อ้างอิง', icon: Award, color: 'text-gray-600 dark:text-gray-400' },
];

const LEVEL_BADGE: Record<string, string> = {
  'Very Low':    'bg-emerald-500 text-white',
  'Low':         'bg-yellow-400 text-gray-900',
  'Significant': 'bg-orange-500 text-white',
  'Critical':    'bg-red-600 text-white',
  'Extreme':     'bg-red-950 text-white',
};

const LEVEL_BG: Record<string, string> = {
  'Very Low':    'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
  'Low':         'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  'Significant': 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  'Critical':    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  'Extreme':     'bg-slate-100 dark:bg-red-950/30 border-slate-300 dark:border-red-900',
};

// ── Interactive 5×5 Risk Matrix ──────────────────────────────────────────────
const InteractiveMatrix: React.FC = () => {
  const [hoveredCell, setHoveredCell] = useState<{ i: number; l: number } | null>(null);

  const getCellClass = (impact: number, likelihood: number) => {
    const level = getRiskLevel(impact, likelihood);
    const base = 'h-10 w-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold rounded cursor-pointer transition-all duration-150 select-none';
    const hovered = hoveredCell?.i === impact && hoveredCell?.l === likelihood ? 'ring-2 ring-white scale-110 z-10 relative' : '';
    switch (level) {
      case 'Very Low':    return `${base} bg-emerald-400 text-white ${hovered}`;
      case 'Low':         return `${base} bg-yellow-300 text-gray-900 ${hovered}`;
      case 'Significant': return `${base} bg-orange-400 text-white ${hovered}`;
      case 'Critical':    return `${base} bg-red-500 text-white ${hovered}`;
      case 'Extreme':     return `${base} bg-red-900 text-white ${hovered}`;
      default:            return `${base} bg-gray-200 text-gray-700 ${hovered}`;
    }
  };

  const activeLevel = hoveredCell ? getRiskLevel(hoveredCell.i, hoveredCell.l) : null;
  const activeScore = hoveredCell ? getRiskScore(hoveredCell.i, hoveredCell.l) : null;

  const levelRows = ['Severe', 'Major', 'Moderate', 'Minor', 'Insignificant'];

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[360px]">
          <thead>
            <tr>
              <th className="w-20 text-xs text-gray-400 dark:text-slate-500 font-medium pb-2 text-right pr-2">
                Impact ↓ / Likelihood →
              </th>
              {[1, 2, 3, 4, 5].map(l => (
                <th key={l} className="text-center pb-2">
                  <div className="text-xs font-bold text-gray-700 dark:text-slate-300">{l}</div>
                  <div className="text-[9px] text-gray-400 dark:text-slate-500 hidden sm:block">{LIKELIHOOD_LABELS[l]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[5, 4, 3, 2, 1].map((impact, rowIdx) => (
              <tr key={impact}>
                <td className="text-right pr-2 py-0.5">
                  <div className="text-xs font-bold text-gray-700 dark:text-slate-300">{impact}</div>
                  <div className="text-[9px] text-gray-400 dark:text-slate-500 hidden sm:block">{levelRows[rowIdx]}</div>
                </td>
                {[1, 2, 3, 4, 5].map(likelihood => {
                  const level = getRiskLevel(impact, likelihood);
                  const score = getRiskScore(impact, likelihood);
                  const shortLabel: Record<string, string> = {
                    'Very Low': 'VL', 'Low': 'L', 'Significant': 'S', 'Critical': 'C', 'Extreme': 'EX'
                  };
                  return (
                    <td key={likelihood} className="p-0.5">
                      <div
                        className={getCellClass(impact, likelihood)}
                        onMouseEnter={() => setHoveredCell({ i: impact, l: likelihood })}
                        onMouseLeave={() => setHoveredCell(null)}
                        title={`Impact: ${IMPACT_LABELS[impact]} (${impact}), Likelihood: ${LIKELIHOOD_LABELS[likelihood]} (${likelihood}) → ${level} (Score: ${score})`}
                      >
                        <span className="hidden sm:block">{shortLabel[level]}</span>
                        <span className="block sm:hidden text-[8px]">{score}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hover info */}
      {hoveredCell && activeLevel && (
        <div className={`rounded-xl border p-3 ${LEVEL_BG[activeLevel]} transition-all`}>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${LEVEL_BADGE[activeLevel]}`}>{activeLevel}</span>
            <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">
              Impact {hoveredCell.i} ({IMPACT_LABELS[hoveredCell.i]}) × Likelihood {hoveredCell.l} ({LIKELIHOOD_LABELS[hoveredCell.l]}) = Score {activeScore}
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-1">
        {(['Very Low', 'Low', 'Significant', 'Critical', 'Extreme'] as const).map(level => (
          <span key={level} className={`px-2 py-0.5 rounded-full text-xs font-bold ${LEVEL_BADGE[level]}`}>
            {level}
          </span>
        ))}
        <span className="text-xs text-gray-400 dark:text-slate-500 self-center">← เลื่อน mouse เหนือตารางเพื่อดูรายละเอียด</span>
      </div>
    </div>
  );
};

// ── Section components ───────────────────────────────────────────────────────
const StepBadge: React.FC<{ step: number; label: string; color: string }> = ({ step, label, color }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${color}`}>
      {step}
    </div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{label}</h3>
  </div>
);

const InfoCard: React.FC<{ title: string; desc: string; example?: string; color?: string; score?: string }> = ({
  title, desc, example, color = 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700', score
}) => (
  <div className={`border rounded-xl p-4 space-y-1 ${color}`}>
    <div className="flex items-center justify-between">
      <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm">{title}</span>
      {score && <span className="text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full px-2 py-0.5 text-gray-600 dark:text-slate-300 font-mono">{score}</span>}
    </div>
    <p className="text-xs text-gray-600 dark:text-slate-400">{desc}</p>
    {example && <p className="text-[11px] text-gray-400 dark:text-slate-500 italic">ตัวอย่าง: {example}</p>}
  </div>
);

// ── Tab content ───────────────────────────────────────────────────────────────
const OverviewTab: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
      <div className="flex items-center gap-3 mb-3">
        <BookOpen className="w-7 h-7" />
        <h3 className="text-xl font-bold">คู่มือการบริหารความเสี่ยงโครงการ</h3>
      </div>
      <p className="text-blue-100 text-sm leading-relaxed">
        อ้างอิงตามมาตรฐาน <strong className="text-white">EPM-03-014 Rev F3 (01-Feb-26)</strong> และ <strong className="text-white">ISO 31000:2018</strong> Risk Management Guidelines
        เพื่อช่วยให้วิศวกรโครงการสามารถประเมินและบริหารความเสี่ยงได้อย่างเป็นระบบ
      </p>
    </div>

    {/* Process flow */}
    <div>
      <h4 className="font-bold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
        <Play className="w-4 h-4 text-blue-500" />
        กระบวนการบริหารความเสี่ยง (ISO 31000:2018 Cl.6)
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { step: 1, title: 'ระบุความเสี่ยง', desc: 'Identify ความเสี่ยงทุกรูปแบบในโครงการ', color: 'bg-amber-500', tab: 'step1' },
          { step: 2, title: 'ประเมิน Impact', desc: 'วัดระดับผลกระทบ 1–5 ก่อนมาตรการ', color: 'bg-red-500', tab: 'step2' },
          { step: 3, title: 'ประเมิน Likelihood', desc: 'วัดโอกาสเกิด 1–5 ก่อนมาตรการ', color: 'bg-orange-500', tab: 'step3' },
          { step: 4, title: 'กำหนดกลยุทธ์', desc: 'เลือก Avoid / Transfer / Mitigate / Accept', color: 'bg-emerald-600', tab: 'step4' },
          { step: 5, title: 'Residual Risk', desc: 'ประเมินความเสี่ยงหลังมาตรการ', color: 'bg-indigo-600', tab: 'step5' },
          { step: 6, title: 'ติดตาม & ทบทวน', desc: 'Monitor ตามรอบ ISO 31000 Cl.6.6', color: 'bg-teal-600', tab: 'step6' },
        ].map((item, idx, arr) => (
          <div key={item.step} className="flex items-start gap-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-full ${item.color} text-white flex items-center justify-center font-bold text-sm flex-shrink-0`}>
              {item.step}
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-slate-100 text-sm">{item.title}</div>
              <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Risk Score formula */}
    <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-5 text-white">
      <h4 className="font-bold mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> สูตรคำนวณ Risk Score</h4>
      <div className="text-center py-3">
        <span className="text-3xl font-black tracking-tight">Risk Score = Impact × Likelihood</span>
        <p className="text-slate-400 text-sm mt-2">ช่วงคะแนน: 1 (ต่ำสุด) → 25 (สูงสุด)</p>
      </div>
      <div className="flex justify-center gap-3 flex-wrap mt-2">
        {(['Very Low', 'Low', 'Significant', 'Critical', 'Extreme'] as const).map(level => {
          const scores: Record<string, string> = {
            'Very Low': '1–2', 'Low': '3–6', 'Significant': '8–10', 'Critical': '12–16', 'Extreme': '20–25'
          };
          return (
            <div key={level} className={`px-3 py-1 rounded-full text-xs font-bold ${LEVEL_BADGE[level]}`}>
              {level}: {scores[level]}
            </div>
          );
        })}
      </div>
    </div>

    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
      <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-blue-800 dark:text-blue-300">
        <strong>เคล็ดลับ:</strong> ใช้ Tab ด้านซ้ายนำทางไปยังแต่ละขั้นตอน เพื่อเรียนรู้เกณฑ์การประเมินและตัวอย่างที่ถูกต้อง
      </p>
    </div>
  </div>
);

const Step1Tab: React.FC = () => (
  <div className="space-y-5">
    <StepBadge step={1} label="การระบุความเสี่ยง (Risk Identification)" color="bg-amber-500" />
    <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
      ขั้นตอนแรกของการบริหารความเสี่ยง คือการระบุและบันทึกความเสี่ยงทุกรูปแบบที่อาจเกิดขึ้นในโครงการ
      ก่อนดำเนินการใดๆ ให้ตั้งคำถามว่า <strong className="text-gray-900 dark:text-slate-200">"อะไรที่อาจทำให้โครงการไม่บรรลุเป้าหมาย?"</strong>
    </p>

    <div>
      <h4 className="font-bold text-gray-900 dark:text-slate-100 mb-3">หมวดหมู่ความเสี่ยง (Risk Categories)</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {[
          { cat: 'Construction', desc: 'ความเสี่ยงในขั้นตอนการก่อสร้าง', ex: 'งานล่าช้า, อุบัติเหตุในพื้นที่' },
          { cat: 'Engineering', desc: 'ความเสี่ยงด้านวิศวกรรม', ex: 'Design ผิดพลาด, แก้ไข Spec' },
          { cat: 'Procurement/Contract', desc: 'ความเสี่ยงด้านการจัดซื้อ', ex: 'Long Lead Items ล่าช้า' },
          { cat: 'Project Management', desc: 'ความเสี่ยงด้านบริหารโครงการ', ex: 'Scope Change, ทรัพยากรไม่พอ' },
          { cat: 'SHE', desc: 'ความปลอดภัย สุขภาพ สิ่งแวดล้อม', ex: 'อุบัติเหตุ, มลพิษ' },
          { cat: 'Operations/Commissioning', desc: 'ความเสี่ยงใน Commissioning', ex: 'ระบบทดสอบไม่ผ่าน' },
          { cat: 'Regulatory (Compliance)', desc: 'กฎระเบียบและข้อบังคับ', ex: 'ใบอนุญาตล่าช้า, กฎเปลี่ยน' },
          { cat: 'Strategic/Finance', desc: 'ความเสี่ยงเชิงกลยุทธ์', ex: 'อัตราดอกเบี้ย, ราคาวัตถุดิบ' },
          { cat: 'Quality', desc: 'ความเสี่ยงด้านคุณภาพ', ex: 'วัสดุไม่ได้มาตรฐาน, Rework' },
          { cat: 'Corporate', desc: 'ความเสี่ยงระดับองค์กร', ex: 'นโยบายเปลี่ยน, ผู้บริหารเปลี่ยน' },
          { cat: 'Government/Community', desc: 'ภาครัฐและชุมชน', ex: 'ร้องเรียนชุมชน, นโยบายรัฐ' },
          { cat: 'Technology/Systems', desc: 'ความเสี่ยงด้านเทคโนโลยี', ex: 'ระบบ IT ล้มเหลว, Cybersecurity' },
        ].map(item => (
          <div key={item.cat} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-3 space-y-0.5">
            <div className="font-semibold text-gray-900 dark:text-slate-100 text-xs">{item.cat}</div>
            <div className="text-[11px] text-gray-500 dark:text-slate-400">{item.desc}</div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 italic">เช่น: {item.ex}</div>
          </div>
        ))}
      </div>
    </div>

    <div>
      <h4 className="font-bold text-gray-900 dark:text-slate-100 mb-3">ผลกระทบที่ต้องระบุ (Possible Effects)</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          { code: 'C', name: 'Cost', desc: 'ต้นทุน / งบประมาณ' },
          { code: 'T', name: 'Time', desc: 'เวลา / Schedule' },
          { code: 'Q', name: 'Quality', desc: 'คุณภาพงาน' },
          { code: 'HS', name: 'Health & Safety', desc: 'สุขภาพและความปลอดภัย' },
          { code: 'E', name: 'Environment', desc: 'สิ่งแวดล้อม' },
          { code: 'R', name: 'Reputation', desc: 'ชื่อเสียงองค์กร' },
        ].map(item => (
          <div key={item.code} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-3 text-center">
            <div className="text-xl font-black text-blue-600 dark:text-blue-400">{item.code}</div>
            <div className="font-semibold text-gray-900 dark:text-slate-100 text-xs mt-0.5">{item.name}</div>
            <div className="text-[10px] text-gray-500 dark:text-slate-400">{item.desc}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 italic">* ความเสี่ยงหนึ่งรายการอาจส่งผลกระทบหลายด้านพร้อมกัน เช่น C+T+HS</p>
    </div>
  </div>
);

const Step2Tab: React.FC = () => {
  const [selectedImpactCategory, setSelectedImpactCategory] = useState<'financial' | 'she' | 'partners' | 'law' | 'reputation'>('financial');

  const impactData = [
    {
      level: 1,
      name: 'Insignificant (เล็กน้อยมาก)',
      color: 'bg-emerald-500',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      financial: '• Schedule Delay: X < 3% ของระยะเวลาโครงการ หรือ < 1 เดือน\n• Cost Overrun: X < 3% ของงบประมาณโครงการรวม\n• EBITDA: ผลกระทบ < 3% ต่อ EBITDA ปีแรก',
      she: '• Safety/Health: First Aid Case (ไม่มีผู้บาดเจ็บ หรือบาดเจ็บเล็กน้อยระดับปฐมพยาบาล) ไม่กระทบต่อสุขภาพและขวัญกำลังใจ\n• Environment: ไม่มีผลกระทบต่อสิ่งแวดล้อมตั้งต้น ควบคุมได้ ณ จุดเกิดเหตุ ไม่ต้องใช้เวลาฟื้นฟู',
      partners: '• Supplier: Retail partners ไม่พึงพอใจ/ร้องเรียนกลับ แต่ส่งมอบสินค้าได้บางส่วน\n• Customers: Retail customers ร้องเรียนกลับ ยอดขายลดลง < 5%',
      law: '• การไม่ปฏิบัติตามกฎหมาย/ข้อบังคับในลักษณะที่แก้ไขได้ง่ายดาย (Easily fixed)',
      reputation: '• Reputation: ส่งผลกระทบเล็กน้อยมากต่อชื่อเสียง สามารถดูดซับได้ด้วยกิจกรรมปกติ ผลกระทบชั่วคราวในพื้นที่\n• Negative News: ไม่เป็นกระแสในสื่อท้องถิ่น (Below target < 5%)'
    },
    {
      level: 2,
      name: 'Minor (เล็กน้อย)',
      color: 'bg-yellow-400 text-gray-900',
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
      financial: '• Schedule Delay: 3% ≤ X < 6% ของระยะเวลาโครงการ หรือ < 2 เดือน\n• Cost Overrun: 3% ≤ X < 6% ของงบประมาณโครงการรวม (ต้องขออนุมัติ BOD)\n• EBITDA: ผลกระทบ 3% ≤ X < 6% ต่อ EBITDA ปีแรก',
      she: '• Safety/Health: Minor Injuries ต้องรับการรักษาพยาบาล (Medical Treatment) หรือหยุดงานชั่วคราว (Restricted Work Case) ผลกระทบต่ำต่อขวัญกำลังใจระยะสั้น\n• Environment: ความเสียหายสิ่งแวดล้อมเล็กน้อย ใช้เวลาฟื้นฟู < 3 เดือน',
      partners: '• Supplier: ร้องเรียนด้วยวาจา (Verbal complaint) / Retail partners ไม่สามารถส่งมอบสินค้า/บริการได้\n• Customers: ร้องเรียนด้วยวาจา / ยอดขายลดลง 5-10%',
      law: '• อาจทำให้เกิดการไม่ปฏิบัติตามข้อกำหนดหรือมาตรฐานภายในบริษัท (Non-conformance)',
      reputation: '• Reputation: ผลกระทบเล็กน้อย แก้ไขได้ในระยะเวลาอันสั้น เกิดเหตุการณ์ส่งผลลบแต่ดูดซับได้ ผลกระทบระยะสั้นในพื้นที่\n• Negative News: ได้รับข้อร้องเรียนจากชุมชนผ่านช่องทางไม่เป็นทางการ มีข่าวในสื่อท้องถิ่น (5-10%)'
    },
    {
      level: 3,
      name: 'Moderate (ปานกลาง)',
      color: 'bg-orange-500 text-white',
      badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
      financial: '• Schedule Delay: 6% ≤ X < 10% ของระยะเวลาโครงการ หรือ < 3 เดือน\n• Cost Overrun: 6% ≤ X < 10% ของงบประมาณโครงการรวม\n• EBITDA: ผลกระทบ 6% ≤ X < 10% ต่อ EBITDA ปีแรก',
      she: '• Safety/Health: Serious Injuries ต้องรับการรักษาพยาบาล หรือสูญเสียวันทำงาน (Lost Work Case) ผลกระทบปานกลางต่อสุขภาพและขวัญกำลังใจระยะยาว\n• Environment: อันตรายปานกลางที่อาจส่งผลเป็นวงกว้าง ใช้เวลาฟื้นฟู 3-6 เดือน',
      partners: '• Supplier: Major partners ออกหนังสือร้องเรียนอย่างเป็นทางการ (Official Complaint) แต่ยังส่งมอบสินค้าได้บางส่วน\n• Customers: Major customers ออกหนังสือร้องเรียนอย่างเป็นทางการ ยอดขายลดลง 10-20%',
      law: '• อาจทำให้ผิดกฎหมาย หรือผิดระเบียบข้อบังคับบริษัท (Non-compliance with laws/Articles of association)',
      reputation: '• Reputation: กระทบชื่อเสียงปานกลาง สร้างความไม่พอใจให้ชุมชน/สาธารณชน ต้องใช้ความพยายามบริหารจัดการเพิ่มเติม\n• Negative News: มีข่าวเชิงลบเผยแพร่ในสื่อระดับจังหวัดและภูมิภาค (10-30%)'
    },
    {
      level: 4,
      name: 'Major (สูง / สำคัญ)',
      color: 'bg-red-500 text-white',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
      financial: '• Schedule Delay: X ≥ 10% ของระยะเวลาโครงการ หรือ > 3 เดือน\n• Cost Overrun: X ≥ 10% ของงบประมาณโครงการรวม\n• EBITDA: ผลกระทบ X ≥ 10% ต่อ EBITDA ปีแรก',
      she: '• Safety/Health: Major or Multiple Injuries - บาดเจ็บรุนแรง พิการทุพพลภาพ หรือถึงขั้นเสียชีวิต ทุพพลภาพ มีการประท้วงหรือร้องเรียนเป็นทางการ\n• Environment: อันตรายร้ายแรงส่งผลกระทบในท้องถิ่น สร้างความเสียหายมาก ใช้เวลาฟื้นฟู 6-12 เดือน',
      partners: '• Supplier: สูญเสียคู่ค้ารายใหญ่ (Lose major partners) ไม่สามารถส่งมอบสินค้า/บริการได้\n• Customers: สูญเสียลูกค้ารายใหญ่ ยอดขายลดลง > 20% ลูกค้าไม่สามารถชำระเงินได้',
      law: '• ผิดกฎหมายอาญาหรือแพ่ง ละเมิดกฎระเบียบบริษัท มีโทษทางอาญา ค่าปรับ หรือจำคุก',
      reputation: '• Reputation: ความเสียหายต่อชื่อเสียงรุนแรงจนขาดความเชื่อมั่น ต้องใช้ความพยายามบริหารจัดการพิเศษระดับวิกฤต\n• Negative News: มีข่าวเชิงลบในสื่อระดับชาติ (National level 30-50%)'
    },
    {
      level: 5,
      name: 'Severe (รุนแรงมาก / วิกฤต)',
      color: 'bg-red-900 text-white',
      badge: 'bg-red-950 text-red-200 border border-red-800',
      financial: '• Schedule Delay: X > 20% ของระยะเวลาโครงการ หรือ > 6 เดือน\n• Cost Overrun: X > 20% ของงบประมาณโครงการรวม\n• EBITDA: ผลกระทบ > 20% ต่อ EBITDA ปีแรก',
      she: '• Safety/Health: Fatalities (>1 person) เสียชีวิต 1 คนขึ้นไป/ทุพพลภาพหลายคน กระทบชุมชนรอบโรงงานต้องอพยพ > 1 ปี มีการนัดหยุดงาน (Strike) ยุติการทำงาน\n• Environment: อันตรายร้ายแรงส่งผลกระทบเป็นวงกว้าง ใช้เวลาฟื้นฟู > 1 ปี และมีโอกาสฟื้นฟูได้จำกัด',
      partners: '• Supplier: คู่ค้ายกเลิกสัญญาซื้อขายสินค้า/บริการ กระทบยอดขาย > 50% ต่อปี\n• Customers: ลูกค้าเกิดการต่อต้าน (Boycott) กระทบยอดขาย > 50% ต่อปี',
      law: '• [Black Swan] บริษัทถูกถอนชื่อออกจากตลาดหลักทรัพย์ (Delisted) ถูกสั่งให้หยุดดำเนินธุรกิจ ถูกเพิกถอนหรือระงับใบอนุญาต',
      reputation: '• [Black Swan] ชื่อเสียงเสียหายร้ายแรงระดับประเทศ กระทรวง/หน่วยงานรัฐเข้าตรวจสอบ มีโอกาสนำไปสู่การพังทลายของโครงการ (Collapse)\n• Negative News: มีข่าวเชิงลบในสื่อต่างประเทศ (Foreign media > 50%)'
    }
  ];

  return (
    <div className="space-y-5">
      <StepBadge step={2} label="เกณฑ์การประเมินผลกระทบ (Impact Definitions — EPM-03-014AT2)" color="bg-red-500" />
      <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
        อ้างอิงตามเอกสารมาตรฐานองค์กร <strong className="text-gray-900 dark:text-slate-200">EPM-03-014 Rev F3 (Page 14)</strong> กำหนดเกณฑ์การประเมินระดับผลกระทบ (Impact 1-5) ครอบคลุม 5 มิติหลัก ดังนี้:
      </p>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-slate-800 pb-2">
        {[
          { key: 'financial', label: '💰 Financial & Schedule', color: 'text-blue-600 border-blue-600' },
          { key: 'she', label: '🛡️ Safety, Health & Env', color: 'text-emerald-600 border-emerald-600' },
          { key: 'partners', label: '🤝 Supplier & Customers', color: 'text-amber-600 border-amber-600' },
          { key: 'law', label: '⚖️ Law & Regulation', color: 'text-purple-600 border-purple-600' },
          { key: 'reputation', label: '📢 Reputation & News', color: 'text-red-600 border-red-600' },
        ].map(cat => (
          <button
            key={cat.key}
            onClick={() => setSelectedImpactCategory(cat.key as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedImpactCategory === cat.key
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Level Cards */}
      <div className="space-y-3">
        {impactData.map(item => (
          <div key={item.level} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 transition shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center font-bold text-white text-sm shadow-sm`}>
                  {item.level}
                </span>
                <span className="font-bold text-sm text-gray-900 dark:text-slate-100">{item.name}</span>
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${item.badge}`}>
                Impact Level {item.level}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-line">
              {item[selectedImpactCategory]}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 dark:text-amber-300">
          <strong>หลักการประเมิน Impact (EPM-03-014):</strong> หากความเสี่ยงหนึ่งรายการส่งผลกระทบหลายมิติพร้อมกัน ให้เลือกระดับ Impact สูงสุด (Worst-case Impact) จากมิติที่ได้รับผลกระทบหนักที่สุด
        </div>
      </div>
    </div>
  );
};

const Step3Tab: React.FC = () => {
  const [selectedLikelihoodCategory, setSelectedLikelihoodCategory] = useState<'future' | 'past' | 'control' | 'experience'>('future');

  const likelihoodData = [
    {
      level: 1,
      name: 'Rarely (น้อยมาก < 5%)',
      color: 'bg-emerald-500 text-white',
      future: '• Probability < 5%\n• Highly unlikely to occur on this project (มีโอกาสเกิดน้อยมาก แทบไม่มีโอกาสเกิดขึ้นในโครงการนี้)',
      past: '• Never happened or may occur over a period of > 3 years (ไม่เคยเกิดขึ้น หรืออาจเกิดขึ้นนานกว่า 3 ปีขึ้นไป)',
      control: '• Work process is simple and less chance of error.\n• There is a good audit or control. Has a very good control ability. (ขั้นตอนการทำงานไม่ซับซ้อน โอกาสผิดพลาดน้อยมาก มีการตรวจสอบและควบคุมดีมาก)',
      experience: '• Have direct experience in that business or job (มีประสบการณ์ตรงในธุรกิจหรือประเภทงานนั้นๆ)'
    },
    {
      level: 2,
      name: 'Unlikely (น้อย 5% - 10%)',
      color: 'bg-yellow-400 text-gray-900',
      future: '• Probability 5% - 10%\n• Given current practices and procedures, this event is unlikely to occur on this project (ภายใต้แนวปฏิบัติและขั้นตอนปัจจุบัน เหตุการณ์นี้ไม่น่าจะเกิดขึ้นในโครงการนี้)',
      past: '• Has happened 1 time in the past 3 years in an industry or business or system similar to that of GCME (เคยเกิดขึ้น 1 ครั้งในรอบ 3 ปีในอุตสาหกรรม/ระบบที่คล้ายคลึงกับ GCME)',
      control: '• The workflow is more complicated. But there is also good monitoring or control. Have good control ability. (ขั้นตอนซับซ้อนขึ้น แต่มีการติดตามและควบคุมที่ดี)',
      experience: '• Very experienced in a similar business or type of work (มีความเชี่ยวชาญ/ประสบการณ์สูงในงานประเภทใกล้เคียง)'
    },
    {
      level: 3,
      name: 'Occasional (ปานกลาง > 10% - 25%)',
      color: 'bg-orange-500 text-white',
      future: '• Probability > 10% - 25%\n• This event has occurred on a similar project (เหตุการณ์นี้เคยเกิดขึ้นในโครงการที่คล้ายคลึงกันมาก่อน)',
      past: '• Has happened more than once in the past 3 years in an industry or business or system similar to that of GCME (เคยเกิดขึ้นมากกว่า 1 ครั้งในรอบ 3 ปีในอุตสาหกรรมที่คล้ายกัน)',
      control: '• The work process is complicated. But there is a check or moderately controlled. Have some or moderate control ability. (ขั้นตอนซับซ้อน มีการตรวจสอบ/ควบคุมระดับปานกลาง)',
      experience: '• Have some or moderate experience in that business or job (มีประสบการณ์ปานกลางในงานนั้นๆ)'
    },
    {
      level: 4,
      name: 'Likely (สูง > 25% - 50%)',
      color: 'bg-red-500 text-white',
      future: '• Probability > 25% - 50%\n• Event is Likely to occur on this project (เหตุการณ์มีแนวโน้มสูงที่จะเกิดขึ้นในโครงการนี้)',
      past: '• Has happened 1 time locally or more times in the GCME in the past 1 year (เคยเกิดขึ้น 1 ครั้งในพื้นที่ หรือหลายครั้งใน GCME ในรอบ 1 ปีที่ผ่านมา)',
      control: '• The work process is complicated, and there are few checks or still have little control. Little control ability. (ขั้นตอนซับซ้อน มีการตรวจสอบน้อย การควบคุมต่ำ)',
      experience: '• Little experience in that business or job (มีประสบการณ์น้อยในงานนั้นๆ)'
    },
    {
      level: 5,
      name: 'Most Likely (สูงมาก > 50%)',
      color: 'bg-red-900 text-white',
      future: '• Probability > 50%\n• Event is very likely to occur on this project, possibly several times (มีความน่าจะเป็นสูงมากที่จะเกิดขึ้นในโครงการนี้ และอาจเกิดขึ้นหลายครั้ง)',
      past: '• Has happened more than 1 time locally in the past 1 year in GCME (เคยเกิดขึ้นมากกว่า 1 ครั้งในพื้นที่ในรอบ 1 ปีที่ผ่านมาใน GCME)',
      control: '• The workflow is very complicated, and no inspection or has never been regulated. There is little or no control ability. (ขั้นตอนซับซ้อนมาก ไม่มีระบบตรวจสอบ แทบควบคุมไม่ได้)',
      experience: '• Little or no experience in that business or job (แทบไม่มีหรือไม่มีประสบการณ์ในงานนั้นเลย)'
    }
  ];

  return (
    <div className="space-y-5">
      <StepBadge step={3} label="เกณฑ์การประเมินโอกาสเกิด (Likelihood Definitions — EPM-03-014AT2)" color="bg-orange-500" />
      <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
        อ้างอิงตามเอกสารมาตรฐานองค์กร <strong className="text-gray-900 dark:text-slate-200">EPM-03-014 Rev F3 (Page 15)</strong> ประเมินโอกาสเกิด (Likelihood 1-5) จาก 4 มิติเชิงประจักษ์:
      </p>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-slate-800 pb-2">
        {[
          { key: 'future', label: '🔮 Probability of Future Events', color: 'text-orange-600' },
          { key: 'past', label: '📜 Probability of Past Events', color: 'text-blue-600' },
          { key: 'control', label: '⚙️ Work Process & Control', color: 'text-emerald-600' },
          { key: 'experience', label: '🎓 Past Experience & Success', color: 'text-purple-600' },
        ].map(cat => (
          <button
            key={cat.key}
            onClick={() => setSelectedLikelihoodCategory(cat.key as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedLikelihoodCategory === cat.key
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Level Cards */}
      <div className="space-y-3">
        {likelihoodData.map(item => (
          <div key={item.level} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 transition shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center font-bold text-sm shadow-sm`}>
                  {item.level}
                </span>
                <span className="font-bold text-sm text-gray-900 dark:text-slate-100">{item.name}</span>
              </div>
              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                Level {item.level}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-line">
              {item[selectedLikelihoodCategory]}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-orange-800 dark:text-orange-300">
          <strong>หลักการประเมิน Likelihood (EPM-03-014):</strong> พิจารณาจากทั้ง 4 มิติร่วมกัน ได้แก่ โอกาสในอนาคต, สถิติในอดีต, ความซับซ้อน/ระบบควบคุมงาน และประสบการณ์ของทีมงาน เพื่อให้ระดับ Likelihood สะท้อนความจริงที่สุด
        </div>
      </div>
    </div>
  );
};

const MatrixTab: React.FC = () => (
  <div className="space-y-5">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
        <Zap className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Risk Matrix 5×5 (Interactive)</h3>
    </div>
    <p className="text-sm text-gray-600 dark:text-slate-400">
      เลื่อน Mouse เหนือแต่ละช่องเพื่อดูระดับความเสี่ยงและ Score แบบ Interactive
    </p>

    <InteractiveMatrix />

    {/* Level details */}
    <h4 className="font-bold text-gray-900 dark:text-slate-100 mt-4">คำอธิบายระดับความเสี่ยงและการดำเนินการ</h4>
    <div className="space-y-3">
      {[
        { level: 'Very Low', scores: '1–2', action: 'รับรู้และติดตามตามปกติ ไม่ต้องดำเนินการพิเศษ', response: 'Accept — บันทึกและติดตามปกติ', urgency: 'ต่ำ' },
        { level: 'Low', scores: '3–6', action: 'ต้องมีแผนติดตามและเฝ้าระวัง มีแผนสำรอง', response: 'Accept / Mitigate', urgency: 'ปกติ' },
        { level: 'Significant', scores: '8–10', action: 'ต้องมีแผนลดความเสี่ยงที่ชัดเจน รายงานผู้บังคับบัญชา', response: 'Mitigate / Transfer', urgency: 'ปานกลาง' },
        { level: 'Critical', scores: '12–16', action: 'ต้องดำเนินการทันที มีแผนฉุกเฉิน Escalate ถึงผู้บริหาร', response: 'Avoid / Transfer / Mitigate', urgency: 'เร่งด่วน' },
        { level: 'Extreme', scores: '20–25', action: 'ต้องหยุดงาน/ยุติกิจกรรม Escalate ถึงผู้บริหารสูงสุดทันที', response: 'Avoid หรือ Stop Work', urgency: 'วิกฤต' },
      ].map(item => (
        <div key={item.level} className={`border rounded-xl p-4 ${LEVEL_BG[item.level]}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${LEVEL_BADGE[item.level]}`}>{item.level}</span>
            <span className="text-xs text-gray-500 dark:text-slate-400">Score: {item.scores}</span>
            <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${item.urgency === 'วิกฤต' ? 'bg-red-900 text-white' : item.urgency === 'เร่งด่วน' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : item.urgency === 'ปานกลาง' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
              {item.urgency}
            </span>
          </div>
          <p className="text-xs text-gray-700 dark:text-slate-300 mb-1">{item.action}</p>
          <p className="text-[11px] text-gray-500 dark:text-slate-400 italic">กลยุทธ์แนะนำ: {item.response}</p>
        </div>
      ))}
    </div>
  </div>
);

const Step4Tab: React.FC = () => (
  <div className="space-y-5">
    <StepBadge step={4} label="กลยุทธ์การจัดการความเสี่ยง (Risk Treatment Strategy)" color="bg-emerald-600" />
    <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
      หลังจากประเมิน Initial Risk และได้ Risk Level แล้ว ให้เลือกกลยุทธ์ที่เหมาะสมและกำหนด Action Plan ที่ชัดเจน
    </p>

    <div className="space-y-4">
      {[
        {
          code: 'A', name: 'Avoid — หลีกเลี่ยง', color: 'border-red-400 bg-red-50 dark:bg-red-900/15',
          badge: 'bg-red-600 text-white',
          desc: 'เปลี่ยนแผนงาน วิธีการ หรือขอบเขตโครงการเพื่อไม่ให้ความเสี่ยงเกิดขึ้น',
          when: 'เมื่อ Risk Level = Extreme หรือ Critical และไม่สามารถลดได้เพียงพอ',
          examples: ['เปลี่ยนวิธีการก่อสร้างที่มีความเสี่ยงสูง', 'ยกเลิก Scope ที่มีความเสี่ยงไม่คุ้มค่า', 'เลือก Contractor ที่มีประสบการณ์มากกว่า'],
        },
        {
          code: 'T', name: 'Transfer — โอนถ่าย', color: 'border-blue-400 bg-blue-50 dark:bg-blue-900/15',
          badge: 'bg-blue-600 text-white',
          desc: 'ถ่ายโอนผลกระทบทางการเงินหรือการจัดการไปยังบุคคลที่สาม',
          when: 'เมื่อ Risk ด้านการเงินสูง หรือมี Third Party ที่เหมาะสมกว่า',
          examples: ['ทำประกันภัย All Risk', 'ระบุ Penalty Clause ในสัญญา Subcontractor', 'ใช้ Subcontract สำหรับงานเสี่ยงสูง'],
        },
        {
          code: 'M', name: 'Mitigate — ลดความเสี่ยง', color: 'border-orange-400 bg-orange-50 dark:bg-orange-900/15',
          badge: 'bg-orange-500 text-white',
          desc: 'ดำเนินการเพื่อลด Impact หรือ Likelihood ให้อยู่ในระดับที่ยอมรับได้',
          when: 'กลยุทธ์ที่ใช้บ่อยที่สุด — เหมาะกับ Risk Level Significant และ Critical',
          examples: ['จัดทำแผนสำรองและทางเลือก', 'เพิ่มทรัพยากรและการตรวจสอบ', 'ประชุมติดตามรายสัปดาห์'],
        },
        {
          code: 'AC', name: 'Accept — ยอมรับ', color: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/15',
          badge: 'bg-emerald-600 text-white',
          desc: 'ยอมรับความเสี่ยง โดยติดตามและเตรียมรับมือหากเกิดขึ้น',
          when: 'เมื่อ Risk Level = Very Low หรือ Low และต้นทุนการจัดการสูงกว่าผลกระทบ',
          examples: ['บันทึกและติดตามใน Risk Register', 'กำหนด Trigger เพื่อ Escalate หากสถานการณ์เปลี่ยน', 'จัดสรร Contingency Reserve'],
        },
      ].map(item => (
        <div key={item.code} className={`border-2 rounded-2xl p-5 ${item.color}`}>
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-2xl font-black px-3 py-1 rounded-xl ${item.badge}`}>{item.code}</span>
            <h4 className="font-bold text-gray-900 dark:text-slate-100 text-base">{item.name}</h4>
          </div>
          <p className="text-sm text-gray-700 dark:text-slate-300 mb-2">{item.desc}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 italic mb-3">ใช้เมื่อ: {item.when}</p>
          <div>
            <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">ตัวอย่าง Action Plan:</span>
            <ul className="mt-1 space-y-0.5">
              {item.examples.map((ex, i) => (
                <li key={i} className="text-xs text-gray-600 dark:text-slate-400 flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                  {ex}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>

    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex gap-3">
      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-emerald-800 dark:text-emerald-300">
        <strong>Action Plan ที่ดีต้องมี:</strong> ขั้นตอนที่ชัดเจน → ผู้รับผิดชอบ (Owner) → กำหนดส่ง (Deadline) → วิธีวัดผล
      </div>
    </div>
  </div>
);

const Step5Tab: React.FC = () => (
  <div className="space-y-5">
    <StepBadge step={5} label="ความเสี่ยงคงเหลือ (Residual Risk & Mitigation Criteria)" color="bg-indigo-600" />
    <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
      หลังจากกำหนด Action Plan แล้ว ให้ประเมิน <strong className="text-gray-900 dark:text-slate-200">Residual Risk</strong> ซึ่งเป็นระดับความเสี่ยงที่คงเหลืออยู่ภายหลังจากการดำเนินมาตรการป้องกันและแก้ไข
    </p>

    {/* Standard Justification Box */}
    <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-5 text-white shadow-md">
      <h4 className="font-bold text-sm text-blue-200 flex items-center gap-2 mb-2">
        <Award className="w-5 h-5 text-yellow-400" />
        คำถาม: สามารถประเมินลดระดับจาก Critical มาเป็น Low ได้หรือไม่? เพราะอะไร?
      </h4>
      <p className="text-xs text-blue-100 leading-relaxed mb-3">
        <strong>ตอบ: สามารถทำได้ และเป็นเป้าหมายหลักของการบริหารความเสี่ยง!</strong> ตามมาตรฐานสากล <strong>ISO 31000:2018 Clause 6.5 (Risk Treatment)</strong> และ <strong>PMBOK® 7th Edition</strong> 
        เป้าหมายของ Risk Treatment คือการวางมาตรการเพื่อกดความเสี่ยงให้อยู่ในระดับที่ยอมรับได้ (Target / Residual Risk Appetite Level) ซึ่งโดยทั่วไปคือระดับ <strong>Low</strong> หรือ <strong>Very Low</strong>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-black/20 p-3 rounded-xl border border-white/10">
        <div>
          <span className="font-bold text-yellow-300">🟢 การลด Residual Likelihood:</span>
          <p className="text-blue-100">เน้นมาตรการป้องกันที่ต้นเหตุ (Prevention Controls) ไม่ให้เกิดเหตุการณ์ เช่น จัดซื้อล่วงหน้า, คัดเลือก Supplier</p>
        </div>
        <div>
          <span className="font-bold text-yellow-300">🟢 การลด Residual Impact:</span>
          <p className="text-blue-100">เน้นมาตรการบรรเทาความเสียหาย (Mitigation & Recovery) หากเกิดเหตุ เช่น มีแผนฉุกเฉิน, จัดซื้อสำรอง, ทำประกันภัย</p>
        </div>
      </div>
    </div>

    {/* Diagram & Detailed Example */}
    <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-5 text-white">
      <h4 className="font-bold mb-3 text-center text-sm text-slate-300">ตัวอย่างกรณีศึกษา: การลดความเสี่ยงจาก Critical ➔ Low</h4>
      <div className="flex items-center gap-2 justify-center flex-wrap mb-4">
        <div className="bg-red-900/60 border border-red-700 rounded-xl p-3 text-center min-w-[130px]">
          <div className="text-[10px] text-red-300 uppercase tracking-widest font-bold mb-1">Initial Risk</div>
          <div className="text-white text-xs">Impact: 4 (Major)</div>
          <div className="text-white text-xs">Likelihood: 4 (Likely)</div>
          <div className="mt-1.5 bg-red-600 rounded-full px-2.5 py-0.5 text-xs font-bold shadow">Critical (Score 16)</div>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-left max-w-[220px]">
          <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">Action Plan (Mitigation)</div>
          <p className="text-[11px] text-slate-300 leading-tight">1. ส่งทีม Expediting ประจำโรงงานผู้ผลิต (ลด Likelihood)</p>
          <p className="text-[11px] text-slate-300 leading-tight mt-1">2. ทำสัญญาจัดซื้อสำรองในประเทศ (ลด Impact)</p>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
        <div className="bg-emerald-950/60 border border-emerald-700 rounded-xl p-3 text-center min-w-[130px]">
          <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold mb-1">Residual Risk</div>
          <div className="text-white text-xs">Impact: 2 (Minor)</div>
          <div className="text-white text-xs">Likelihood: 2 (Unlikely)</div>
          <div className="mt-1.5 bg-yellow-400 text-gray-900 rounded-full px-2.5 py-0.5 text-xs font-bold shadow">Low (Score 4)</div>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 italic text-center">
        * ตัวอย่าง: อุปกรณ์ Control Valve ส่งมอบล่าช้า — การมีคู่ค้าสำรองช่วยลด Impact จาก Major (4) เป็น Minor (2) และการเร่งรัดช่วยลด Likelihood จาก Likely (4) เป็น Unlikely (2)
      </p>
    </div>

    {/* Rules & Warnings */}
    <div className="space-y-3">
      <h4 className="font-bold text-gray-900 dark:text-slate-100">หลักเกณฑ์และข้อควรระวังในการประเมิน (ISO 31000 & IEC 31010)</h4>
      {[
        { ok: true, rule: 'Residual Risk ต้องมี Action Plan ที่เป็นรูปธรรมและพิสูจน์ได้รองรับ', detail: 'ห้ามลดคะแนนโดยไม่มีมาตรการจริง (หลีกเลี่ยง Optimism Bias)' },
        { ok: true, rule: 'Residual Risk ต้องน้อยกว่าหรือเท่ากับ Initial Risk เสมอ', detail: 'มาตรการควบคุมไม่สามารถทำให้ความเสี่ยงตั้งต้นเพิ่มสูงขึ้นได้' },
        { ok: false, rule: 'การใส่เพียง "จัดประชุมติดตาม" ไม่สามารถลด Impact จาก Severe (5) เหลือ Insignificant (1) ได้', detail: 'การประชุมช่วยเตือนสติ (ลด Likelihood) แต่ไม่ลดความเสียหายการเงินหรือเวลาที่เกิดขึ้นจริง' },
        { ok: true, rule: 'เป้าหมายคือลด Residual Risk ให้อยู่ใน Risk Appetite (Low/Very Low)', detail: 'หาก Residual Risk ยังสูงกว่า Risk Appetite ต้องเพิ่มมาตรการควบคุมเพิ่มเติม' },
      ].map((item, i) => (
        <div key={i} className={`flex gap-3 p-3 rounded-xl border ${item.ok ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
          {item.ok
            ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            : <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          }
          <div>
            <div className={`text-sm font-semibold ${item.ok ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}`}>{item.rule}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{item.detail}</div>
          </div>
        </div>
      ))}
    </div>

    {/* International Standards Reference Table */}
    <div>
      <h4 className="font-bold text-gray-900 dark:text-slate-100 mb-2">มาตรฐานสากลอ้างอิง (International Standards Reference)</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-3 rounded-xl">
          <span className="font-bold text-blue-600 dark:text-blue-400">ISO 31000:2018 Cl. 6.5</span>
          <p className="text-gray-600 dark:text-slate-400 mt-1">กำหนดขั้นตอน Risk Treatment เพื่อเลือกตัวเลือกการจัดการความเสี่ยงและประเมินประสิทธิผลของ Residual Risk</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-3 rounded-xl">
          <span className="font-bold text-blue-600 dark:text-blue-400">PMI PMBOK® 7th Edition</span>
          <p className="text-gray-600 dark:text-slate-400 mt-1">การวางแผน Plan Risk Responses มีเป้าหมายเพื่อกดความเสี่ยงให้อยู่ในเขต Acceptable Threshold</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-3 rounded-xl">
          <span className="font-bold text-blue-600 dark:text-blue-400">COSO ERM Framework 2017</span>
          <p className="text-gray-600 dark:text-slate-400 mt-1">Principle 13: เลือก Risk Response เพื่อให้ความเสี่ยงคงเหลือสอดคล้องกับ Risk Appetite ขององค์กร</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-3 rounded-xl">
          <span className="font-bold text-blue-600 dark:text-blue-400">IEC 31010:2019</span>
          <p className="text-gray-600 dark:text-slate-400 mt-1">การประเมิน Control Effectiveness เพื่อวัดการเปลี่ยนแปลงของ Likelihood และ Consequence ก่อนและหลังมีมาตรการ</p>
        </div>
      </div>
    </div>
  </div>
);

const Step6Tab: React.FC = () => (
  <div className="space-y-5">
    <StepBadge step={6} label="การติดตามและทบทวน (Monitor & Review — ISO 31000 Cl.6.6)" color="bg-teal-600" />
    <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
      หลังจากบันทึกและดำเนินมาตรการแล้ว ต้องติดตามและทบทวนความเสี่ยงตามรอบที่กำหนดอย่างต่อเนื่อง
      ระบบจะแจ้งเตือนอัตโนมัติเมื่อถึงรอบทบทวน (Overdue Alert)
    </p>

    <div className="space-y-3">
      <h4 className="font-bold text-gray-900 dark:text-slate-100">รอบการทบทวนและความเสี่ยงที่เหมาะสม</h4>
      {[
        { freq: 'Monthly', days: '30 วัน', color: 'bg-red-600 text-white', riskLevel: 'Critical / Extreme', guide: 'โครงการขนาดใหญ่ หรือความเสี่ยงที่อยู่ในช่วงวิกฤต ต้องติดตามรายเดือน' },
        { freq: 'Bi-monthly', days: '60 วัน', color: 'bg-orange-500 text-white', riskLevel: 'Significant', guide: 'ความเสี่ยงระดับ Significant ที่ Action Plan กำลังดำเนินการ' },
        { freq: 'Quarterly', days: '90 วัน', color: 'bg-yellow-400 text-gray-900', riskLevel: 'Low', guide: 'ความเสี่ยงระดับ Low ที่มีมาตรการควบคุมที่ดี' },
        { freq: 'Semi-Annually', days: '180 วัน', color: 'bg-emerald-500 text-white', riskLevel: 'Very Low', guide: 'ความเสี่ยงระดับต่ำมากในโครงการระยะยาว' },
        { freq: 'Annually', days: '365 วัน', color: 'bg-emerald-700 text-white', riskLevel: 'Very Low (เสถียร)', guide: 'ความเสี่ยงที่มีเสถียรภาพสูงและไม่น่าจะเปลี่ยนแปลง' },
      ].map(item => (
        <div key={item.freq} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 flex gap-4">
          <div className={`${item.color} rounded-xl px-3 py-2 text-center flex-shrink-0 shadow-sm`}>
            <div className="font-black text-sm whitespace-nowrap">{item.freq}</div>
            <div className="text-[10px] opacity-80">{item.days}</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 dark:text-slate-100 text-sm">{item.riskLevel}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{item.guide}</div>
          </div>
        </div>
      ))}
    </div>

    <div className="space-y-3">
      <h4 className="font-bold text-gray-900 dark:text-slate-100">สถานะความเสี่ยง (Risk Status)</h4>
      {[
        { status: 'Open', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', icon: Circle, desc: 'ความเสี่ยงที่ระบุแล้ว รอดำเนินการ — ยังไม่เริ่ม Action Plan' },
        { status: 'In Progress', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400', icon: RotateCcw, desc: 'กำลังดำเนินการตาม Action Plan — มีความคืบหน้าแต่ยังไม่เสร็จสิ้น' },
        { status: 'Closed', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', icon: CheckCircle2, desc: 'Action Plan เสร็จสิ้น หรือความเสี่ยงนั้นไม่เกิดขึ้น — ไม่ส่งแจ้งเตือน Overdue' },
      ].map(item => (
        <div key={item.status} className="flex gap-3 items-start p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${item.color}`}>{item.status}</span>
          <span className="text-xs text-gray-600 dark:text-slate-400">{item.desc}</span>
        </div>
      ))}
    </div>

    <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4 flex gap-3">
      <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-teal-800 dark:text-teal-300">
        <strong>ระบบ Overdue Alert:</strong> เมื่อถึงรอบทบทวนหรือ Deadline เกินกำหนด ระบบจะแสดงสัญลักษณ์ ⚠️ และ Admin
        สามารถส่ง Email แจ้งเตือนไปยัง Project Manager ได้ผ่านเมนู Admin → Overdue Email Alerts
      </div>
    </div>
  </div>
);

const GlossaryTab: React.FC = () => (
  <div className="space-y-5">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
        <Award className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">คำศัพท์และข้อมูลอ้างอิง</h3>
    </div>

    <div className="space-y-2">
      {[
        { term: 'Risk', def: 'ความไม่แน่นอนที่มีผลต่อวัตถุประสงค์ของโครงการ (ISO 31000)' },
        { term: 'Initial Risk', def: 'ระดับความเสี่ยงก่อนดำเนินมาตรการใดๆ (Inherent Risk)' },
        { term: 'Residual Risk', def: 'ระดับความเสี่ยงที่คงเหลือหลังจากดำเนินมาตรการแล้ว' },
        { term: 'Risk Appetite', def: 'ระดับความเสี่ยงที่องค์กรยอมรับได้โดยไม่ต้องดำเนินการพิเศษ' },
        { term: 'Risk Matrix', def: 'ตารางแสดงความสัมพันธ์ระหว่าง Impact และ Likelihood เพื่อจัดระดับความเสี่ยง' },
        { term: 'Risk Owner', def: 'บุคคลที่รับผิดชอบในการดำเนินการและติดตาม Action Plan' },
        { term: 'Risk Register', def: 'ทะเบียนความเสี่ยงที่บันทึกข้อมูลความเสี่ยงทั้งหมดของโครงการ' },
        { term: 'Action Plan', def: 'แผนการดำเนินงานเพื่อลด โอนถ่าย หลีกเลี่ยง หรือยอมรับความเสี่ยง' },
        { term: 'Escalate', def: 'การรายงานความเสี่ยงระดับสูงไปยังผู้บริหารระดับที่สูงกว่าเพื่อตัดสินใจ' },
        { term: 'Critical Path', def: 'เส้นทางของกิจกรรมที่กำหนดระยะเวลาขั้นต่ำของโครงการ' },
        { term: 'Long Lead Item', def: 'อุปกรณ์หรือวัสดุที่มีระยะเวลานำส่ง (Lead Time) ยาวนาน' },
        { term: 'Overdue', def: 'ความเสี่ยงที่เกินกำหนดทบทวน (Next Review Date) หรือเกิน Deadline แล้ว' },
      ].map(item => (
        <div key={item.term} className="flex gap-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-3">
          <span className="font-bold text-blue-600 dark:text-blue-400 text-sm flex-shrink-0 min-w-[120px]">{item.term}</span>
          <span className="text-xs text-gray-600 dark:text-slate-400">{item.def}</span>
        </div>
      ))}
    </div>

    <div className="bg-slate-900 rounded-2xl p-5 text-white">
      <h4 className="font-bold mb-3">📚 เอกสารอ้างอิง</h4>
      <div className="space-y-2 text-sm">
        {[
          { label: 'เอกสารหลัก', value: 'EPM-03-014 Project Risk Management Rev F3 (01-Feb-26)' },
          { label: 'มาตรฐานสากล', value: 'ISO 31000:2018 Risk Management — Guidelines' },
          { label: 'แบบฟอร์ม', value: 'EPM-03-014AT1 – Typical Project Risk Register.xlsx' },
          { label: 'ระบบ', value: 'Risk Manager E-PO-PM v0.2 (2026-07-17)' },
        ].map(item => (
          <div key={item.label} className="flex gap-2">
            <span className="text-slate-400 flex-shrink-0">{item.label}:</span>
            <span className="text-slate-200">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Main Modal ────────────────────────────────────────────────────────────────
const TAB_CONTENT: Record<TabKey, React.FC> = {
  overview: OverviewTab,
  step1: Step1Tab,
  step2: Step2Tab,
  step3: Step3Tab,
  matrix: MatrixTab,
  step4: Step4Tab,
  step5: Step5Tab,
  step6: Step6Tab,
  glossary: GlossaryTab,
};

export const RiskGuideModal: React.FC<RiskGuideModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const currentIdx = TAB_LIST.findIndex(t => t.key === activeTab);
  const canPrev = currentIdx > 0;
  const canNext = currentIdx < TAB_LIST.length - 1;

  const ContentComponent = TAB_CONTENT[activeTab];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-white/10 dark:border-slate-800">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">คู่มือการประเมินความเสี่ยงโครงการ</h2>
              <p className="text-[11px] text-blue-300">EPM-03-014 Rev F3 | ISO 31000:2018</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Sidebar tabs — desktop */}
          <div className="hidden md:flex flex-col w-52 border-r border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex-shrink-0 overflow-y-auto">
            {TAB_LIST.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2.5 px-4 py-3 text-left text-xs font-medium transition-all border-b border-gray-100 dark:border-slate-800/60 group
                    ${isActive
                      ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border-r-2 border-r-blue-600'
                      : 'text-gray-500 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-slate-300'
                    }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? tab.color : 'text-gray-400 dark:text-slate-600 group-hover:' + tab.color}`} />
                  <span className="leading-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile tab selector */}
          <div className="md:hidden w-full absolute" />

          {/* Content area */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
            {/* Mobile tab strip */}
            <div className="md:hidden flex overflow-x-auto border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex-shrink-0 scrollbar-hide">
              {TAB_LIST.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-all border-b-2
                      ${isActive ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800' : 'border-transparent text-gray-400 dark:text-slate-500'}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="whitespace-nowrap max-w-[60px] truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <ContentComponent />
            </div>

            {/* Footer navigation */}
            <div className="border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3 flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => canPrev && setActiveTab(TAB_LIST[currentIdx - 1].key)}
                disabled={!canPrev}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                ← ก่อนหน้า
              </button>
              <span className="text-xs text-gray-400 dark:text-slate-500">
                {currentIdx + 1} / {TAB_LIST.length}
              </span>
              <button
                onClick={() => canNext && setActiveTab(TAB_LIST[currentIdx + 1].key)}
                disabled={!canNext}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                ถัดไป →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
