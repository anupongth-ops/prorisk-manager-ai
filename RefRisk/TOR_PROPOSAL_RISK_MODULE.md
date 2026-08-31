# มอดูลประเมินความเสี่ยง TOR และกลยุทธ์เสนอราคา (TOR & Proposal Risk Assessment Module)
### ระบบบริหารความเสี่ยงตามมาตรฐานสากล ISO 31000:2018 / COSO ERM สำหรับการจัดทำข้อเสนอประมูล (Commercial & Technical Proposal)

---

## 1. ภาพรวมของมอดูล (Module Overview)

มอดูล **TOR & Proposal Risk Assessment** ออกแบบมาสำหรับทีมงานบริหารการเสนอราคา (Proposal Team), วิศวกรโครงการ (Risk & Project Engineers), ผู้เชี่ยวชาญด้านสัญญา (Contract & Legal Specialists) และคณะกรรมการพิจารณาซองราคา (Proposal Committee) ในการวิเคราะห์ข้อกำหนดในเอกสารประกวดราคา (Terms of Reference - TOR) อย่างรอบด้าน

โดยเปลี่ยนกระบวนการอ่าน TOR และการประเมินความเสี่ยงจากเดิมที่เป็นการประเมินด้วยสายตาและใช้ความรู้สึก มาเป็นการประเมินตามกรอบมาตรฐาน **ISO 31000:2018 Risk Management Guidelines**, **COSO ERM** และ **PMBOK Risk Management Framework** พร้อมเชื่อมโยงการตั้งงบประมาณสำรองความเสี่ยง (**Contingency Cost Buffer**) และกลยุทธ์การร่างข้อเสนอทางการค้าเพื่อป้องกันความเสี่ยงขาดทุนของโครงการ

---

## 2. กระบวนการบริหารความเสี่ยง 5 ขั้นตอน (5-Stage ISO 31000 Workflow)

การทำงานในมอดูลแบ่งออกเป็น 5 ขั้นตอนหลักตามมาตรฐานสากล:

```
[1. Scope & Context] ➔ [2. Risk Identification] ➔ [3. Risk Assessment & Matrix] ➔ [4. Risk Treatment & Contingency] ➔ [5. Monitoring & Governance]
```

### ขั้นตอนที่ 1: การกำหนดขอบเขตและบริบทของโครงการ (Scope & Context Establishment)
* **ข้อมูลโครงการ (Project Metadata):** รหัสข้อเสนอ (Proposal Code), ชื่อโครงการ (Project Title), ชื่อลูกค้า/ผู้ว่าจ้าง (Client Name), กำหนดส่งซอง (Submission Deadline), งบประมาณโครงการ (Estimated Budget & Currency)
* **การเข้าใจขอบเขตงาน (Scope Understanding):** วัตถุประสงค์หลัก (Objectives), ขอบเขตงาน (Scope of Work), ข้อจำกัดสำคัญและเงื่อนไขบทลงโทษปรับเกินเวลา (Key Constraints & Liquidated Damages - LDs)
* **บริบทองค์กร (Context Establishment):** บริบทภายในองค์กร (Internal Context - กำลังคน, เครื่องจักร, ความพร้อมทางการเงิน) และบริบทภายนอก (External Context - กฎหมาย, สภาพอากาศ, ซัพพลายเออร์, เงินเฟ้อ)

### ขั้นตอนที่ 2: การระบุความเสี่ยงและการเชื่อมโยง TOR (Risk Identification & TOR Traceability)
* **การจำแนกหมวดหมู่ความเสี่ยง (Risk Taxonomy):**
  1. Strategic Risk (ความเสี่ยงเชิงกลยุทธ์)
  2. Operational Risk (ความเสี่ยงด้านการปฏิบัติงาน)
  3. Financial Risk (ความเสี่ยงทางการเงินและกระแสเงินสด)
  4. Compliance / Contractual Risk (ความเสี่ยงด้านข้อกฎหมายและสัญญา)
  5. Technology / Data Risk (ความเสี่ยงด้านเทคโนโลยีและข้อมูล)
  6. Resource / Human Risk (ความเสี่ยงด้านบุคลากรและทรัพยากร)
  7. Reputational Risk (ความเสี่ยงด้านชื่อเสียงองค์กร)
  8. Schedule / Delivery Risk (ความเสี่ยงด้านระยะเวลาและการส่งมอบ)
* **การวิเคราะห์สาเหตุและผลกระทบ:** ระบุสาเหตุรากเหง้า (Cause), เหตุการณ์ความเสี่ยง (Risk Event), ผลกระทบ (Consequence)
* **การเชื่อมโยงข้อกำหนด TOR (TOR Clause Traceability):** อ้างอิงข้อความหรือข้อสัญญาใน TOR โดยตรง (เช่น *TOR ข้อ 4.2 บทปรับล่าช้า 0.1% ต่อวัน*) เพื่อให้ตรวจสอบย้อนกลับได้

### ขั้นตอนที่ 3: การประเมินและจัดลำดับความเสี่ยง (Risk Assessment & 5x5 Matrix)
* **เกณฑ์การวัด (Quantitative Scoring):**
  * **โอกาสเกิด (Likelihood: 1–5):** 1 = Rare (น้อยมาก), 2 = Unlikely (น้อย), 3 = Possible (ปานกลาง), 4 = Likely (มาก), 5 = Almost Certain (แน่นอน)
  * **ระดับผลกระทบ (Impact: 1–5):** 1 = Negligible (เล็กน้อย), 2 = Minor (น้อย), 3 = Moderate (ปานกลาง), 4 = Major (สูง), 5 = Severe (รุนแรงมาก)
  * **คะแนนความเสี่ยง (Risk Score) = Likelihood x Impact** (ค่า 1 ถึง 25)
* **การจัดระดับความรุนแรง (Risk Level Categorization):**
  * 🔴 **Critical Risk (15–25):** ความเสี่ยงระดับวิกฤต ต้องมีมาตรการลดความเสี่ยงและอนุมัติโดยระดับผู้บริหาร
  * 🟠 **High Risk (10–14):** ความเสี่ยงระดับสูง ต้องตั้งแผนควบคุมและงบ Contingency ชัดเจน
  * 🟡 **Medium Risk (5–9):** ความเสี่ยงระดับปานกลาง ควบคุมและติดตามโดย Project Manager
  * 🟢 **Low Risk (1–4):** ความเสี่ยงระดับต่ำ ยอมรับและติดตามตามรอบระยะเวลา
* **การแสดงผลเชิงทัศน์ (Visual Heat Map Grid):** ตารางตารางเมทริกซ์ 5x5 สีสัญลักษณ์ (Red/Orange/Yellow/Green) พร้อมฟังก์ชัน Click to Filter เจาะลึกรายการความเสี่ยงรายพิกัด

### ขั้นตอนที่ 4: มาตรการจัดการความเสี่ยงและงบสำรอง Contingency Cost (Risk Treatment & Proposal Strategy)
* **กลยุทธ์จัดการความเสี่ยง 4 แนวทาง (4 Treatment Strategies):**
  1. **Avoid (หลีกเลี่ยง):** ปรับเปลี่ยนขอบเขตงานหรือตั้งเงื่อนไขยื่น Qualification Clause ตัดความเสี่ยงออกจากสัญญา
  2. **Reduce / Mitigate (ลด/บรรเทา):** กำหนดมาตรการควบคุมเชิงป้องกันล่วงหน้าเพื่อลดโอกาสเกิดหรือลดผลกระทบ
  3. **Transfer / Share (โอนย้าย/แบ่งปัน):** โอนย้ายความเสี่ยงด้วยการทำประกันภัย (CAR Insurance) หรือการทำสัญญารับเหมาช่วง (Subcontracting)
  4. **Accept (ยอมรับ):** ยอมรับความเสี่ยงคงเหลือพร้อมสำรองงบประมาณ Contingency Buffer
* **มาตรการควบคุมและแผนสำรอง (Control Measures & Contingency Plan):** กำหนดการปฏิบัติงานจริงในสนามกรณีเกิดเหตุฉุกเฉิน
* **การคำนวณงบสำรอง Contingency Cost Buffer:**
  * **หลักการ Expected Monetary Value (EMV):** $EMV = \text{Probability (\%)} \times \text{Estimated Impact Cost (THB)}$
  * **สัดส่วนงบ Contingency (% of Budget):** แสดงสัดส่วนเปอร์เซ็นต์เทียบกับงบประมาณโครงการเสนอราคา
  * **Contingency Rationale:** ระบุสูตรหรือหลักการคำนวณ (เช่น สำรองค่าปรับสูงสุด 30 วัน, เบี้ยประกันภัย CAR, ค่า Standby เครื่องจักร)
* **กลยุทธ์การปรับแต่งข้อเสนอ (Proposal Strategy Alignment):** ข้อแนะนำสำหรับการร่างซองเทคนิค/ซองราคา เช่น การขอสงวนสิทธิ์ในใบเสนอราคา การเสนอทางเลือกเทคนิค (Alternative Proposal) หรือการเรียกร้อง QA Clarification ในช่วง Bidding

### ขั้นตอนที่ 5: การติดตาม ทบทวน และข้อเสนอแนะเชิงกลยุทธ์ (Monitoring, Review & Strategic Advice)
* **โครงสร้างการกำกับดูแล (Risk Governance Matrix):**
  * **เจ้าของความเสี่ยง (Risk Owner):** ระบุผู้รับผิดชอบรายตำแหน่ง (เช่น Project Manager, Commercial Lead, Legal Counsel)
  * **กรอบเวลาดำเนินการ (Timeline):** เช่น Pre-Bid Stage, Proposal Stage, Mobilization Phase, Construction Phase
  * **ดรรชนีชี้วัด (KPI / Key Risk Indicators):** ตัวเกณฑ์วัดผลเชิงปริมาณเพื่อติดตามสถานะความเสี่ยง
* **คำแนะนำเชิงกลยุทธ์สำหรับคณะกรรมการ (Strategic Recommendations):** สรุปประเด็นตัดสินใจสำคัญสำหรับบอร์ดบริหารก่อนลงนามอนุมัติยื่นซองราคา

---

## 3. ระบบ AI TOR Analyzer (ระบบวิเคราะห์เอกสารอัตโนมัติด้วย Gemini AI)

มอดูลนี้รวมความสามารถของ **Gemini Multimodal AI API** (`gemini-2.5-flash` / `gemini-3.6-flash`) ในการอ่านและวิเคราะห์เอกสาร TOR โดยอัตโนมัติ:

* **รองรับไฟล์หลากหลายรูปแบบ:**
  * ไฟล์เอกสาร **PDF** (อ่านข้อความและโครงสร้างด้วย Base64 Inline Data DataURL)
  * ไฟล์เอกสาร **Microsoft Word (.docx / .doc)**
  * ข้อความ TOR ดิบ (Raw Text Entry)
* **กระบวนการวิเคราะห์ของ AI (`/api/analyze-tor-risk`):**
  1. สกัดข้อความและบริบทสำคัญจาก TOR
  2. วิเคราะห์ข้อกำหนด สัญญา บทปรับ และเงื่อนไขเทคนิค
  3. จัดหมวดหมู่ความเสี่ยงและประเมินคะแนน Likelihood & Impact ตามกรอบ ISO 31000
  4. เสนอแนะมาตรการควบคุม, กลยุทธ์การยื่น Proposal, มูลค่าผลกระทบ (Estimated Impact Cost), และงบ Contingency Cost ที่เหมาะสม
  5. ส่งผลลัพธ์กลับมาในรูปแบบ Structured JSON Schema สอดคล้องกับระบบทันที

---

## 4. ระบบรายงานและการส่งออกข้อมูล (Reporting & Export Features)

### 1. รายงาน PDF ฉบับสมบูรณ์ 5 หัวข้อ (Complete 5-Section Printable PDF Report)
รองรับการดูพรีวิวและพิมพ์ผ่านเบราว์เซอร์ (`window.print()` หรือ Save as PDF) โดยมีโครงสร้างมาตรฐานครบถ้วน 5 ข้อ:
1. **ข้อที่ 1:** การกำหนดขอบเขตและบริบทของโครงการ (Executive Summary, Scope, Constraints, Internal/External Context)
2. **ข้อที่ 2:** การระบุความเสี่ยงและการเชื่อมโยงข้อกำหนด TOR (Risk ID, Category, Cause, Event, Consequence, TOR Reference)
3. **ข้อที่ 3:** การประเมิน วิเคราะห์ และจัดลำดับความเสี่ยง (Risk Assessment Table, Severity Badge, Likelihood x Impact)
4. **ข้อที่ 4:** มาตรการจัดการความเสี่ยง งบสำรอง Contingency Cost และกลยุทธ์ Proposal (Treatment, Controls, EMV Calculation, Contingency Buffer)
5. **ข้อที่ 5:** การติดตาม ทบทวน และข้อเสนอแนะเชิงกลยุทธ์สำหรับคณะกรรมการ (Governance Matrix, Risk Owner, Timeline, KPI, Board Recommendations และช่องลงนามอนุมัติ Sign-off Block)

### 2. การส่งออกไฟล์ CSV / Excel (CSV Data Export)
* ส่งออกรายการความเสี่ยงทั้งหมดพร้อมค่าคะแนน, มาตรการควบคุม, งบ Contingency Buffer, Risk Owner และข้อแนะนำ Proposal
* สามารถนำไปประมวลผลต่อใน Microsoft Excel หรือโปรแกรมประมาณราคาทางการเงิน (Financial Cost Model) ได้ทันที

---

## 5. โครงสร้างไฟล์และส่วนประกอบระบบ (System Architecture & Files)

```
/src
├── types/
│   └── torRisk.ts                   # Standard Types Interfaces (RiskItem, Project, Strategy, etc.)
├── pages/
│   └── TorRiskAssessment.tsx        # Main Page Module (5-Tab State, KPI Summary, Heatmap Interaction)
├── components/tor-risk/
│   ├── ContextSection.tsx           # Tab 1: Scope, Context & Constraints Editor
│   ├── RiskHeatMap.tsx              # Tab 2 & 3: Interactive 5x5 Matrix & Category Filter
│   ├── RiskRegisterTable.tsx        # Tab 2 & 3: Editable Risk Register Grid
│   ├── TreatmentAndProposalSection.tsx # Tab 4: Risk Treatment & Contingency Cost Calculator
│   ├── AiAnalyzerModal.tsx          # AI TOR Document Upload & Processing Modal
│   └── PdfReportModal.tsx           # Printable Complete 5-Section PDF Report Component
/server.ts                           # Express Server Endpoint (/api/analyze-tor-risk via Gemini AI)
```

---

## 6. คู่มือการใช้งานสำหรับผู้ใช้ (Step-by-Step User Guide)

### ขั้นตอนที่ 1: การสร้างโครงการหรือใช้ออพชั่น AI วิเคราะห์ TOR
1. เลือกโครงการที่มีอยู่ในระบบ หรือคลิกปุ่ม **"AI TOR Analyzer"**
2. อัปโหลดไฟล์เอกสาร TOR (PDF / Word) หรือวางข้อความรายละเอียด TOR
3. กรอกชื่อโครงการ ชื่อลูกค้า และงบประมาณโครงการ
4. กดปุ่ม **"เริ่มวิเคราะห์ TOR ด้วย AI"** ระบบจะอ่านเอกสารและสร้างตารางความเสี่ยง 5 ขั้นตอนให้อัตโนมัติ

### ขั้นตอนที่ 2: การปรับแต่งรายละเอียดใน 5 Tabs
* **Tab 1 (Scope & Context):** ตรวจสอบและแก้ไขวัตถุประสงค์ ขอบเขตงาน และเงื่อนไขบทลงโทษใน TOR
* **Tab 2 (Risk ID & TOR Ref):** เพิ่ม/แก้ไขรายการความเสี่ยง พร้อมระบุข้อ TOR อ้างอิง
* **Tab 3 (Risk Matrix 5x5):** ปรับค่า Likelihood (1-5) และ Impact (1-5) ระบบจะคำนวณ Risk Score และแสดงผลบน Heat Map
* **Tab 4 (Treatment & Contingency):** เลือกกลยุทธ์ Risk Treatment (Avoid, Reduce, Transfer, Accept) และใช้ปุ่ม **"คำนวณตาม EMV ISO 31000"** เพื่อประมาณการงบสำรอง Contingency Cost Buffer อัตโนมัติ
* **Tab 5 (Monitoring & Advice):** กำหนดผู้รับผิดชอบ (Risk Owner), กรอบเวลา (Timeline), KPI และพิมพ์ข้อเสนอแนะสำหรับคณะกรรมการ

### ขั้นตอนที่ 3: การออกรายงาน PDF และ CSV
1. คลิกปุ่ม **"พิมพ์รายงาน PDF (ครบถ้วน 5 ข้อ)"** ที่แถบเครื่องมือด้านบน
2. ตรวจสอบพรีวิวเอกสารรายงานที่มีเนื้อหาครอบคลุม 5 ส่วนตามมาตรฐาน ISO 31000 พร้อมช่องลงนามผู้จัดทำและผู้อนุมัติ
3. กดปุ่ม **"พิมพ์ / บันทึก PDF"** เพื่อพิมพ์ออกทางเครื่องพิมพ์ หรือบันทึกเป็นไฟล์ PDF (Save as PDF)

---

**พัฒนาขึ้นโดย:** ทีมวิศวกรและสถาปนิกซอฟต์แวร์ระบบ EPC Management System
**มาตรฐานที่อ้างอิง:** ISO 31000:2018 Risk Management, COSO ERM Framework, PMBOK Guide 7th Edition
