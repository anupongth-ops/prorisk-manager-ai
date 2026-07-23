import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail, Clock, Bell, CheckCircle2, AlertTriangle, Send, Copy,
  Check, Save, RefreshCw, Info, Calendar, ShieldCheck, UserCheck, ChevronRight, Filter
} from 'lucide-react';
import { RiskItem, getRiskLevel, getRiskLevelColor, formatDateDisplay } from '../types';
import { db } from '../services/firebaseService';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface OverdueEmailSettingsProps {
  allRisks: RiskItem[];
  existingProjects: { projectNo: string; projectName: string; pmName: string; email: string }[];
  currentUserEmail: string;
}

export interface OverdueAlertConfig {
  enabled: boolean;
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  dispatchTime: string; // e.g. "08:00"
  weeklyDay: string;    // e.g. "Monday"
  monthlyDay: number;   // e.g. 1
  ccAdmin: boolean;
  ccOwner: boolean;
  subjectTemplate: string;
  lastRunTimestamp?: string;
}

const DEFAULT_CONFIG: OverdueAlertConfig = {
  enabled: true,
  frequency: 'Daily',
  dispatchTime: '08:00',
  weeklyDay: 'Monday',
  monthlyDay: 1,
  ccAdmin: true,
  ccOwner: false,
  subjectTemplate: '[PRO-RISK ALERT] แจ้งเตือนความเสี่ยงเกินกำหนด - โครงการ {projectNo} ({projectName})',
};

const SETTINGS_DOC_ID = 'overdue_alerts_config';
const SETTINGS_COLLECTION = 'system_settings';

export const OverdueEmailSettings: React.FC<OverdueEmailSettingsProps> = ({
  allRisks,
  existingProjects,
  currentUserEmail,
}) => {
  const [config, setConfig] = useState<OverdueAlertConfig>(() => {
    const saved = localStorage.getItem(SETTINGS_DOC_ID);
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([]);
  const [selectedPmForPreview, setSelectedPmForPreview] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Load config from Firestore on mount
  useEffect(() => {
    const loadFirestoreConfig = async () => {
      if (!db) return;
      try {
        const ref = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const remoteData = snap.data() as OverdueAlertConfig;
          setConfig(remoteData);
          localStorage.setItem(SETTINGS_DOC_ID, JSON.stringify(remoteData));
        }
      } catch (err) {
        console.warn('Could not load overdue config from Firestore, using LocalStorage:', err);
      }
    };
    loadFirestoreConfig();
  }, []);

  // Save config to Firestore & LocalStorage
  const handleSaveConfig = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      localStorage.setItem(SETTINGS_DOC_ID, JSON.stringify(config));
      if (db) {
        const ref = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        await setDoc(ref, {
          ...config,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUserEmail,
        }, { merge: true });
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save email alert settings.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ── Calculate Overdue Risks grouped by PM Email & Project ───────────────────
  const today = new Date().toISOString().split('T')[0];

  const overdueGroups = useMemo(() => {
    // Filter active risks that are overdue
    const overdueList = allRisks.filter(r => {
      if (r.status === 'Closed') return false;
      const isDeadlineOverdue = r.deadlineDate && r.deadlineDate < today;
      const isReviewOverdue = r.nextReviewDate && r.nextReviewDate <= today;
      return isDeadlineOverdue || isReviewOverdue;
    });

    // Group by PM Email (or fallback to risk owner / project email)
    const map = new Map<string, {
      pmName: string;
      pmEmail: string;
      projectNo: string;
      projectName: string;
      risks: (RiskItem & { daysOverdue: number })[];
    }>();

    overdueList.forEach(r => {
      const pmEmail = (r.email || existingProjects.find(p => p.projectNo === r.projectNo)?.email || 'unassigned@company.com').trim().toLowerCase();
      const pmName = r.pmName || existingProjects.find(p => p.projectNo === r.projectNo)?.pmName || 'Project Manager';
      const key = `${pmEmail}_${r.projectNo}`;

      // Calculate days overdue
      const targetDate = r.deadlineDate || r.nextReviewDate || today;
      const targetMs = new Date(targetDate).getTime();
      const todayMs = new Date(today).getTime();
      const daysOverdue = Math.max(1, Math.ceil((todayMs - targetMs) / (1000 * 60 * 60 * 24)));

      if (!map.has(key)) {
        map.set(key, {
          pmName,
          pmEmail,
          projectNo: r.projectNo,
          projectName: r.projectName,
          risks: [],
        });
      }

      map.get(key)!.risks.push({ ...r, daysOverdue });
    });

    return Array.from(map.values()).sort((a, b) => a.projectNo.localeCompare(b.projectNo));
  }, [allRisks, existingProjects, today]);

  const totalOverdueCount = useMemo(() =>
    overdueGroups.reduce((acc, g) => acc + g.risks.length, 0),
  [overdueGroups]);

  const uniquePmEmailsCount = useMemo(() =>
    new Set(overdueGroups.map(g => g.pmEmail)).size,
  [overdueGroups]);

  // Set default preview PM if not selected
  useEffect(() => {
    if (overdueGroups.length > 0 && !selectedPmForPreview) {
      setSelectedPmForPreview(`${overdueGroups[0].pmEmail}_${overdueGroups[0].projectNo}`);
    }
  }, [overdueGroups, selectedPmForPreview]);

  const activePreviewGroup = useMemo(() => {
    if (!selectedPmForPreview) return overdueGroups[0] || null;
    return overdueGroups.find(g => `${g.pmEmail}_${g.projectNo}` === selectedPmForPreview) || overdueGroups[0] || null;
  }, [overdueGroups, selectedPmForPreview]);

  // ── Generate Plain Text Email Body for Mailto / Copy ─────────────────────────
  const generateEmailBody = (group: typeof overdueGroups[0]) => {
    if (!group) return '';
    const lines: string[] = [
      `เรียน คุณ${group.pmName} (Project Manager),`,
      ``,
      `ระบบบริหารความเสี่ยง Risk Manager E-PO-PM ตรวจพบรายการความเสี่ยงที่เกินกำหนด (Overdue) ในโครงการของคุณ ดังนี้:`,
      ``,
      `📌 โครงการ: [${group.projectNo}] ${group.projectName}`,
      `จำนวนรายการที่เกินกำหนด: ${group.risks.length} รายการ`,
      `───────────────────────────────────────────────────────`,
    ];

    group.risks.forEach((r, idx) => {
      const level = getRiskLevel(r.residualRisk.impact, r.residualRisk.likelihood);
      lines.push(
        `${idx + 1}. [${r.riskId}] ${r.description}`,
        `   • หมวด: ${r.riskCategory}`,
        `   • ระดับความเสี่ยงคงเหลือ: ${level} (Score: ${r.residualRisk.impact}x${r.residualRisk.likelihood})`,
        `   • กำหนดเวลา (Deadline): ${formatDateDisplay(r.deadlineDate) || '-'}`,
        `   • เกินกำหนดมาแล้ว: ${r.daysOverdue} วัน`,
        `   • ผู้รับผิดชอบ (Owner): ${r.owner || group.pmName}`,
        `   • แผนดำเนินการ: ${r.actionToControl || 'โปรดระบุแผนดำเนินการ'}`,
        ``
      );
    });

    lines.push(
      `───────────────────────────────────────────────────────`,
      `โปรดเข้าสู่ระบบเพื่ออัปเดตสถานะและแผนการจัดการความเสี่ยงโดยเร็ว:`,
      `${window.location.origin}${window.location.pathname}`,
      ``,
      `ขอแสดงความนับถือ,`,
      `ระบบบริหารความเสี่ยงโครงการ (Risk Manager AI System)`
    );

    return lines.join('\n');
  };

  const generateEmailSubject = (group: typeof overdueGroups[0]) => {
    if (!group) return '';
    return config.subjectTemplate
      .replace('{projectNo}', group.projectNo)
      .replace('{projectName}', group.projectName);
  };

  // ── Manual Dispatch Simulation & Trigger ────────────────────────────────────
  const handleDispatchAlertsNow = async () => {
    if (overdueGroups.length === 0) {
      alert('ไม่พบรายการความเสี่ยงที่เกินกำหนด (No overdue risks found).');
      return;
    }

    const confirmMsg = 
      `คุณต้องการส่ง Email แจ้งเตือนความเสี่ยงเกินกำหนดไปยัง Project Manager ทั้งหมด ${uniquePmEmailsCount} รายใช่หรือไม่?\n\n` +
      `📌 หมายเหตุ: ระบบจะทำการเปิด Email Client (เช่น Microsoft Outlook / Mail App) พร้อมสร้างเนื้อหาอีเมลแจ้งเตือนของแต่ละโครงการให้อัตโนมัติทันทีครับ`;

    if (!confirm(confirmMsg)) {
      return;
    }

    setDispatching(true);
    const logs: string[] = [];
    logs.push(`[${new Date().toLocaleTimeString()}] เริ่มกระบวนการส่ง Email แจ้งเตือนความเสี่ยงเกินกำหนด...`);
    setDispatchLogs([...logs]);

    for (let i = 0; i < overdueGroups.length; i++) {
      const g = overdueGroups[i];
      await new Promise(res => setTimeout(res, 500)); // Brief pause for UX

      // Open mailto client for each PM group
      handleOpenMailto(g);

      logs.push(`[${new Date().toLocaleTimeString()}] 📧 [${g.projectNo}] เปิด Mail App ส่งถึง ${g.pmEmail} (${g.risks.length} Overdue Risks) -> เรียบร้อย ✅`);
      setDispatchLogs([...logs]);
    }

    logs.push(`[${new Date().toLocaleTimeString()}] 🎉 เสร็จสิ้น! เปิดโปรแกรมส่ง Email เรียบร้อยแล้วทุกรายการ`);
    setDispatchLogs([...logs]);
    setDispatching(false);

    // Save last run timestamp
    const nowIso = new Date().toISOString();
    const updatedConfig = { ...config, lastRunTimestamp: nowIso };
    setConfig(updatedConfig);
    localStorage.setItem(SETTINGS_DOC_ID, JSON.stringify(updatedConfig));
    if (db) {
      try {
        await setDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID), {
          lastRunTimestamp: nowIso,
        }, { merge: true });
      } catch (e) {
        // ignore
      }
    }
  };

  const handleCopyEmail = (bodyText: string) => {
    navigator.clipboard.writeText(bodyText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleOpenMailto = (group: typeof overdueGroups[0]) => {
    if (!group) return;
    const subject = encodeURIComponent(generateEmailSubject(group));
    const body = encodeURIComponent(generateEmailBody(group));
    let ccStr = '';
    if (config.ccAdmin && currentUserEmail) ccStr = `&cc=${encodeURIComponent(currentUserEmail)}`;

    window.open(`mailto:${group.pmEmail}?subject=${subject}&body=${body}${ccStr}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">{totalOverdueCount}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">Overdue Risks ทั้งหมด</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">{uniquePmEmailsCount}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">PM / อีเมลที่จะรับการเตือน</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              {config.enabled ? `ส่งแบบ ${config.frequency}` : 'ปิดการแจ้งเตือนแบบอัตโนมัติ'}
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 mt-0.5">
              {config.enabled ? `เวลา ${config.dispatchTime} น.` : 'Manual Only'}
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner for Email Delivery Mechanism */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 dark:text-blue-200 space-y-1">
          <p className="font-bold">💡 ข้อควรรู้เกี่ยวกับการส่ง Email แจ้งเตือนผ่านเว็บแอปพลิเคชัน (Browser Client):</p>
          <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
            โปรแกรมเว็บเบราว์เซอร์จะไม่สามารถส่งอีเมลตรงเข้า Inbox โดยไม่มีระบบ Mail Client หรือ SMTP Server รองรับ (เพื่อความปลอดภัยจาก Spam) 
            เมื่อกด <strong>"ส่ง Email เตือนทันที"</strong> หรือ <strong>"เปิดใน Mail App (Mailto)"</strong> ระบบจะเปิดโปรแกรมส่งอีเมลของเครื่อง (เช่น <strong>Microsoft Outlook</strong>, <strong>Mail App</strong>) พร้อมกรอกชื่อ PM, หัวข้อ และรายการความเสี่ยง Overdue ให้อัตโนมัติทันทีเพื่อให้กดส่งได้จริงครับ
          </p>
        </div>
      </div>

      {/* Main Grid: Config (Left) & Dispatcher/Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Column: Config Panel ──────────────────────────────────────── */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
                ตั้งค่าระบบแจ้งเตือน Email
              </h3>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}>
              {config.enabled ? 'Active' : 'Disabled'}
            </span>
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
            <div>
              <span className="text-sm font-bold text-gray-800 dark:text-slate-200">เปิดใช้งาน Email เตือนอัตโนมัติ</span>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">ส่งคำเตือนเมื่อพบ Risk ที่Overdue</p>
            </div>
            <button
              type="button"
              onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${config.enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-700'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${config.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Frequency & Time */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                ความถี่ในการส่ง (Schedule Frequency)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Daily', 'Weekly', 'Monthly'] as const).map(freq => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, frequency: freq }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${config.frequency === freq ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50'}`}
                  >
                    {freq === 'Daily' ? 'รายวัน (Daily)' : freq === 'Weekly' ? 'รายสัปดาห์' : 'รายเดือน'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  เวลาที่ส่ง (Dispatch Time)
                </label>
                <select
                  value={config.dispatchTime}
                  onChange={e => setConfig(prev => ({ ...prev, dispatchTime: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-400 outline-none"
                >
                  {['07:00', '08:00', '09:00', '10:00', '12:00', '13:00', '17:00', '18:00'].map(t => (
                    <option key={t} value={t}>{t} น.</option>
                  ))}
                </select>
              </div>

              {config.frequency === 'Weekly' && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                    วันในสัปดาห์
                  </label>
                  <select
                    value={config.weeklyDay}
                    onChange={e => setConfig(prev => ({ ...prev, weeklyDay: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-400 outline-none"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => (
                      <option key={d} value={d}>วัน{d === 'Monday' ? 'จันทร์' : d === 'Tuesday' ? 'อังคาร' : d === 'Wednesday' ? 'พุธ' : d === 'Thursday' ? 'พฤหัสบดี' : 'ศุกร์'}</option>
                    ))}
                  </select>
                </div>
              )}

              {config.frequency === 'Monthly' && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                    วันที่ในเดือน
                  </label>
                  <select
                    value={config.monthlyDay}
                    onChange={e => setConfig(prev => ({ ...prev, monthlyDay: Number(e.target.value) }))}
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-400 outline-none"
                  >
                    {[1, 5, 10, 15, 25, 28].map(d => (
                      <option key={d} value={d}>วันที่ {d}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* CC Options */}
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
              ผู้รับสำเนา (CC Options)
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={config.ccAdmin}
                onChange={e => setConfig(prev => ({ ...prev, ccAdmin: e.target.checked }))}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>CC ถึง Admin ({currentUserEmail})</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={config.ccOwner}
                onChange={e => setConfig(prev => ({ ...prev, ccOwner: e.target.checked }))}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>CC ถึงผู้รับผิดชอบหลัก (Risk Owner)</span>
            </label>
          </div>

          {/* Subject Template */}
          <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
              รูปแบบหัวข้อ Email (Subject Pattern)
            </label>
            <input
              type="text"
              value={config.subjectTemplate}
              onChange={e => setConfig(prev => ({ ...prev, subjectTemplate: e.target.value }))}
              className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-400 outline-none"
            />
            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
              * รองรับตัวแปร `&#123;projectNo&#125;` และ `&#123;projectName&#125;`
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> บันทึกแล้ว!
              </span>
            )}
          </div>
        </div>

        {/* ── Right Column: Overdue Groups List & Dispatcher ──────────────────── */}
        <div className="lg:col-span-7 space-y-6">

          {/* Overdue Groups Card */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-red-500" />
                  รายการความเสี่ยงเกินกำหนดแยกตาม PM
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  พบ {overdueGroups.length} กลุ่มโครงการที่มีความเสี่ยง Overdue
                </p>
              </div>

              <button
                type="button"
                onClick={handleDispatchAlertsNow}
                disabled={dispatching || overdueGroups.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex-shrink-0"
              >
                {dispatching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {dispatching ? 'กำลังส่ง...' : 'ส่ง Email เตือนทันที (Send Now)'}
              </button>
            </div>

            {/* Live Dispatch Logs */}
            {dispatchLogs.length > 0 && (
              <div className="bg-gray-900 text-green-400 rounded-xl p-3 text-xs font-mono max-h-32 overflow-y-auto border border-gray-800 space-y-1">
                {dispatchLogs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            )}

            {/* Groups Table / List */}
            {overdueGroups.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-slate-500 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 opacity-80" />
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">ยอดเยี่ยม! ไม่พบความเสี่ยงที่เกินกำหนดในระบบ</p>
                <p className="text-xs">ทุกโครงการดำเนินการและตรวจสอบตามกำหนดเวลาทั้งหมด</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {overdueGroups.map(g => {
                  const key = `${g.pmEmail}_${g.projectNo}`;
                  const isSelected = selectedPmForPreview === key;

                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedPmForPreview(key)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-sm' : 'border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">[{g.projectNo}]</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-slate-100">{g.projectName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mt-1">
                            <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                            <span>PM: {g.pmName} ({g.pmEmail})</span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                            {g.risks.length} Overdue Risks
                          </span>
                          <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                            {isSelected ? 'กำลังพรีวิว Email' : 'คลิกเพื่อดูตัวอย่าง Email'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Email Body Preview & Actions */}
          {activePreviewGroup && (
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-500" />
                    ตัวอย่าง Email ที่จะส่งถึง {activePreviewGroup.pmEmail}
                  </h4>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                    หัวข้อ: {generateEmailSubject(activePreviewGroup)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(generateEmailBody(activePreviewGroup))}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-gray-700 dark:text-slate-300 transition-colors"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedEmail ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenMailto(activePreviewGroup)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200 dark:border-blue-800 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    เปิดใน Mail App (Mailto)
                  </button>
                </div>
              </div>

              {/* Email Content Box */}
              <div className="bg-gray-50 dark:bg-slate-950 p-4 rounded-xl border border-gray-100 dark:border-slate-800 font-mono text-xs text-gray-800 dark:text-slate-200 whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed">
                {generateEmailBody(activePreviewGroup)}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
