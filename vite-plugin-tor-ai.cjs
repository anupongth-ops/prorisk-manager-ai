/**
 * vite-plugin-tor-ai.cjs
 * Vite plugin that provides /api/analyze-tor-risk server endpoint to bypass
 * browser HTTP Referrer restrictions (403 Requests from referer blocked).
 */

function torAiPlugin() {
    return {
        name: 'tor-ai-api',
        configureServer(server) {
            const handleTorAnalysis = async (req, res) => {
                if (req.method !== 'POST') {
                    res.statusCode = 405;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
                    return;
                }

                let body = '';
                req.on('data', chunk => { body += chunk.toString(); });
                req.on('end', async () => {
                    try {
                        const payload = JSON.parse(body);
                        const input = payload.input || payload;
                        const apiKey = payload.apiKey || process.env.GEMINI_API_KEY || '';

                        const budget = input.estimatedBudget || 10000000;
                        const title = input.projectTitle || 'โครงการตามเอกสารประกวดราคา (TOR)';
                        const client = input.clientName || 'หน่วยงานผู้ว่าจ้าง';

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

ตอบเป็น JSON Schema ที่ถูกต้องเท่านั้น ไม่มีข้อความเกริ่นหรือ markdown fence อื่นนอกจาก JSON
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
      "type": "LD",
      "description": "รายละเอียดข้อจำกัดหรือเงื่อนไขบทปรับใน TOR",
      "penaltyDetails": "อัตราค่าปรับหรือผลกระทบ",
      "severity": "High"
    }
  ],
  "risks": [
    {
      "riskNo": "TR-001",
      "category": "Operational",
      "cause": "สาเหตุรากเหง้า (Root Cause)",
      "riskEvent": "เหตุการณ์ความเสี่ยง (Risk Event)",
      "consequence": "ผลกระทบที่อาจเกิดขึ้น (Consequence)",
      "torClauseRef": "อ้างอิงข้อ TOR เช่น ข้อ 5.3 ค่าปรับ 0.1%/วัน",
      "likelihood": 3,
      "impact": 4,
      "treatmentStrategy": "Reduce",
      "controlMeasures": "มาตรการควบคุมเชิงป้องกันและวิธีปฏิบัติ",
      "contingencyPlan": "แผนสำรองฉุกเฉิน",
      "estimatedImpactCost": 500000,
      "probabilityPct": 50,
      "contingencyRationale": "หลักการคำนวณงบสำรอง (เช่น สำรองค่าปรับสูงสุด 15 วัน)",
      "proposalStrategy": "กลยุทธ์การปรับปรุงข้อเสนอหรือข้อสงวนสิทธิ์ในซองราคา",
      "riskOwner": "Project Manager",
      "timeline": "Proposal",
      "kpiIndicator": "ตัวชี้วัดความเสี่ยง (KRI)"
    }
  ],
  "strategicRecommendations": "สรุปคำแนะนำเชิงกลยุทธ์สำคัญสำหรับบอร์ดบริหารก่อนอนุมัติยื่นซองราคา"
}
`;

                        const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
                        let lastError = '';
                        let successData = null;

                        for (const model of models) {
                            try {
                                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

                                const parts = [];
                                if (input.fileBase64 && input.mimeType) {
                                    parts.push({
                                        inlineData: {
                                            mimeType: input.mimeType,
                                            data: input.fileBase64,
                                        },
                                    });
                                }
                                parts.push({ text: userPrompt });

                                const geminiPayload = {
                                    contents: [
                                        {
                                            role: 'user',
                                            parts: parts,
                                        },
                                    ],
                                    systemInstruction: {
                                        parts: [{ text: systemInstruction }],
                                    },
                                    generationConfig: {
                                        temperature: 0.2,
                                        topP: 0.8,
                                        topK: 40,
                                        maxOutputTokens: 8192,
                                        responseMimeType: 'application/json',
                                    },
                                };

                                const gRes = await fetch(url, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        // No browser referer sent from Node.js server!
                                    },
                                    body: JSON.stringify(geminiPayload),
                                });

                                if (!gRes.ok) {
                                    const errBody = await gRes.json().catch(() => ({}));
                                    lastError = `Gemini API (${gRes.status}): ${errBody.error?.message || gRes.statusText}`;
                                    console.warn(`[tor-ai-api] Model ${model} failed:`, lastError);
                                    continue;
                                }

                                const gData = await gRes.json();
                                const textResp = gData.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (!textResp) {
                                    lastError = 'No text returned from Gemini candidate';
                                    continue;
                                }

                                const clean = textResp.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
                                successData = JSON.parse(clean);
                                break;
                            } catch (mErr) {
                                lastError = mErr.message || String(mErr);
                                console.warn(`[tor-ai-api] Error on model ${model}:`, lastError);
                            }
                        }

                        if (!successData) {
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ success: false, error: lastError || 'All models failed' }));
                            return;
                        }

                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ success: true, data: successData }));
                    } catch (e) {
                        console.error('[tor-ai-api] Server Error:', e);
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ success: false, error: e.message }));
                    }
                });
            };

            // Register handlers for both direct /api and base path /epopm/api
            server.middlewares.use('/api/analyze-tor-risk', handleTorAnalysis);
            server.middlewares.use('/epopm/api/analyze-tor-risk', handleTorAnalysis);
        }
    };
}

module.exports = torAiPlugin;
