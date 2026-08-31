import React, { useState, useRef } from 'react';
import {
    Sparkles,
    UploadCloud,
    FileText,
    CheckCircle2,
    AlertCircle,
    Loader2,
    X,
    Building2,
    DollarSign,
    Layers,
    FileCode,
    Cpu,
    ArrowRight,
    Key,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Bot,
    Zap
} from 'lucide-react';
import { TorProject } from '../../types/torRisk';
import {
    analyzeTorDocument,
    TorAnalysisInput,
    getGeminiApiKey,
    AvailableAiModel,
    AI_MODEL_OPTIONS
} from '../../services/geminiService';
import { extractTextFromDocxFile } from '../../utils/docxExtractor';

interface AiAnalyzerModalProps {
    project: TorProject;
    isOpen: boolean;
    onClose: () => void;
    onApplyResults: (analyzedData: Partial<TorProject>) => void;
}

export const AiAnalyzerModal: React.FC<AiAnalyzerModalProps> = ({
    project,
    isOpen,
    onClose,
    onApplyResults,
}) => {
    const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
    const [rawText, setRawText] = useState<string>('');
    const [uploadedFile, setUploadedFile] = useState<{ name: string; base64: string; mimeType: string } | null>(null);

    const [proposalCode, setProposalCode] = useState<string>(project.proposalCode || 'PROP-2026-001');
    const [projectTitle, setProjectTitle] = useState<string>(project.projectTitle || '');
    const [clientName, setClientName] = useState<string>(project.clientName || '');
    const [estimatedBudget, setEstimatedBudget] = useState<number>(project.estimatedBudget || 10000000);

    const [selectedModel, setSelectedModel] = useState<AvailableAiModel>('gemini-3.7-flash');
    const [customApiKey, setCustomApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
    const [showKeySettings, setShowKeySettings] = useState<boolean>(false);

    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [analysisProgress, setAnalysisProgress] = useState<string>('');
    const [analysisResult, setAnalysisResult] = useState<Partial<TorProject> | null>(null);
    const [modelUsed, setModelUsed] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();
        const isPdf = fileName.endsWith('.pdf') || file.type === 'application/pdf';
        const isDocx = fileName.endsWith('.docx') || fileName.endsWith('.doc');
        const isText = fileName.endsWith('.txt') || fileName.endsWith('.md') || file.type.startsWith('text/');

        if (!projectTitle) setProjectTitle(file.name.replace(/\.[^/.]+$/, ''));

        if (isDocx) {
            // Extract plain text directly from Word XML
            const extractedText = await extractTextFromDocxFile(file);
            if (extractedText) {
                setRawText(extractedText);
            }
            setUploadedFile({ name: file.name, base64: '', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        } else if (isPdf) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                setUploadedFile({ name: file.name, base64, mimeType: 'application/pdf' });
            };
        } else if (isText) {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = () => {
                const textContent = reader.result as string;
                setRawText(textContent);
                setUploadedFile({ name: file.name, base64: '', mimeType: 'text/plain' });
            };
        } else {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                const mime = file.type || 'application/octet-stream';
                setUploadedFile({ name: file.name, base64, mimeType: mime });
            };
        }
    };

    const handleStartAnalysis = async () => {
        if (inputMode === 'upload' && !uploadedFile) {
            setErrorMessage('กรุณาเลือกไฟล์เอกสาร TOR (PDF หรือ Text) ก่อนเริ่มการวิเคราะห์');
            return;
        }
        if (inputMode === 'text' && !rawText.trim()) {
            setErrorMessage('กรุณาวางข้อความเนื้อหา TOR ก่อนเริ่มการวิเคราะห์');
            return;
        }

        if (customApiKey.trim()) {
            localStorage.setItem('gemini_api_key', customApiKey.trim());
        }

        setIsAnalyzing(true);
        setErrorMessage(null);
        setAnalysisResult(null);
        setModelUsed(null);
        setAnalysisProgress('กำลังเชื่อมต่อ AI Engine เพื่อสแกนและวิเคราะห์เอกสาร TOR...');

        try {
            setAnalysisProgress('กำลังอ่านโครงสร้าง TOR และสกัดเงื่อนไขสัญญา/บทปรับ...');
            const input: TorAnalysisInput = {
                text: inputMode === 'text' ? rawText : (rawText.trim() || undefined),
                fileBase64: uploadedFile?.base64,
                mimeType: uploadedFile?.mimeType,
                proposalCode,
                projectTitle,
                clientName,
                estimatedBudget,
                customApiKey: customApiKey.trim() || undefined,
                selectedModel,
            };

            const result = await analyzeTorDocument(input);

            if (!result.success || !result.data) {
                throw new Error(result.error || 'การวิเคราะห์ไม่สำเร็จ');
            }

            setAnalysisProgress('จัดหมวดหมู่ความเสี่ยงและคำนวณงบสำรอง EMV สำเร็จ!');
            setAnalysisResult(result.data);
            setModelUsed(result.modelUsed || (result.provider === 'groq' ? 'Groq Llama 3.3 70B' : 'Google Gemini 3.7 Flash'));
        } catch (err: any) {
            console.error('TOR Analysis Error:', err);
            setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการวิเคราะห์เอกสาร TOR');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleApplyAndClose = () => {
        if (!analysisResult) return;
        onApplyResults({
            ...analysisResult,
            proposalCode,
            projectTitle,
            clientName,
            estimatedBudget,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-inner">
                            <Sparkles className="w-5 h-5 text-amber-300" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold tracking-tight">
                                    AI TOR & Proposal Risk Analyzer
                                </h3>
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-xs flex items-center gap-1 shadow-xs">
                                    <Bot className="w-3 h-3 text-amber-300" />
                                    Gemini 3.7 Flash / Groq Llama 3.3
                                </span>
                            </div>
                            <p className="text-xs text-blue-100 mt-0.5">
                                สแกนเอกสาร TOR วิเคราะห์ความเสี่ยง 8 หมวด และคำนวณงบสำรอง EMV อัตโนมัติ (ISO 31000)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                    {/* Metadata Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-200 dark:border-slate-800">
                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">รหัสข้อเสนอ</label>
                            <input
                                type="text"
                                value={proposalCode}
                                onChange={(e) => setProposalCode(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">ชื่อโครงการ</label>
                            <input
                                type="text"
                                value={projectTitle}
                                onChange={(e) => setProjectTitle(e.target.value)}
                                placeholder="เช่น โครงการงานระบบ EPC..."
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">ชื่อลูกค้า/ผู้ว่าจ้าง</label>
                            <input
                                type="text"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="เช่น PTT, EGAT..."
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">งบประมาณโครงการ (THB)</label>
                            <input
                                type="number"
                                value={estimatedBudget}
                                onChange={(e) => setEstimatedBudget(Number(e.target.value) || 0)}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 font-mono outline-none"
                            />
                        </div>
                    </div>

                    {/* AI Model Selector Bar */}
                    <div className="p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-slate-800/80 dark:to-indigo-950/30 rounded-2xl border border-blue-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                            <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <span className="font-bold text-gray-800 dark:text-slate-200">ระบุ AI Model ที่ใช้:</span>
                        </div>
                        <div className="flex-1 max-w-sm">
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value as AvailableAiModel)}
                                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-xl font-bold text-blue-700 dark:text-blue-300 shadow-xs outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {AI_MODEL_OPTIONS.map((opt) => (
                                    <option key={opt.id} value={opt.id}>
                                        {opt.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Mode Selector */}
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setInputMode('upload')}
                                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                                    inputMode === 'upload'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                                }`}
                            >
                                <UploadCloud className="w-3.5 h-3.5" />
                                อัปโหลดไฟล์ PDF / DOCX
                            </button>
                            <button
                                onClick={() => setInputMode('text')}
                                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                                    inputMode === 'text'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                                }`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                วางข้อความ TOR ดิบ (Raw Text)
                            </button>
                        </div>

                        {/* API Key Toggle Button */}
                        <button
                            onClick={() => setShowKeySettings(!showKeySettings)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            <Key className="w-3.5 h-3.5" />
                            <span>ตั้งค่า API Key</span>
                            {showKeySettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                    </div>

                    {/* API Key Settings Drawer */}
                    {showKeySettings && (
                        <div className="p-3.5 bg-gray-50 dark:bg-slate-800/80 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-2 animate-in fade-in">
                            <div className="flex items-center justify-between">
                                <label className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                                    <Key className="w-3.5 h-3.5 text-amber-500" />
                                    กำหนด Gemini API Key ของคุณ (Optional):
                                </label>
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                                >
                                    รับ API Key ฟรีที่ Google AI Studio <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                            <input
                                type="password"
                                value={customApiKey}
                                onChange={(e) => setCustomApiKey(e.target.value)}
                                placeholder="วาง API Key เช่น AIzaSy..."
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-slate-100 font-mono outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-[10px] text-gray-500 dark:text-slate-400">
                                💡 หากสร้าง API Key จาก Google AI Studio จะเปิดใช้งาน Generative Language API โดยอัตโนมัติและไม่ติดข้อจำกัด
                            </p>
                        </div>
                    )}

                    {/* Input Content Area */}
                    {inputMode === 'upload' ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-all bg-gray-50/50 dark:bg-slate-800/30 group"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <UploadCloud className="w-6 h-6" />
                            </div>
                            {uploadedFile ? (
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">{uploadedFile.name}</p>
                                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                                        ✓ พร้อมสำหรับการวิเคราะห์ คลิกเพื่อเปลี่ยนไฟล์
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-slate-100">
                                        คลิกเพื่อเลือกไฟล์เอกสาร TOR หรือลากไฟล์มาวางที่นี่
                                    </p>
                                    <p className="text-gray-400 dark:text-slate-500 mt-1 text-[11px]">
                                        รองรับไฟล์ PDF, Word (.docx), ข้อความ (.txt)
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <textarea
                                rows={6}
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                                placeholder="วางเนื้อหาข้อกำหนด TOR เช่น ขอบเขตงาน ข้อกำหนดเทคนิค เงื่อนไขบทปรับ หรือรายละเอียดสัญญา..."
                                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                            />
                        </div>
                    )}

                    {/* Error Message Alert */}
                    {errorMessage && (
                        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400 flex items-start gap-2.5 whitespace-pre-line leading-relaxed">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">{errorMessage}</div>
                        </div>
                    )}

                    {/* Processing State */}
                    {isAnalyzing && (
                        <div className="p-5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl text-center space-y-3">
                            <Loader2 className="w-7 h-7 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
                            <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">
                                กำลังประมวลผลเอกสาร TOR ด้วย AI ({selectedModel === 'auto' ? 'Auto Engine' : selectedModel})
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 animate-pulse">
                                {analysisProgress}
                            </p>
                        </div>
                    )}

                    {/* Result Preview Box */}
                    {analysisResult && !isAnalyzing && (
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    การวิเคราะห์สำเร็จ!
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                        <Bot className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                        โมเดล: {modelUsed || 'Gemini 2.5 Flash'}
                                    </span>
                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full">
                                        พบ {analysisResult.risks?.length || 0} ความเสี่ยงสำคัญ
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                                    <span className="text-gray-500 dark:text-slate-400 block">ข้อจำกัด/บทปรับ</span>
                                    <span className="font-bold text-gray-900 dark:text-slate-100">
                                        {analysisResult.constraints?.length || 0} รายการ
                                    </span>
                                </div>
                                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                                    <span className="text-gray-500 dark:text-slate-400 block">งบสำรอง EMV รวม</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        {(analysisResult.risks?.reduce((acc, r) => acc + (r.emvValue || 0), 0) || 0).toLocaleString()} THB
                                    </span>
                                </div>
                                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                                    <span className="text-gray-500 dark:text-slate-400 block">คำแนะนำสำหรับบอร์ด</span>
                                    <span className="font-bold text-gray-900 dark:text-slate-100">
                                        {analysisResult.strategicRecommendations ? 'พร้อมใช้งาน' : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-800 flex items-center justify-end gap-3 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    {analysisResult ? (
                        <button
                            onClick={handleApplyAndClose}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            นำข้อมูลเข้าสู่ตาราง 5 ขั้นตอน
                        </button>
                    ) : (
                        <button
                            disabled={isAnalyzing}
                            onClick={handleStartAnalysis}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    กำลังวิเคราะห์...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    เริ่มวิเคราะห์ TOR ด้วย AI
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
