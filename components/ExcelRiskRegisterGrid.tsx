import React, { useState, useEffect, useMemo } from 'react';
import {
  Save, Plus, Trash2, Copy, AlertCircle, CheckCircle2,
  FileSpreadsheet, Filter, Search, RotateCcw, Calendar,
  ChevronDown, ChevronUp, ArrowUpDown, ArrowLeft, Loader2, Info, Sparkles, HelpCircle
} from 'lucide-react';
import {
  RiskItem, ImpactLevel, LikelihoodLevel, PossibleEffect,
  MitigationStrategy, CostToMitigate, ProbabilityOfSuccess,
  getRiskLevel, getRiskLevelColor, getRiskScore,
  RISK_CATEGORIES, EFFECT_LABELS, STRATEGY_LABELS,
  formatDateDisplay, UserProfile
} from '../types';

interface ExcelRiskRegisterGridProps {
  risks: RiskItem[];
  uniqueProjectData: Array<{ projectNo: string; projectName: string; pmName: string; email: string; industryType?: string }>;
  canModifyProject: (projectNo: string) => boolean;
  onSaveBatch: (updatedRisks: RiskItem[]) => Promise<void>;
  onDeleteRisk: (risk: RiskItem) => void;
  getNextRiskId: () => string;
  userProfile: UserProfile | null;
  currentUserEmail: string;
  projectFilter: string;
  setProjectFilter: (proj: string) => void;
  onBackToDashboard: () => void;
}

export function ExcelRiskRegisterGrid({
  risks,
  uniqueProjectData,
  canModifyProject,
  onSaveBatch,
  onDeleteRisk,
  getNextRiskId,
  userProfile,
  currentUserEmail,
  projectFilter,
  setProjectFilter,
  onBackToDashboard
}: ExcelRiskRegisterGridProps) {

  // Local grid items state (editable copy)
  const [gridItems, setGridItems] = useState<RiskItem[]>([]);
  // Track IDs of modified/dirty rows
  const [dirtyRowIds, setDirtyRowIds] = useState<Set<string>>(new Set());
  // Track newly created unsaved row IDs
  const [newRowIds, setNewRowIds] = useState<Set<string>>(new Set());
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync grid items from props
  useEffect(() => {
    setGridItems(JSON.parse(JSON.stringify(risks)));
    setDirtyRowIds(new Set());
    setNewRowIds(new Set());
  }, [risks]);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'desc') return { key, direction: 'asc' };
        return null;
      }
      return { key, direction: 'desc' };
    });
  };

  // Filter & sort items by project, search query, and column sorting
  const displayedItems = useMemo(() => {
    let result = gridItems.filter(item => {
      const matchProject = projectFilter === 'All' || item.projectNo === projectFilter;
      const matchSearch = !searchQuery.trim() || 
        item.riskId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.riskCategory.toLowerCase().includes(searchQuery.toLowerCase());
      return matchProject && matchSearch;
    });

    if (sortConfig) {
      const { key, direction } = sortConfig;
      const modifier = direction === 'asc' ? 1 : -1;

      result = [...result].sort((a, b) => {
        let aVal: any;
        let bVal: any;

        if (key === 'initialRisk.score') {
          aVal = getRiskScore(a.initialRisk.impact, a.initialRisk.likelihood);
          bVal = getRiskScore(b.initialRisk.impact, b.initialRisk.likelihood);
        } else if (key === 'residualRisk.score') {
          aVal = getRiskScore(a.residualRisk.impact, a.residualRisk.likelihood);
          bVal = getRiskScore(b.residualRisk.impact, b.residualRisk.likelihood);
        } else if (key.startsWith('initialRisk.')) {
          const sub = key.split('.')[1] as 'impact' | 'likelihood';
          aVal = Number(a.initialRisk[sub]) || 0;
          bVal = Number(b.initialRisk[sub]) || 0;
        } else if (key.startsWith('residualRisk.')) {
          const sub = key.split('.')[1] as 'impact' | 'likelihood';
          aVal = Number(a.residualRisk[sub]) || 0;
          bVal = Number(b.residualRisk[sub]) || 0;
        } else if (key === 'possibleEffect') {
          aVal = Array.isArray(a.possibleEffect) ? a.possibleEffect.join(',') : (a.possibleEffect || '');
          bVal = Array.isArray(b.possibleEffect) ? b.possibleEffect.join(',') : (b.possibleEffect || '');
        } else {
          aVal = (a as any)[key] ?? '';
          bVal = (b as any)[key] ?? '';
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * modifier;
        }
        const strA = String(aVal);
        const strB = String(bVal);
        return strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' }) * modifier;
      });
    }

    return result;
  }, [gridItems, projectFilter, searchQuery, sortConfig]);

  // Active selected project info for Excel Header Banner
  const selectedProjectInfo = useMemo(() => {
    if (projectFilter !== 'All') {
      return uniqueProjectData.find(p => p.projectNo === projectFilter) || {
        projectNo: projectFilter,
        projectName: 'Project ' + projectFilter,
        pmName: 'Project Manager',
        email: currentUserEmail
      };
    }
    return uniqueProjectData[0] || {
      projectNo: 'ALL',
      projectName: 'All Active Projects Risk Register',
      pmName: 'Multi-Project Manager',
      email: currentUserEmail
    };
  }, [projectFilter, uniqueProjectData, currentUserEmail]);

  // Update a field in a grid item
  const handleCellChange = (id: string, field: string, value: any) => {
    setGridItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      const updated = { ...item };

      // Handle nested properties
      if (field.startsWith('initialRisk.')) {
        const subField = field.split('.')[1] as 'impact' | 'likelihood';
        updated.initialRisk = {
          ...updated.initialRisk,
          [subField]: Number(value)
        };
      } else if (field.startsWith('residualRisk.')) {
        const subField = field.split('.')[1] as 'impact' | 'likelihood';
        updated.residualRisk = {
          ...updated.residualRisk,
          [subField]: Number(value)
        };
      } else {
        (updated as any)[field] = value;
      }

      updated.updatedAt = new Date().toISOString();
      updated.lastUpdatedBy = currentUserEmail;
      return updated;
    }));

    setDirtyRowIds(prev => new Set(prev).add(id));
  };

  // Add a new row at the top or bottom
  const handleAddNewRow = () => {
    const defaultProject = projectFilter !== 'All' 
      ? uniqueProjectData.find(p => p.projectNo === projectFilter) || uniqueProjectData[0]
      : uniqueProjectData[0];

    if (!defaultProject) {
      alert('Please create a project first before adding risks.');
      return;
    }

    const newId = 'new_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newRiskId = getNextRiskId();

    const newItem: RiskItem = {
      id: newId,
      riskId: newRiskId,
      projectNo: defaultProject.projectNo,
      projectName: defaultProject.projectName,
      pmName: defaultProject.pmName,
      email: defaultProject.email,
      industryType: defaultProject.industryType || '',
      appliedModifiers: [],
      riskCategory: RISK_CATEGORIES[0],
      description: 'New risk description...',
      initialRisk: { impact: 3, likelihood: 3 },
      possibleEffect: PossibleEffect.Cost,
      mitigationStrategy: MitigationStrategy.Mitigate,
      actionToControl: 'Action plan to control and mitigate...',
      residualRisk: { impact: 2, likelihood: 2 },
      costToMitigate: 'M',
      probabilityOfSuccess: 'M',
      owner: currentUserEmail.split('@')[0],
      raisedDate: new Date().toISOString().split('T')[0],
      deadlineDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Open',
      comment: '',
      createdBy: currentUserEmail,
      lastUpdatedBy: currentUserEmail,
      updatedAt: new Date().toISOString(),
      history: []
    };

    setGridItems(prev => [newItem, ...prev]);
    setDirtyRowIds(prev => new Set(prev).add(newId));
    setNewRowIds(prev => new Set(prev).add(newId));
  };

  // Duplicate an existing row
  const handleDuplicateRow = (item: RiskItem) => {
    const newId = 'dup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newRiskId = getNextRiskId();

    const duplicatedItem: RiskItem = {
      ...JSON.parse(JSON.stringify(item)),
      id: newId,
      riskId: newRiskId,
      raisedDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
      lastUpdatedBy: currentUserEmail,
      history: []
    };

    setGridItems(prev => [duplicatedItem, ...prev]);
    setDirtyRowIds(prev => new Set(prev).add(newId));
    setNewRowIds(prev => new Set(prev).add(newId));
  };

  // Save all modified rows
  const handleSaveAll = async () => {
    if (dirtyRowIds.size === 0) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const itemsToSave = gridItems.filter(item => dirtyRowIds.has(item.id));
      await onSaveBatch(itemsToSave);

      setDirtyRowIds(new Set());
      setNewRowIds(new Set());
      setSaveMessage({ type: 'success', text: `Saved ${itemsToSave.length} risk items successfully!` });
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to save grid changes:', err);
      setSaveMessage({ type: 'error', text: err.message || 'Failed to save changes.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset unsaved changes
  const handleReset = () => {
    if (dirtyRowIds.size > 0 && !confirm('Discard all unsaved changes in the grid?')) {
      return;
    }
    setGridItems(JSON.parse(JSON.stringify(risks)));
    setDirtyRowIds(new Set());
    setNewRowIds(new Set());
  };

  const [hoveredHeaderKey, setHoveredHeaderKey] = useState<string | null>(null);

  const COLUMN_GUIDES: Record<string, { title: string; subtitle: string; description: string; isoGuideline?: string; example?: string }> = {
    riskId: {
      title: 'Risk ID (รหัสความเสี่ยง)',
      subtitle: 'รหัสประจำรายการความเสี่ยง',
      description: 'รหัสอ้างอิงของความเสี่ยงแต่ละรายการ เช่น A10, T1, E2 เพื่อความสะดวกในการระบุ ติดตาม และอ้างอิงในเอกสารโครงการ'
    },
    riskCategory: {
      title: 'Risk Category (หมวดหมู่ความเสี่ยง)',
      subtitle: 'โครงสร้างหมวดหมู่ความเสี่ยง',
      description: 'จำแนกหมวดหมู่ของความเสี่ยงตามขอบเขตงาน เช่น Engineering, Procurement, Construction, SHE, Strategic/Finance, Quality เป็นต้น'
    },
    description: {
      title: 'Risk Description (รายละเอียดความเสี่ยง)',
      subtitle: 'การระบุความเสี่ยงตามมาตรฐาน ISO 31000',
      description: 'ระบุรายละเอียดความเสี่ยงให้ชัดเจนตามโครงสร้าง ISO 31000 เพื่อแยกแยะ สาเหตุ เหตุการณ์ และผลกระทบออกจากกัน',
      isoGuideline: 'Due to [สาเหตุ/Cause], there is a risk of [เหตุการณ์/Event], resulting in [ผลกระทบ/Effect]',
      example: 'Due to delayed engineering drawing issue, there is a risk of construction delay, resulting in project cost overrun.'
    },
    possibleEffect: {
      title: 'Possible Effect (ลักษณะผลกระทบหลัก)',
      subtitle: 'มิติของผลกระทบต่อวัตถุประสงค์โครงการ',
      description: 'เลือกมิติผลกระทบหลักของความเสี่ยง:\n• C = Cost (ต้นทุน/งบประมาณ)\n• T = Time (ระยะเวลา/ตารางเวลา)\n• Q = Quality (คุณภาพ)\n• HS = Health & Safety (อาชีวอนามัยและความปลอดภัย)\n• E = Environment (สิ่งแวดล้อม)\n• R = Reputation (ชื่อเสียงองค์กร)'
    },
    'initialRisk.likelihood': {
      title: 'Initial Probability (โอกาสเกิดก่อนจัดการ)',
      subtitle: 'ประเมินระดับโอกาสเกิด (Likelihood 1-5)',
      description: '1 = Rarely (<5% น้อยมาก)\n2 = Unlikely (5-10% น้อย)\n3 = Occasional (>10-25% ปานกลาง)\n4 = Likely (>25-50% สูง)\n5 = Most Likely (>50% สูงมาก)'
    },
    'initialRisk.impact': {
      title: 'Initial Impact (ระดับผลกระทบก่อนจัดการ)',
      subtitle: 'ประเมินระดับความรุนแรง (Impact 1-5)',
      description: '1 = Insignificant (เล็กน้อยมาก)\n2 = Minor (เล็กน้อย)\n3 = Moderate (ปานกลาง)\n4 = Major (สูง/สำคัญ)\n5 = Severe (รุนแรงมาก/วิกฤต)'
    },
    'initialRisk.score': {
      title: 'Initial Risk Score & Level (คะแนนก่อนจัดการ)',
      subtitle: 'ระดับความเสี่ยงเบื้องต้น (Pre-Mitigation)',
      description: 'คำนวณอัตโนมัติจาก (Impact × Likelihood):\n• 1-3 = Very Low (เขียว)\n• 4-6 = Low (เหลือง)\n• 8-9 = Significant (ส้ม)\n• 10-12 = Critical (แดง)\n• 15-25 = Extreme (แดงเข้ม)'
    },
    mitigationStrategy: {
      title: 'Mitigation Strategy (กลยุทธ์ตอบสนองความเสี่ยง)',
      subtitle: 'เลือกกลยุทธ์รับมือความเสี่ยง',
      description: '• A = Avoid (หลีกเลี่ยง: ปรับเปลี่ยนแผนเพื่อตัดความเสี่ยงออก)\n• T = Transfer (โอนย้าย: ทำประกัน หรือโอนความเสี่ยงให้คู่สัญญา)\n• M = Mitigate (บรรเทา: ลดโอกาสเกิดหรือลดผลกระทบ)\n• AC = Accept (ยอมรับ: เฝ้าระวังโดยไม่เพิ่มมาตรการ)'
    },
    actionToControl: {
      title: 'Action to Control & Mitigate (แผนการจัดการความเสี่ยง)',
      subtitle: 'มาตรการและขั้นตอนการควบคุม',
      description: 'ระบุมาตรการปฏิบัติการ ตัวชี้วัด และการดำเนินการเฉพาะเพื่อป้องกัน ลดโอกาสเกิด หรือบรรเทาผลกระทบให้อยู่ในระดับยอมรับได้',
      example: '1.) Set up weekly schedule tracking meeting. 2.) Expedite critical path PO items with vendors.'
    },
    'residualRisk.likelihood': {
      title: 'Residual Probability (โอกาสเกิดคงเหลือ)',
      subtitle: 'โอกาสเกิดหลังนำแผนไปปฏิบัติ (1-5)',
      description: 'ประเมินโอกาสเกิดซ้ำอีกครั้ง หลังจากนำมาตรการควบคุม (Action Plan) ไปปฏิบัติอย่างเป็นรูปธรรมแล้ว (ควรลดลงหรือเท่าเดิม)'
    },
    'residualRisk.impact': {
      title: 'Residual Impact (ผลกระทบคงเหลือ)',
      subtitle: 'ความรุนแรงหลังนำแผนไปปฏิบัติ (1-5)',
      description: 'ประเมินระดับผลกระทบอีกครั้ง หลังจากนำมาตรการควบคุมไปปฏิบัติแล้ว'
    },
    'residualRisk.score': {
      title: 'Residual Risk Score & Level (คะแนนคงเหลือ)',
      subtitle: 'ระดับความเสี่ยงคงเหลือ (Post-Mitigation)',
      description: 'คะแนนคำนวณอัตโนมัติ (Residual Impact × Residual Prob) เพื่อยืนยันว่าความเสี่ยงลดลงสู่ระดับที่ยอมรับได้ (Target Level) หรือไม่'
    },
    costToMitigate: {
      title: 'Cost to Mitigate - CTM (งบประมาณจัดการ)',
      subtitle: 'ระดับทรัพยากร/งบประมาณที่ใช้',
      description: '• H = High (งบประมาณ/ทรัพยากรสูงมาก)\n• M = Medium (งบประมาณปานกลาง)\n• L = Low (งบประมาณต่ำ/ไม่มีค่าใช้จ่ายเพิ่ม)'
    },
    probabilityOfSuccess: {
      title: 'Probability of Success - POS (โอกาสสำเร็จ)',
      subtitle: 'โอกาสสำเร็จของแผนจัดการ',
      description: '• H = High (โอกาสสำเร็จสูง >80%)\n• M = Medium (โอกาสสำเร็จปานกลาง 50-80%)\n• L = Low (โอกาสสำเร็จต่ำ <50%)'
    },
    reviewFrequency: {
      title: 'Review Frequency (รอบความถี่ทบทวน - ISO 31000)',
      subtitle: 'วงรอบการติดตามและทบทวนความเสี่ยง',
      description: 'กำหนดรอบความถี่ในการทบทวนความเสี่ยงตาม ISO 31000 Clause 6.6:\n• Monthly (ทุกเดือน)\n• Quarterly (ทุกไตรมาส)\n• Semi-Annually (ทุก 6 เดือน)\n• Annually (ทุกปี)'
    },
    owner: {
      title: 'Risk Owner (ผู้รับผิดชอบหลัก)',
      subtitle: 'บุคคลหรือตำแหน่งผู้รับผิดชอบ',
      description: 'ระบุชื่อหรือตำแหน่งของผู้รับผิดชอบหลักในการติดตาม ประสานงาน และผลักดันแผนจัดการความเสี่ยงให้บรรลุผล'
    },
    raisedDate: {
      title: 'Raised Date (วันที่พบความเสี่ยง)',
      subtitle: 'วันที่ระบุความเสี่ยงเข้าสู่ระบบ',
      description: 'วันที่เริ่มต้นระบุและบันทึกความเสี่ยงนี้ลงใน Risk Register'
    },
    deadlineDate: {
      title: 'Target Deadline (กำหนดเสร็จแผนงาน)',
      subtitle: 'วันสิ้นสุดเป้าหมายของแผนจัดการ',
      description: 'วันเป้าหมายที่ต้องดำเนินการตามแผนจัดการความเสี่ยงเสร็จสิ้น (หากเกินกำหนดระบบจะแสดงสถานะ 🚨 Deadline Overdue)'
    },
    finishedDate: {
      title: 'Finished Date (วันที่เสร็จสิ้นจริง)',
      subtitle: 'วันที่ปิดการดำเนินการแผนงาน',
      description: 'วันที่ดำเนินการตามมาตรการควบคุมเสร็จสมบูรณ์จริง'
    },
    status: {
      title: 'Status (สถานะความเสี่ยง)',
      subtitle: 'สถานะการดำเนินงานปัจจุบัน',
      description: '• Open (เปิดอยู่/รอรับการจัดการ)\n• In Progress (กำลังดำเนินการตามแผน)\n• Closed (จัดการเรียบร้อย/ปิดรายการแล้ว)'
    },
    comment: {
      title: 'Comment / Note (หมายเหตุเพิ่มเติม)',
      subtitle: 'ข้อสังเกตและข้อมูลเพิ่มเติม',
      description: 'ระบุหมายเหตุ บันทึกข้อสังเกต ประวัติความก้าวหน้า หรือข้อมูลเพิ่มเติมที่เกี่ยวข้องกับรายการความเสี่ยง'
    }
  };

  const renderSortHeader = (colKey: string, label: string, extraClass: string = '') => {
    const isSorted = sortConfig?.key === colKey;
    const isHovered = hoveredHeaderKey === colKey;
    const guide = COLUMN_GUIDES[colKey];

    return (
      <th
        onClick={() => handleSort(colKey)}
        onMouseEnter={() => setHoveredHeaderKey(colKey)}
        onMouseLeave={() => setHoveredHeaderKey(null)}
        className={`py-2 px-2 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition select-none group/th relative ${extraClass}`}
      >
        <div className="flex items-center justify-center gap-1 font-semibold">
          <span>{label}</span>
          {isSorted ? (
            sortConfig.direction === 'desc' ? (
              <ChevronDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-30 group-hover/th:opacity-100 flex-shrink-0 transition-opacity" />
          )}
        </div>

        {/* Hover Pop-up Guidance Tooltip */}
        {guide && isHovered && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 p-3.5 bg-slate-900/95 dark:bg-slate-950/95 text-white text-left font-normal rounded-xl shadow-2xl border border-slate-700 backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
            {/* Arrow Pointer */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-t border-l border-slate-700 rotate-45" />

            <div className="flex items-start gap-2 mb-2">
              <div className="p-1 rounded-lg bg-blue-600/30 text-blue-400 flex-shrink-0 mt-0.5">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100">{guide.title}</h4>
                <p className="text-[10px] text-blue-300 font-semibold">{guide.subtitle}</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line mb-2">
              {guide.description}
            </p>

            {guide.isoGuideline && (
              <div className="p-2 rounded-lg bg-blue-950/80 border border-blue-800/80 mb-2">
                <div className="text-[9px] font-bold uppercase tracking-wider text-blue-300 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> โครงสร้างมาตรฐาน ISO 31000:
                </div>
                <code className="text-[10px] font-mono text-amber-200 block break-words leading-normal">
                  {guide.isoGuideline}
                </code>
              </div>
            )}

            {guide.example && (
              <div className="p-2 rounded-lg bg-slate-800/90 border border-slate-700 text-[10px] text-slate-200">
                <span className="font-bold text-amber-300">💡 ตัวอย่าง:</span> {guide.example}
              </div>
            )}

            <div className="mt-2 text-[9px] text-slate-400 italic text-right border-t border-slate-800/80 pt-1">
              คลิกเพื่อจัดเรียงลำดับ (Sort) ⬆️⬇️
            </div>
          </div>
        )}
      </th>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner / Excel Document Control Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToDashboard}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 transition"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  EPM-03-014AT1
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Typical Project Risk Register (Excel Grid Mode)
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                <span>Interactive spreadsheet input modeled after GCME Project Risk Management standard.</span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {dirtyRowIds.size > 0 && (
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset ({dirtyRowIds.size})
              </button>
            )}

            <button
              onClick={handleAddNewRow}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>

            <button
              onClick={handleSaveAll}
              disabled={dirtyRowIds.size === 0 || isSaving}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm ${
                dirtyRowIds.size > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 dark:shadow-none animate-pulse'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save All Changes {dirtyRowIds.size > 0 && `(${dirtyRowIds.size})`}
            </button>
          </div>
        </div>

        {/* Save Status Notification */}
        {saveMessage && (
          <div className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            saveMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' 
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
          }`}>
            {saveMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {saveMessage.text}
          </div>
        )}

        {/* Project Selector & Search Controls */}
        <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project:</span>
              <select
                value={projectFilter}
                onChange={e => setProjectFilter(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="All">All Projects ({gridItems.length} risks)</option>
                {uniqueProjectData.map(p => (
                  <option key={p.projectNo} value={p.projectNo}>
                    {p.projectNo} - {p.projectName}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-4 flex items-center gap-3">
              <span><strong>PM:</strong> {selectedProjectInfo.pmName}</span>
              <span><strong>Doc No:</strong> {projectFilter !== 'All' ? `EPM-${projectFilter}` : 'EPM-03-014AT1'}</span>
            </div>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search in grid..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>

        </div>

      </div>

      {/* Spreadsheet Table Grid Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-colors">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="min-w-full border-collapse text-xs select-none">
            
            {/* Multi-Level Header (EPM-03-014AT1 Exact Layout) */}
            <thead className="sticky top-0 z-20 shadow-sm">
              
              {/* Row 1: Section Category Banner */}
              <tr className="text-white text-center font-bold tracking-wider uppercase text-[11px]">
                <th colSpan={4} className="bg-slate-800 dark:bg-slate-950 py-2.5 px-3 border-r border-slate-700">
                  🔵 1. Identify Risks
                </th>
                <th colSpan={3} className="bg-amber-700 dark:bg-amber-900 py-2.5 px-3 border-r border-amber-800">
                  🟡 2. Assess Risks (Pre-Mitigation)
                </th>
                <th colSpan={2} className="bg-emerald-700 dark:bg-emerald-900 py-2.5 px-3 border-r border-emerald-800">
                  🟢 3. Treat Risks / Response
                </th>
                <th colSpan={6} className="bg-indigo-800 dark:bg-indigo-950 py-2.5 px-3 border-r border-indigo-900">
                  🟣 4. Control Risks (Residual Assessment)
                </th>
                <th colSpan={4} className="bg-teal-800 dark:bg-teal-950 py-2.5 px-3 border-r border-teal-900">
                  🟠 5. Stakeholder & Schedule
                </th>
                <th colSpan={3} className="bg-slate-700 dark:bg-slate-900 py-2.5 px-3">
                  ⚪ Status & Actions
                </th>
              </tr>

              {/* Row 2: Sub-Category Headers with Interactive Column Sorting */}
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-center font-semibold border-b border-slate-200 dark:border-slate-700">
                
                {/* Identify */}
                {renderSortHeader('riskId', 'Risk ID', 'w-24')}
                {renderSortHeader('riskCategory', 'Category', 'w-36')}
                {renderSortHeader('description', 'Risk Description', 'min-w-[220px]')}
                {renderSortHeader('possibleEffect', 'Effect (C/T/Q/HS/E/R)', 'w-28 border-r-slate-400')}

                {/* Assess Initial */}
                {renderSortHeader('initialRisk.likelihood', 'Prob (1-5)', 'w-28')}
                {renderSortHeader('initialRisk.impact', 'Impact (1-5)', 'w-28')}
                {renderSortHeader('initialRisk.score', 'Initial Score', 'w-32 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-r-slate-400')}

                {/* Treat */}
                {renderSortHeader('mitigationStrategy', 'Strategy', 'w-28')}
                {renderSortHeader('actionToControl', 'Action to Control & Mitigate', 'min-w-[220px] border-r-slate-400')}

                {/* Control Residual */}
                {renderSortHeader('residualRisk.likelihood', 'Res Prob', 'w-24')}
                {renderSortHeader('residualRisk.impact', 'Res Impact', 'w-24')}
                {renderSortHeader('residualRisk.score', 'Residual Score', 'w-32 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300')}
                {renderSortHeader('costToMitigate', 'CTM', 'w-20')}
                {renderSortHeader('probabilityOfSuccess', 'POS', 'w-20')}
                {renderSortHeader('reviewFrequency', 'Review Freq', 'w-28 border-r-slate-400')}

                {/* Stakeholder */}
                {renderSortHeader('owner', 'Owner', 'w-28')}
                {renderSortHeader('raisedDate', 'Raised Date', 'w-28')}
                {renderSortHeader('deadlineDate', 'Deadline', 'w-28')}
                {renderSortHeader('finishedDate', 'Finished', 'w-28 border-r-slate-400')}

                {/* Status */}
                {renderSortHeader('status', 'Status', 'w-28')}
                {renderSortHeader('comment', 'Comment', 'min-w-[140px]')}
                <th className="py-2 px-2 w-20">Actions</th>
              </tr>
            </thead>

            {/* Table Body - Interactive Cells */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={22} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No risk items found in current filter. Click <strong>Add Row</strong> to create a new risk entry.
                  </td>
                </tr>
              ) : (
                displayedItems.map((item, idx) => {
                  const isDirty = dirtyRowIds.has(item.id);
                  const isNew = newRowIds.has(item.id);
                  const canModify = canModifyProject(item.projectNo);

                  // Calculate Initial Risk Level & Score
                  const initScore = getRiskScore(item.initialRisk.impact, item.initialRisk.likelihood);
                  const initLevel = getRiskLevel(item.initialRisk.impact, item.initialRisk.likelihood);
                  const initBadgeColor = getRiskLevelColor(initLevel);

                  // Calculate Residual Risk Level & Score
                  const resScore = getRiskScore(item.residualRisk.impact, item.residualRisk.likelihood);
                  const resLevel = getRiskLevel(item.residualRisk.impact, item.residualRisk.likelihood);
                  const resBadgeColor = getRiskLevelColor(resLevel);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group ${
                        isDirty ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      {/* 1. Risk ID (Readonly or Editable for new) */}
                      <td className="p-1 border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-center text-slate-800 dark:text-slate-200 relative">
                        {isDirty && (
                          <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-500" title="Unsaved Changes" />
                        )}
                        <input
                          type="text"
                          value={item.riskId}
                          onChange={e => handleCellChange(item.id, 'riskId', e.target.value)}
                          disabled={!canModify}
                          className="w-full text-center bg-transparent outline-none font-bold text-blue-600 dark:text-blue-400 py-1"
                        />
                      </td>

                      {/* 2. Category */}
                      <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                        <select
                          value={item.riskCategory}
                          onChange={e => handleCellChange(item.id, 'riskCategory', e.target.value)}
                          disabled={!canModify}
                          className="w-full bg-transparent text-slate-800 dark:text-slate-200 outline-none text-xs truncate py-1 cursor-pointer"
                        >
                          {RISK_CATEGORIES.map(cat => (
                            <option key={cat} value={cat} className="dark:bg-slate-900">{cat}</option>
                          ))}
                        </select>
                      </td>

                      {/* 3. Description */}
                      <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                        <textarea
                          rows={2}
                          value={item.description}
                          onChange={e => handleCellChange(item.id, 'description', e.target.value)}
                          disabled={!canModify}
                          className="w-full bg-transparent text-slate-800 dark:text-slate-200 outline-none text-xs resize-y py-1 px-1 focus:bg-white dark:focus:bg-slate-800 rounded transition"
                        />
                      </td>

                      {/* 4. Possible Effect */}
                      <td className="p-1 border-r border-slate-300 dark:border-slate-700 text-center">
                        <select
                          value={Array.isArray(item.possibleEffect) ? item.possibleEffect[0] : (item.possibleEffect || PossibleEffect.Cost)}
                          onChange={e => handleCellChange(item.id, 'possibleEffect', e.target.value as PossibleEffect)}
                          disabled={!canModify}
                          className="w-full bg-transparent font-bold text-center text-slate-800 dark:text-slate-200 outline-none text-xs cursor-pointer py-1"
                        >
                          <option value="C" className="dark:bg-slate-900">Cost (C)</option>
                          <option value="T" className="dark:bg-slate-900">Time (T)</option>
                          <option value="Q" className="dark:bg-slate-900">Quality (Q)</option>
                          <option value="HS" className="dark:bg-slate-900">Health & Safety (HS)</option>
                          <option value="E" className="dark:bg-slate-900">Environment (E)</option>
                          <option value="R" className="dark:bg-slate-900">Reputation (R)</option>
                        </select>
                      </td>

                      {/* 5. Initial Probability */}
                      <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                        <select
                          value={item.initialRisk.likelihood}
                          onChange={e => handleCellChange(item.id, 'initialRisk.likelihood', e.target.value)}
                          disabled={!canModify}
                          className="w-full text-center bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none text-xs cursor-pointer py-1"
                        >
                          <option value={1} className="dark:bg-slate-900">1 - Rarely</option>
                          <option value={2} className="dark:bg-slate-900">2 - Unlikely</option>
                          <option value={3} className="dark:bg-slate-900">3 - Occasional</option>
                          <option value={4} className="dark:bg-slate-900">4 - Likely</option>
                          <option value={5} className="dark:bg-slate-900">5 - Most Likely</option>
                        </select>
                      </td>

                      {/* 6. Initial Impact */}
                      <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                        <select
                          value={item.initialRisk.impact}
                          onChange={e => handleCellChange(item.id, 'initialRisk.impact', e.target.value)}
                          disabled={!canModify}
                          className="w-full text-center bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none text-xs cursor-pointer py-1"
                        >
                          <option value={1} className="dark:bg-slate-900">1 - Insignificant</option>
                          <option value={2} className="dark:bg-slate-900">2 - Minor</option>
                          <option value={3} className="dark:bg-slate-900">3 - Moderate</option>
                          <option value={4} className="dark:bg-slate-900">4 - Major</option>
                          <option value={5} className="dark:bg-slate-900">5 - Severe</option>
                        </select>
                      </td>

                      {/* 7. Initial Risk Score & Badge */}
                      <td className="p-2 border-r border-slate-300 dark:border-slate-700 text-center bg-amber-50/40 dark:bg-amber-950/20">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${initBadgeColor} shadow-sm`}>
                            {initLevel}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            Score: {initScore}
                          </span>
                        </div>
                      </td>

                      {/* 8. Mitigation Strategy */}
                      <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                        <select
                          value={item.mitigationStrategy}
                          onChange={e => handleCellChange(item.id, 'mitigationStrategy', e.target.value as MitigationStrategy)}
                          disabled={!canModify}
                          className="w-full text-center bg-transparent font-bold text-slate-800 dark:text-slate-200 outline-none text-xs cursor-pointer py-1"
                        >
                          <option value="A" className="dark:bg-slate-900">Avoid (A)</option>
                          <option value="T" className="dark:bg-slate-900">Transfer (T)</option>
                          <option value="M" className="dark:bg-slate-900">Mitigate (M)</option>
                          <option value="AC" className="dark:bg-slate-900">Accept (AC)</option>
                        </select>
                      </td>

                      {/* 9. Action to Control & Mitigate */}
                      <td className="p-1 border-r border-slate-300 dark:border-slate-700">
                        <textarea
                          rows={2}
                          value={item.actionToControl}
                          onChange={e => handleCellChange(item.id, 'actionToControl', e.target.value)}
                          disabled={!canModify}
                          className="w-full bg-transparent text-slate-800 dark:text-slate-200 outline-none text-xs resize-y py-1 px-1 focus:bg-white dark:focus:bg-slate-800 rounded transition"
                        />
                      </td>

                      {/* 10. Residual Probability */}
                      <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                        <select
                          value={item.residualRisk.likelihood}
                          onChange={e => handleCellChange(item.id, 'residualRisk.likelihood', e.target.value)}
                          disabled={!canModify}
                          className="w-full text-center bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none text-xs cursor-pointer py-1"
                        >
                          <option value={1} className="dark:bg-slate-900">1</option>
                          <option value={2} className="dark:bg-slate-900">2</option>
                          <option value={3} className="dark:bg-slate-900">3</option>
                          <option value={4} className="dark:bg-slate-900">4</option>
                          <option value={5} className="dark:bg-slate-900">5</option>
                        </select>
                      </td>

                      {/* 11. Residual Impact */}
                      <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                        <select
                          value={item.residualRisk.impact}
                          onChange={e => handleCellChange(item.id, 'residualRisk.impact', e.target.value)}
                          disabled={!canModify}
                          className="w-full text-center bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none text-xs cursor-pointer py-1"
                        >
                          <option value={1} className="dark:bg-slate-900">1</option>
                          <option value={2} className="dark:bg-slate-900">2</option>
                          <option value={3} className="dark:bg-slate-900">3</option>
                          <option value={4} className="dark:bg-slate-900">4</option>
                          <option value={5} className="dark:bg-slate-900">5</option>
                        </select>
                      </td>

                      {/* 12. Residual Risk Score & Badge */}
                      <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-center bg-indigo-50/40 dark:bg-indigo-950/20">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${resBadgeColor} shadow-sm`}>
                            {resLevel}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            Score: {resScore}
                          </span>
                        </div>
                      </td>

                      {/* 13. CTM */}
                      <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                        <select
                          value={item.costToMitigate || 'M'}
                          onChange={e => handleCellChange(item.id, 'costToMitigate', e.target.value as CostToMitigate)}
                          disabled={!canModify}
                          className="w-full text-center bg-transparent font-bold text-slate-800 dark:text-slate-200 outline-none text-xs cursor-pointer py-1"
                        >
                          <option value="H" className="dark:bg-slate-900">H</option>
                          <option value="M" className="dark:bg-slate-900">M</option>
                          <option value="L" className="dark:bg-slate-900">L</option>
                        </select>
                      </td>

                      {/* 14. POS */}
                      <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                        <select
                          value={item.probabilityOfSuccess || 'M'}
                          onChange={e => handleCellChange(item.id, 'probabilityOfSuccess', e.target.value as ProbabilityOfSuccess)}
                          disabled={!canModify}
                          className="w-full text-center bg-transparent font-bold text-slate-800 dark:text-slate-200 outline-none text-xs cursor-pointer py-1"
                        >
                          <option value="H" className="dark:bg-slate-900">H</option>
                          <option value="M" className="dark:bg-slate-900">M</option>
                          <option value="L" className="dark:bg-slate-900">L</option>
                        </select>
                      </td>

                      {/* 15. Review Frequency */}
                      <td className="p-1 border-r border-slate-300 dark:border-slate-700 text-center">
                        <select
                          value={item.reviewFrequency || 'Monthly'}
                          onChange={e => handleCellChange(item.id, 'reviewFrequency', e.target.value)}
                          disabled={!canModify}
                          className="w-full text-center bg-transparent text-slate-800 dark:text-slate-200 outline-none text-[11px] cursor-pointer py-1"
                        >
                          <option value="Monthly" className="dark:bg-slate-900">Monthly</option>
                          <option value="Quarterly" className="dark:bg-slate-900">Quarterly</option>
                          <option value="Semi-Annually" className="dark:bg-slate-900">Semi-Annually</option>
                          <option value="Annually" className="dark:bg-slate-900">Annually</option>
                        </select>
                      </td>

                      {/* 16. Owner */}
                      <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                        <input
                          type="text"
                          value={item.owner}
                          onChange={e => handleCellChange(item.id, 'owner', e.target.value)}
                          disabled={!canModify}
                          className="w-full bg-transparent text-slate-800 dark:text-slate-200 outline-none text-xs py-1 px-1 focus:bg-white dark:focus:bg-slate-800 rounded transition"
                        />
                      </td>

                      {/* 17. Raised Date */}
                      <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                        <input
                          type="date"
                          value={item.raisedDate || ''}
                          onChange={e => handleCellChange(item.id, 'raisedDate', e.target.value)}
                          disabled={!canModify}
                          className="w-full bg-transparent text-slate-800 dark:text-slate-200 outline-none text-[11px] py-1 cursor-pointer"
                        />
                      </td>

                      {/* 18. Deadline Date */}
                      <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                        <input
                          type="date"
                          value={item.deadlineDate || ''}
                          onChange={e => handleCellChange(item.id, 'deadlineDate', e.target.value)}
                          disabled={!canModify}
                          className="w-full bg-transparent text-slate-800 dark:text-slate-200 outline-none text-[11px] py-1 cursor-pointer"
                        />
                      </td>

                      {/* 19. Finished Date */}
                      <td className="p-1 border-r border-slate-300 dark:border-slate-700 text-center">
                        <input
                          type="date"
                          value={item.finishedDate || ''}
                          onChange={e => handleCellChange(item.id, 'finishedDate', e.target.value)}
                          disabled={!canModify}
                          className="w-full bg-transparent text-slate-800 dark:text-slate-200 outline-none text-[11px] py-1 cursor-pointer"
                        />
                      </td>

                      {/* 20. Status */}
                      <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center">
                        <select
                          value={item.status}
                          onChange={e => handleCellChange(item.id, 'status', e.target.value)}
                          disabled={!canModify}
                          className={`w-full text-center font-bold outline-none text-xs cursor-pointer py-1 rounded ${
                            item.status === 'Open' ? 'text-red-700 dark:text-red-400' :
                            item.status === 'In Progress' ? 'text-amber-700 dark:text-amber-400' :
                            'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          <option value="Open" className="dark:bg-slate-900 text-red-600">Open</option>
                          <option value="In Progress" className="dark:bg-slate-900 text-amber-600">In Progress</option>
                          <option value="Closed" className="dark:bg-slate-900 text-emerald-600">Closed</option>
                        </select>
                      </td>

                      {/* 21. Comment */}
                      <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                        <input
                          type="text"
                          value={item.comment || ''}
                          onChange={e => handleCellChange(item.id, 'comment', e.target.value)}
                          disabled={!canModify}
                          placeholder="Comment..."
                          className="w-full bg-transparent text-slate-800 dark:text-slate-200 outline-none text-xs py-1 px-1 focus:bg-white dark:focus:bg-slate-800 rounded transition"
                        />
                      </td>

                      {/* 22. Row Actions */}
                      <td className="p-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleDuplicateRow(item)}
                            disabled={!canModify}
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Duplicate Row"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRisk(item)}
                            disabled={!canModify}
                            className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Delete Risk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <strong>{displayedItems.length}</strong> risk entries. {dirtyRowIds.size > 0 && (
              <span className="ml-2 font-semibold text-amber-600 dark:text-amber-400">
                ⚠️ {dirtyRowIds.size} unsaved modified rows. Remember to click "Save All Changes"!
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddNewRow}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              + Add New Row
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
