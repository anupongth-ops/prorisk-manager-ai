
import { RiskItem, ImpactLevel, LikelihoodLevel, PossibleEffect, MitigationStrategy } from '../types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const getApiKey = () => {
    return process.env.GROQ_API_KEY || null;
};

export const generateMitigationSuggestion = async (
    description: string,
    impact: ImpactLevel,
    likelihood: LikelihoodLevel,
    possibleEffect: PossibleEffect
): Promise<{ strategy: MitigationStrategy; action: string } | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const prompt = `
คุณคือผู้เชี่ยวชาญด้านการบริหารความเสี่ยงโครงการ (Project Risk Management Expert) 
วิเคราะห์ความเสี่ยงต่อไปนี้และแนะนำกลยุทธ์การจัดการพร้อมแผนดำเนินการที่เป็นรูปธรรม

## ข้อมูลความเสี่ยง
- **คำอธิบายความเสี่ยง:** ${description}
- **ระดับผลกระทบ (Impact):** ${impact}/5 ${impact >= 4 ? '(สูงมาก)' : impact >= 3 ? '(ปานกลาง-สูง)' : '(ต่ำ-ปานกลาง)'}
- **ระดับโอกาสเกิด (Likelihood):** ${likelihood}/5 ${likelihood >= 4 ? '(โอกาสสูง)' : likelihood >= 3 ? '(โอกาสปานกลาง)' : '(โอกาสต่ำ)'}
- **ผลกระทบที่อาจเกิดต่อ:** ${possibleEffect === 'C' ? 'ต้นทุน (Cost)' : possibleEffect === 'T' ? 'กำหนดเวลา (Time)' : possibleEffect === 'Q' ? 'คุณภาพ (Quality)' : 'ความปลอดภัย อาชีวอนามัย สิ่งแวดล้อม (HSE)'}
- **Risk Score:** ${impact * likelihood}/25

## กลยุทธ์การจัดการความเสี่ยง (เลือก 1 กลยุทธ์ที่เหมาะสมที่สุด)
- **A (Avoid/หลีกเลี่ยง):** เปลี่ยนแผนโครงการเพื่อขจัดความเสี่ยงหรือเงื่อนไขที่ก่อให้เกิดความเสี่ยง เหมาะกับความเสี่ยงที่มี Impact และ Likelihood สูงมาก
- **T (Transfer/ถ่ายโอน):** โอนความเสี่ยงไปให้บุคคลที่สาม เช่น ประกันภัย, สัญญาจ้างเหมา, Outsource เหมาะกับความเสี่ยงด้านการเงินหรือเทคนิคเฉพาะทาง
- **M (Mitigate/บรรเทา):** ดำเนินการเพื่อลดโอกาสเกิดหรือผลกระทบของความเสี่ยง เหมาะกับความเสี่ยงส่วนใหญ่ที่สามารถควบคุมได้
- **AC (Accept/ยอมรับ):** ยอมรับความเสี่ยงโดยไม่ดำเนินการใดๆ หรือสำรอง Contingency เหมาะกับความเสี่ยงที่มี Impact หรือ Likelihood ต่ำ

## หลักเกณฑ์การเลือกกลยุทธ์
- Risk Score >= 15: พิจารณา A (Avoid) หรือ T (Transfer)
- Risk Score 9-14: พิจารณา M (Mitigate) หรือ T (Transfer)  
- Risk Score 4-8: พิจารณา M (Mitigate)
- Risk Score 1-3: พิจารณา AC (Accept) หรือ M (Mitigate) เบาๆ

## สิ่งที่ต้องตอบ
ตอบเป็น JSON โดย:
1. **strategy**: เลือก 'A', 'T', 'M', หรือ 'AC' ที่เหมาะสมที่สุด
2. **action**: แผนดำเนินการที่เป็นรูปธรรม (ตอบเป็นภาษาไทย) ประกอบด้วย:
   - สิ่งที่ต้องทำ (What)
   - ผู้รับผิดชอบที่แนะนำ (Who)
   - กรอบเวลาที่แนะนำ (When)
   - ทรัพยากรที่อาจต้องใช้ (Resources)
   - วิธีวัดผลสำเร็จ (Success Criteria)

ตอบเฉพาะ JSON เท่านั้น ไม่ต้องมีข้อความอื่น ตัวอย่าง:
{"strategy": "M", "action": "..."}
  `;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a Project Risk Management Expert. Always respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1024,
                response_format: { type: 'json_object' }
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;

        if (!text) return null;

        const result = JSON.parse(text);

        // Handle case where action might be an object instead of string
        let actionText = result.action;
        if (typeof actionText === 'object' && actionText !== null) {
            // Convert object to formatted string
            actionText = Object.entries(actionText)
                .map(([key, value]) => `**${key}:** ${value}`)
                .join('\n');
        }

        return {
            strategy: result.strategy as MitigationStrategy,
            action: actionText,
        };

    } catch (error: any) {
        console.error("Error generating mitigation:", error);
        console.warn("Falling back to Mock Data due to API Error");

        // Fallback Mock Data
        return {
            strategy: MitigationStrategy.Mitigate, // Default to Mitigate
            action: `[จำลองคำตอบจาก AI เนื่องจากเกิดข้อผิดพลาด]\n\n1. จัดทำแผนสำรองฉุกเฉิน (Contingency Plan) สำหรับความเสี่ยงนี้\n2. มอบหมายผู้รับผิดชอบติดตามสถานะและรายงานผลทุกสัปดาห์\n3. พิจารณามาตรการลดผลกระทบหรือโอกาสเกิดตามความเหมาะสม\n4. ตรวจสอบทรัพยากรที่จำเป็นต้องใช้เพิ่มเติม`,
        };
    }
};
