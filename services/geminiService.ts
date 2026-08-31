/**
 * AI Integration for TOR & Proposal Risk Assessment
 * Dedicated Model: Google Gemini 3.7 Flash
 * Standard: ISO 31000:2018 / COSO ERM
 */

import {
    TorProject,
    TorRiskItem,
    TorConstraint,
    TorRiskCategory,
    TorTreatmentStrategy,
    getTorRiskScore,
    getTorRiskLevel,
    calculateEMV,
    likelihoodToDefaultProbability,
} from '../types/torRisk';

export const getGeminiApiKey = (): string => {
    return process.env.GEMINI_API_KEY || '';
};

export type AvailableAiModel =
    | 'gemini-3.7-flash'
    | 'gemini-2.5-flash'
    | 'llama-3.3-70b-versatile';

export const AI_MODEL_OPTIONS: { id: AvailableAiModel; name: string; badge: string; desc: string; provider: 'gemini' | 'groq' }[] = [
    {
        id: 'gemini-3.7-flash',
        name: 'Google Gemini 3.7 Flash',
        badge: 'Primary Model',
        desc: 'โมเดลเรือธงรุ่นล่าสุดของ Google วิเคราะห์เอกสาร TOR และคำนวณงบสำรองความเสี่ยง EMV แม่นยำสูงสุด',
        provider: 'gemini',
    },
    {
        id: 'gemini-2.5-flash',
        name: 'Google Gemini 2.5 Flash',
        badge: 'Backup Model',
        desc: 'โมเดลสำรองความเร็วสูงกรณีเซิร์ฟเวอร์หลักหนาแน่น',
        provider: 'gemini',
    },
    {
        id: 'llama-3.3-70b-versatile',
        name: 'Groq Llama 3.3 70B Versatile',
        badge: 'Groq LPU',
        desc: 'โมเดลความเร็วสูงผ่าน Groq API',
        provider: 'groq',
    },
];

export interface TorAnalysisInput {
    text?: string;
    fileBase64?: string;
    mimeType?: string;
    proposalCode?: string;
    projectTitle?: string;
    clientName?: string;
    estimatedBudget?: number;
    submissionDeadline?: string;
    customApiKey?: string;
    selectedModel?: AvailableAiModel;
}

export interface TorAnalysisResult {
    success: boolean;
    data?: Partial<TorProject>;
    error?: string;
    provider?: 'gemini' | 'groq';
    modelUsed?: string;
}

/**
 * Resilient JSON parser that handles:
 * - Markdown fences
 * - Unescaped control chars (newlines in Thai text)
 * - Truncated responses (mid-string, mid-object, mid-array)
 * - Trailing commas
 */
function robustParseJson(raw: string): any {
    if (!raw || typeof raw !== 'string') return null;

    let text = raw.trim();

    // 1. Strip markdown code fences
    text = text.replace(/```(?:json)?\s*/gi, '').replace(/\s*```/gi, '').trim();

    // 2. Extract outermost { ... }
    const firstBrace = text.indexOf('{');
    if (firstBrace === -1) return null;
    const lastBrace = text.lastIndexOf('}');
    if (lastBrace > firstBrace) {
        text = text.substring(firstBrace, lastBrace + 1);
    } else {
        // No closing brace found — response was truncated
        text = text.substring(firstBrace);
    }

    // 3. Direct parse
    try {
        return JSON.parse(text);
    } catch (_) { /* continue to repairs */ }

    // 4. Sanitize control characters inside string values
    let sanitized = text
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')  // strip control chars except \n \r \t
        .replace(/(?<!\\)\n/g, '\\n')  // escape raw newlines inside strings
        .replace(/(?<!\\)\r/g, '\\r')  // escape raw carriage returns
        .replace(/(?<!\\)\t/g, '\\t'); // escape raw tabs
    try {
        return JSON.parse(sanitized);
    } catch (_) { /* continue */ }

    // 5. Aggressive truncation repair
    //    Walk backward from end, stripping partial values until we can close all brackets
    let repaired = sanitized;

    // Remove trailing comma before we close brackets
    repaired = repaired.replace(/,\s*$/, '');

    // If we're inside a string (odd number of unescaped quotes), close it
    const unescapedQuotes = repaired.match(/(?<!\\)"/g) || [];
    if (unescapedQuotes.length % 2 !== 0) {
        // We're mid-string. Truncate back to the last complete key-value or array element.
        const lastGoodQuote = repaired.lastIndexOf('"');
        // Check if there's a complete value before this dangling quote
        const beforeQuote = repaired.substring(0, lastGoodQuote);
        const lastComma = beforeQuote.lastIndexOf(',');
        const lastOpenBrace = beforeQuote.lastIndexOf('{');
        const lastOpenBracket = beforeQuote.lastIndexOf('[');
        // Cut back to whichever delimiter came last
        const cutPoint = Math.max(lastComma, lastOpenBrace, lastOpenBracket);
        if (cutPoint > 0) {
            if (beforeQuote[cutPoint] === ',') {
                repaired = repaired.substring(0, cutPoint); // remove the comma and everything after
            } else {
                repaired = repaired.substring(0, cutPoint + 1); // keep the { or [
            }
        }
    }

    // Remove any trailing partial key-value like `"someKey": ` or `"someKey"`
    repaired = repaired.replace(/,\s*"[^"]*"\s*:\s*$/, '');
    repaired = repaired.replace(/,\s*"[^"]*"\s*$/, '');
    repaired = repaired.replace(/,\s*$/, '');

    // Close all unclosed brackets and braces
    const opens = { '{': 0, '[': 0 };
    const closes: Record<string, string> = { '{': '}', '[': ']' };
    let inString = false;
    let prevChar = '';
    for (let i = 0; i < repaired.length; i++) {
        const ch = repaired[i];
        if (ch === '"' && prevChar !== '\\') {
            inString = !inString;
        }
        if (!inString) {
            if (ch === '{') opens['{']++;
            if (ch === '}') opens['{']--;
            if (ch === '[') opens['[']++;
            if (ch === ']') opens['[']--;
        }
        prevChar = ch;
    }

    // Build closing sequence
    let suffix = '';
    // Close arrays first (they're typically nested inside objects in our schema)
    for (let i = 0; i < opens['[']; i++) suffix += ']';
    for (let i = 0; i < opens['{']; i++) suffix += '}';
    repaired += suffix;

    try {
        return JSON.parse(repaired);
    } catch (_) { /* one more attempt */ }

    // 6. Last resort: regex-extract the risks array even from badly broken JSON
    try {
        // Try to extract at least a partial result
        const objMatch = repaired.match(/"objectives"\s*:\s*"([^"]*)"/);
        const scopeMatch = repaired.match(/"scopeOfWork"\s*:\s*"([^"]*)"/);

        // Extract individual risk objects that ARE complete
        const riskObjects: any[] = [];
        const riskRegex = /\{[^{}]*"riskNo"\s*:\s*"[^"]*"[^{}]*"riskEvent"\s*:\s*"[^"]*"[^{}]*\}/g;
        let match;
        while ((match = riskRegex.exec(repaired)) !== null) {
            try {
                riskObjects.push(JSON.parse(match[0]));
            } catch (_) { /* skip malformed */ }
        }

        if (riskObjects.length > 0 || objMatch) {
            console.warn(`[JSON Parse] Extracted ${riskObjects.length} risks via regex fallback`);
            return {
                objectives: objMatch?.[1] || '',
                scopeOfWork: scopeMatch?.[1] || '',
                internalContext: '',
                externalContext: '',
                constraints: [],
                risks: riskObjects,
                strategicRecommendations: '',
            };
        }
    } catch (_) { /* truly broken */ }

    console.error('[JSON Parse] All repair attempts failed. First 500 chars:', text.substring(0, 500));
    throw new Error('AI ตอบกลับข้อมูลไม่สมบูรณ์ (JSON ถูกตัดทอน) กรุณากดลองใหม่อีกครั้ง');
}

function processSanitizedResponse(parsed: any, budget: number): Partial<TorProject> {
    const rawRisks = Array.isArray(parsed?.risks) ? parsed.risks : [];
    const sanitizedRisks: TorRiskItem[] = rawRisks.map((r: any, idx: number) => {
        const likelihood = Math.max(1, Math.min(5, Number(r.likelihood) || 3));
        const impact = Math.max(1, Math.min(5, Number(r.impact) || 3));
        const score = getTorRiskScore(likelihood, impact);
        const level = getTorRiskLevel(score);
        const probPct = Number(r.probabilityPct) || likelihoodToDefaultProbability(likelihood);
        const impactCost = Number(r.estimatedImpactCost) || Math.round(budget * (impact * 0.02));
        const emv = calculateEMV(probPct, impactCost);

        return {
            id: `tr-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
            riskNo: r.riskNo || `TR-${String(idx + 1).padStart(3, '0')}`,
            category: (r.category || 'Operational') as TorRiskCategory,
            cause: String(r.cause || '').trim(),
            riskEvent: String(r.riskEvent || `ความเสี่ยงรายการที่ ${idx + 1}`).trim(),
            consequence: String(r.consequence || '').trim(),
            torClauseRef: String(r.torClauseRef || 'TOR General').trim(),
            likelihood,
            impact,
            riskScore: score,
            riskLevel: level,
            treatmentStrategy: (r.treatmentStrategy || (score >= 10 ? 'Reduce' : 'Accept')) as TorTreatmentStrategy,
            controlMeasures: String(r.controlMeasures || '').trim(),
            contingencyPlan: String(r.contingencyPlan || '').trim(),
            estimatedImpactCost: impactCost,
            probabilityPct: probPct,
            emvValue: emv,
            contingencyRationale: String(r.contingencyRationale || `คำนวณตาม EMV ${probPct}% x ${impactCost.toLocaleString()} บาท`).trim(),
            proposalStrategy: String(r.proposalStrategy || '').trim(),
            riskOwner: String(r.riskOwner || 'Project Manager').trim(),
            timeline: (r.timeline || 'Proposal') as any,
            kpiIndicator: String(r.kpiIndicator || 'สถานะการส่งมอบตามกำหนด').trim(),
            status: 'Open',
        };
    });

    const rawConstraints = Array.isArray(parsed?.constraints) ? parsed.constraints : [];
    const sanitizedConstraints: TorConstraint[] = rawConstraints.map((c: any, idx: number) => ({
        id: `c-${Date.now()}-${idx}`,
        type: c.type || 'Other',
        description: String(c.description || '').trim(),
        penaltyDetails: String(c.penaltyDetails || '').trim(),
        severity: (c.severity || 'Medium') as any,
    }));

    return {
        objectives: String(parsed?.objectives || '').trim(),
        scopeOfWork: String(parsed?.scopeOfWork || '').trim(),
        internalContext: String(parsed?.internalContext || '').trim(),
        externalContext: String(parsed?.externalContext || '').trim(),
        constraints: sanitizedConstraints,
        risks: sanitizedRisks,
        strategicRecommendations: String(parsed?.strategicRecommendations || '').trim(),
    };
}

/**
 * Analyzes TOR document using Google Gemini 3.7 Flash with resilient fallback
 */
export async function analyzeTorDocument(input: TorAnalysisInput): Promise<TorAnalysisResult> {
    const apiKey = (input.customApiKey || '').trim() || getGeminiApiKey();
    const budget = input.estimatedBudget || 10000000;
    const title = input.projectTitle || 'โครงการตามเอกสารประกวดราคา (TOR)';
    const client = input.clientName || 'หน่วยงานผู้ว่าจ้าง';
    const selectedModel = input.selectedModel || 'gemini-3.7-flash';

    const systemInstruction = `
คุณคือผู้เชี่ยวชาญระดับสูงด้านการวิเคราะห์เอกสารประกวดราคา (TOR & Proposal Risk Specialist) และการบริหารความเสี่ยงโครงการตามมาตรฐาน ISO 31000:2018, COSO ERM และ PMBOK 7th Edition

หน้าที่ของคุณคือ:
1. สกัดข้อมูลโครงการ วัตถุประสงค์ (Objectives), ขอบเขตงาน (Scope of Work), ข้อกำหนดพิเศษ, บทลงโทษและค่าปรับความล่าช้า (Liquidated Damages: LDs) และปัจจัยบริบทภายใน/ภายนอก
2. ระบุและจำแนกความเสี่ยงสำคัญที่แฝงอยู่ใน TOR โดยครอบคลุม 8 หมวดหมู่:
   - Strategic (ความเสี่ยงเชิงกลยุทธ์)
   - Operational (ความเสี่ยงด้านการปฏิบัติงาน)
   - Financial (ความเสี่ยงทางการเงินและกระแสเงินสด)
   - Compliance (ความเสี่ยงด้านกฎหมาย สัญญา และบทปรับ)
   - Technology (ความเสี่ยงด้านเทคโนโลยีและข้อมูล)
   - Resource (ความเสี่ยงด้านบุคลากรและทรัพยากร)
   - Reputational (ความเสี่ยงด้านชื่อเสียงองค์กร)
   - Schedule (ความเสี่ยงด้านระยะเวลาและการส่งมอบ)
3. ให้คะแนน Likelihood (1-5) และ Impact (1-5)
4. กำหนดกลยุทธ์จัดการความเสี่ยง (Avoid, Reduce, Transfer, Accept) พร้อมมาตรการควบคุมเชิงรุกและแผนสำรอง (Contingency Plan)
5. ประเมินมูลค่าความเสียหายคาดการณ์ (Estimated Impact Cost ในหน่วยบาท THB สัมพันธ์กับงบโครงการ ${budget.toLocaleString()} บาท) และคำนวณงบสำรอง Contingency Buffer
6. แนะนำกลยุทธ์การร่างข้อเสนอ (Proposal Strategy) เช่น การขอสงวนสิทธิ์ การยื่น Qualification Clause หรือการเสนอ Alternative Option
7. สรุปคำแนะนำเชิงกลยุทธ์สำหรับคณะกรรมการพิจารณาซองราคา (Proposal Committee)

ข้อกำหนดสำคัญ:
- ตอบกลับเป็น JSON ที่ถูกต้องตาม RFC 8259 เท่านั้น
- ข้อความภายในทุก String ต้องเขียนเป็นประโยคที่กระชับ ไม่ใส่ raw newline หรืออักขระพิเศษที่ทำให้ JSON เสีย
`;

    const userPrompt = `
กรุณาวิเคราะห์เอกสาร TOR ต่อไปนี้อย่างละเอียด:
ข้อมูลเบื้องต้น:
- ชื่อโครงการ: ${title}
- ผู้ว่าจ้าง: ${client}
- งบประมาณประมาณการ: ${budget.toLocaleString()} บาท

${input.text ? `เนื้อหาเอกสาร TOR / ข้อกำหนด:\n${input.text}` : 'วิเคราะห์จากไฟล์เอกสารแนบ'}

ส่งผลลัพธ์กลับมาเป็นโครงสร้าง JSON ดังนี้:
{
  "objectives": "วัตถุประสงค์หลักของโครงการ",
  "scopeOfWork": "สรุปขอบเขตงานสำคัญและสิ่งที่ต้องส่งมอบ",
  "internalContext": "การวิเคราะห์ความพร้อมภายใน (กำลังคน, เทคโนโลยี, สภาพคล่อง)",
  "externalContext": "การวิเคราะห์ปัจจัยภายนอก (คู่แข่ง, สภาพอากาศ, กฎระเบียบ, ซัพพลายเออร์)",
  "constraints": [
    {
      "type": "LD | Milestone | Technical | Warranty | Financial | Other",
      "description": "รายละเอียดข้อจำกัดหรือเงื่อนไขบทปรับใน TOR",
      "penaltyDetails": "อัตราค่าปรับหรือผลกระทบ",
      "severity": "High | Medium | Low"
    }
  ],
  "risks": [
    {
      "riskNo": "TR-001",
      "category": "Strategic | Operational | Financial | Compliance | Technology | Resource | Reputational | Schedule",
      "cause": "สาเหตุรากเหง้า (Root Cause)",
      "riskEvent": "เหตุการณ์ความเสี่ยง (Risk Event)",
      "consequence": "ผลกระทบที่อาจเกิดขึ้น (Consequence)",
      "torClauseRef": "อ้างอิงข้อ TOR เช่น ข้อ 5.3 ค่าปรับ 0.1%/วัน",
      "likelihood": 3,
      "impact": 4,
      "treatmentStrategy": "Avoid | Reduce | Transfer | Accept",
      "controlMeasures": "มาตรการควบคุมเชิงป้องกันและวิธีปฏิบัติ",
      "contingencyPlan": "แผนสำรองฉุกเฉิน",
      "estimatedImpactCost": 500000,
      "probabilityPct": 50,
      "contingencyRationale": "หลักการคำนวณงบสำรอง (เช่น สำรองค่าปรับสูงสุด 15 วัน)",
      "proposalStrategy": "กลยุทธ์การปรับปรุงข้อเสนอหรือข้อสงวนสิทธิ์ในซองราคา",
      "riskOwner": "Project Manager | Commercial Lead | Legal Counsel | Engineering Lead",
      "timeline": "Pre-Bid | Proposal | Mobilization | Construction | Commissioning | Warranty",
      "kpiIndicator": "ตัวชี้วัดความเสี่ยง (KRI)"
    }
  ],
  "strategicRecommendations": "สรุปคำแนะนำเชิงกลยุทธ์สำคัญสำหรับบอร์ดบริหารก่อนอนุมัติยื่นซองราคา"
}
`;

    // ── If user selected Groq ────────────────────────────────────────────────
    if (selectedModel === 'llama-3.3-70b-versatile') {
        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            return { success: false, error: 'ไม่พบ Groq API Key ในระบบ กรุณาเลือกใช้ Google Gemini 3.7 Flash' };
        }
        try {
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemInstruction },
                        { role: 'user', content: userPrompt },
                    ],
                    temperature: 0.2,
                    max_tokens: 8192,
                    response_format: { type: 'json_object' },
                }),
            });

            if (!groqRes.ok) {
                const errData = await groqRes.json().catch(() => ({}));
                throw new Error(`Groq API (${groqRes.status}): ${errData.error?.message || groqRes.statusText}`);
            }

            const gData = await groqRes.json();
            const gText = gData.choices?.[0]?.message?.content;
            if (gText) {
                const parsed = robustParseJson(gText);
                return {
                    success: true,
                    data: processSanitizedResponse(parsed, budget),
                    provider: 'groq',
                    modelUsed: 'Groq Llama 3.3 70B Versatile',
                };
            }
        } catch (groqErr: any) {
            return { success: false, error: groqErr.message || 'เกิดข้อผิดพลาดในการเรียก Groq AI' };
        }
    }

    // ── Dedicated Gemini Execution Sequence ──────────────────────────────────
    // Prioritize 3.7-flash, then 2.5-flash, then 2.0-flash
    const primaryModel = selectedModel === 'gemini-2.5-flash' ? 'gemini-2.5-flash' : 'gemini-3.7-flash';
    const modelsToTry = [primaryModel, 'gemini-2.5-flash', 'gemini-2.0-flash'];

    let lastGeminiError = '';

    for (const model of modelsToTry) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            const parts: any[] = [];
            if (input.fileBase64 && input.mimeType && input.mimeType === 'application/pdf') {
                parts.push({
                    inlineData: {
                        mimeType: input.mimeType,
                        data: input.fileBase64,
                    },
                });
            }
            parts.push({ text: userPrompt });

            const payload = {
                contents: [{ role: 'user', parts }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
                generationConfig: {
                    temperature: 0.1,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 65536,
                    responseMimeType: 'application/json',
                },
            };

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
            };

            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                const msg = errData.error?.message || res.statusText;
                lastGeminiError = `Gemini API (${res.status}): ${msg}`;
                console.warn(`[Gemini] Model ${model} returned ${res.status}:`, msg);

                // If 503 Service Unavailable or 429 Rate Limit, brief wait then try next model
                if (res.status === 503 || res.status === 429 || res.status === 404) {
                    await new Promise((r) => setTimeout(r, 600));
                    continue;
                }
                break;
            }

            const data = await res.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (textResponse) {
                const parsed = robustParseJson(textResponse);
                if (parsed) {
                    return {
                        success: true,
                        data: processSanitizedResponse(parsed, budget),
                        provider: 'gemini',
                        modelUsed: `Google Gemini 3.7 Flash (${model})`,
                    };
                }
            }
        } catch (err: any) {
            lastGeminiError = err.message || String(err);
            console.warn(`[Gemini] Attempt on ${model} had error:`, err);
        }
    }

    // Format helpful error explanation
    let userFriendlyError = lastGeminiError;
    if (lastGeminiError.includes('401') || (lastGeminiError.includes('API keys are not supported') || lastGeminiError.includes('OAuth2'))) {
        userFriendlyError = `API Key ที่ระบุไม่ใช่ Google Gemini API Key โดยตรง (เป็น Token แบบ OAuth/Service Account)\n\n📌 วิธีรับ API Key ฟรีที่ถูกต้อง (ใช้เวลา 30 วินาที):\n1. ไปที่เว็บไซต์ https://aistudio.google.com/app/apikey\n2. เข้าสู่ระบบด้วยบัญชี Google แล้วกดปุ่ม "Create API key"\n3. คัดลอกคีย์ที่ขึ้นต้นด้วย "AIzaSy..." มาวางในช่อง "ตั้งค่า API Key" ด้านบน`;
    } else if (lastGeminiError.includes('403') && (lastGeminiError.includes('blocked') || lastGeminiError.includes('GenerativeService'))) {
        userFriendlyError = `Google API Key (${apiKey.substring(0, 10)}...) ยังไม่ได้เปิดใช้งาน "Generative Language API" บน Google Cloud Console\n\n📌 วิธีแก้ไข:\n1. ไปที่ https://aistudio.google.com/app/apikey เพื่อสร้าง API Key ฟรีโดยตรง\n2. นำคีย์ "AIzaSy..." มาวางในช่อง "ตั้งค่า API Key" ด้านบน`;
    } else if (lastGeminiError.includes('503')) {
        userFriendlyError = `เซิร์ฟเวอร์ Google Gemini กำลังมีผู้ใช้งานหนาแน่นชั่วคราว (503 Service Unavailable)\nกรุณากด "เริ่มวิเคราะห์ TOR ด้วย AI" ใหม่อีกครั้งในอีกสักครู่`;
    }

    return {
        success: false,
        error: userFriendlyError || 'เกิดข้อผิดพลาดในการวิเคราะห์เอกสาร TOR ด้วย Gemini 3.7 Flash',
    };
}
