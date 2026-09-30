# คู่มือการเตรียมข้อมูลจำลองและขั้นตอนการบันทึกหน้าจอ (Demo Data & Screen Recording Guide)

คู่มือนี้จัดทำขึ้นเพื่อให้ทีมงานบันทึกหน้าจอ (Screen Capturer) สามารถเตรียมข้อมูลจำลอง (Mock Datasets) และปฏิบัติตามลำดับการคลิก (Click-Path) ได้อย่างถูกต้อง แม่นยำ และมีความเป็นมืออาชีพสูงสุด

---

## 1. การเตรียมสภาพแวดล้อมก่อนเริ่มบันทึก (Pre-Recording Checklist)

1. **การตั้งค่าหน้าจอและเบราว์เซอร์:**
   - ใช้ความละเอียดหน้าจอ **1920 × 1080** (Windows Display Scaling: 100%)
   - เบราว์เซอร์: Google Chrome หรือ Microsoft Edge
   - ตั้งค่า Browser Zoom เป็น **100%** เสมอ
   - เคลียร์ Bookmark Bar หรือกด `Ctrl + Shift + B` เพื่อซ่อนแถบที่คั่นหน้า
   - ปิดส่วนขยาย (Extensions) ที่ไม่เกี่ยวข้องทั้งหมด
2. **การตั้งค่าเมาส์และเคอร์เซอร์:**
   - ใช้ความเร็วเมาส์ปานกลาง เคลื่อนที่อย่างราบรื่น (Smooth Motion)
   - ไม่แกว่งเมาส์ไปมาอย่างไร้จุดหมาย
   - เมื่อคลิกปุ่มใดๆ ให้หยุดค้างไว้ ณ จุดนั้นประมาณ **1 วินาที** ก่อนเลื่อนไปยังจุดถัดไป เพื่อให้ง่ายต่อการตัดต่อและใส่ Zoom Effect
3. **การปิดการรบกวน:**
   - เปิดโหมด **Do Not Disturb / Focus Assist** ใน Windows
   - ออกจากโปรแกรม LINE, Outlook, MS Teams เพื่อป้องกัน Pop-up แจ้งเตือนเด้งขึ้นมาระหว่างอัด

---

## 2. ชุดข้อมูลจำลองสำหรับการสาธิต (Mock Datasets)

เพื่อให้วิดีโอมีความสมจริงและสอดคล้องกับธุรกิจ EPC แต่ไม่เปิดเผยข้อมูลความลับทางการค้า ให้ใช้ชุดข้อมูลจำลองมาตรฐานดังต่อไปนี้:

### 2.1 ข้อมูลโครงการจำลอง (Project Setup Demo Data)
- **Project No:** `PRJ-2026-PC08` (ตรงตามรูปแบบ ERP SAP)
- **Project Name:** `Olefins Expansion & De-bottlenecking Project (Package B)`
- **Project Manager (PM):** `Somchai Prasert (PM)`
- **Industry Type:** `Petrochemical & Refining`
- **Project Type:** `Brownfield Revamp`
- **Initial Risk Appetite:** `Moderate (Risk Score Threshold: 12)`
- **Budget / Contract Value:** `50,000,000 THB`

### 2.2 ปัจจัยถ่วงน้ำหนักความเสี่ยง (Step 2 Weighting Factors Demo)
- [x] **Project Nature:** `Brownfield (Existing Plant Operating)` ➔ *(+2 Likelihood, +2 Impact)*
- [x] **Project Nature:** `Fast-track Schedule` ➔ *(+2 Likelihood)*
- [x] **Technology:** `Proven Standard Technology` ➔ *(-1 Likelihood - Negative Adjustment)*
- [x] **Commercial:** `Lump Sum Turnkey (LSTK) with Strict Liquidated Damages`
- [x] **Location & Supply Chain:** `Critical Long-lead Imported Equipment (Cryogenic Valves)`

### 2.3 ตัวอย่างการเขียนความเสี่ยงสำหรับสาธิต AI Copilot (EP 05)
- **Risk Title:** `ความล่าช้าในการจัดส่ง Cryogenic Control Valves จากผู้ผลิตในยุโรป`
- **Description (ตาม ISO 31000):**  
  > *"เนื่องจากผู้ผลิตวาล์วควบคุมหลักในต่างประเทศประสบปัญหาขาดแคลนวัตถุดิบและคอขวดในการทดสอบ Hydrostatic Test จึงเสี่ยงต่อการส่งมอบล่าช้ากว่าแผน 6 สัปดาห์ ส่งผลให้กระทบต่องานติดตั้งท่อ และอาจทำให้วันทดสอบระบบ (Commissioning) เลื่อนออกไปจนเกิดค่าปรับ LDs"*
- **Possible Effect:** ติ๊กเลือก `Cost`, `Time`, และ `Quality`
- **Initial Rating (ก่อน AI แนะนำ):** Likelihood = 4, Impact = 4 (คะแนน = 16: โซนสีแดง Very High)
- **ผลลัพธ์ที่ AI แนะนำ (Action Plan):**
  - *Strategy:* `Mitigate`
  - *Action to Control:* *"จัดส่งทีม Third-Party Inspector เข้าตรวจความคืบหน้า ณ โรงงานผู้ผลิตทุก 2 สัปดาห์ (Expediting Visit) พร้อมขอสิทธิ์ Fast-track Air Freight สำหรับวาล์ว 4 ตัวแรกที่อยู่ใน Critical Path เพื่อส่งมาติดตั้งก่อน"*
  - *Action Owner:* `Procurement & QC Lead (Wichai K.)`
  - *Target Date:* `ภายในวันที่ 15 ของเดือนถัดไป`
  - *Residual Score:* Likelihood = 2, Impact = 2 (คะแนน = 4: โซนสีเหลือง Medium)

### 2.4 ข้อมูลจำลองเอกสาร TOR สำหรับสาธิตโมดูล Pre-Bid (EP 07)
- **Proposal Code:** `PROP-2026-001`
- **Client Name:** `National Petrochemical Public Co., Ltd.`
- **Scope Summary:** `EPC Contract for Sour Gas Treatment Unit`
- **สกัดเงื่อนไขสัญญา (LDs Clause):**
  > *"In the event of delay in Completion Date, Contractor shall pay Liquidated Damages at the rate of 0.1% of Contract Price per calendar day, up to a maximum cap of 10.0% of the Total Contract Value."*
- **ตัวเลข EMV Summary:**
  - *Probability:* `20%`
  - *Estimated Financial Impact:* `13,000,000 THB`
  - *EMV Buffer:* `2,600,000 THB` (คิดเป็น 5.20% ของมูลค่าโครงการ 50M THB)

---

## 3. ลำดับขั้นตอนการคลิกหน้าจอรายตอน (Click-Path Guide)

### ตอนที่ 2: Login & Security
1. เข้าไปที่ URL `www.gcmeapp.com/epopm`
2. ชี้เมาส์ไปที่ปุ่ม `Sign in with Microsoft` ค้างไว้ 1 วินาที
3. เลื่อนลงมาที่ช่อง Email กรอก `demo.pm@gcme.com`
4. ที่ช่อง Password กรอก `gcme1234567` แล้วกด Enter
5. แสดงหน้าต่าง Modal "Change Default Password" ให้พิมพ์รหัสผ่านใหม่ตัวอย่าง แล้วกดตกลง
6. หน้าจอโหลดเข้าสู่หน้า Dashboard หลัก

### ตอนที่ 3: Project Setup (Step 1 & Step 2)
1. คลิกปุ่มสีน้ำเงิน `+ New Project` ด้านบนขวา
2. ที่หน้าต่าง Step 1:
   - พิมพ์ Project No: `PRJ-2026-PC08`
   - พิมพ์ Name: `Olefins Expansion & De-bottlenecking`
   - พิมพ์ PM: `Somchai Prasert`
   - เลือก Industry: `Petrochemical & Refining`
   - ชี้เมาส์ไปที่ดรอปดาวน์ `Data Inheritance` โชว์ตัวเลือกโครงการเดิม ค้างไว้ 1 วินาที
   - คลิกปุ่มสีน้ำเงิน `Next →`
3. ที่หน้าต่าง Step 2:
   - ติ๊กเลือก `Brownfield (+2 Both)`
   - ติ๊กเลือก `Fast-track (+2 Likelihood)`
   - ติ๊กเลือก `Proven Technology (-1 Likelihood)`
   - เลื่อนลงมาด้านล่าง คลิกปุ่ม `Initialize Baseline Risks`
4. หน้าจอแสดง Loading เล็กน้อย แล้วเปลี่ยนเป็นรายการความเสี่ยง 31 รายการ

### ตอนที่ 4: Dashboard & 5x5 Heatmap
1. เปิดหน้า Dashboard
2. แพนสายตา / ชี้เมาส์ไปที่การ์ด KPI ด้านบน: `Review Due`, `Exceeds Appetite`, `Overdue By Level`
3. เลื่อนเมาส์มาที่ตาราง **5x5 Heatmap Matrix**
4. ชี้ไล่ระดับสี: เขียว ➔ เหลือง ➔ ส้ม ➔ แดง
5. คลิกที่ช่องสีแดงช่องหนึ่งใน Heatmap ➔ สังเกตตารางด้านล่างกรองเหลือเฉพาะรายการสีแดง
6. คลิกซ้ำเพื่อปลดฟิลเตอร์

### ตอนที่ 5: AI Suggest Action Plan
1. คลิกปุ่ม `+ Add Risk` หรือกดแก้ไขความเสี่ยงรายการหนึ่ง
2. กรอกข้อความ Description ตามสคริปต์ข้อ 2.3
3. ติ๊ก Effect: `Cost`, `Time`
4. เลื่อนเมาส์ไปชี้ปุ่มสีม่วง `✨ AI Suggest` ค้างไว้ 1 วินาที แล้วคลิก
5. รอข้อความประมวลผล (Spinner 3 วินาที)
6. เมื่อข้อความ Action Plan, Owner และ Residual Score ปรากฏ ให้เลื่อนเมาส์ไฮไลต์ทีละส่วน
7. คลิกบน Interactive Heatmap Picker เพื่อยืนยันคะแนน 2x2
8. คลิกปุ่ม `Save Risk`

### ตอนที่ 6: Excel Grid Mode
1. ที่แถบ Navbar คลิกปุ่ม `Excel Grid`
2. หน้าจอเปลี่ยนเป็นมุมมอง Spreadsheet
3. ดับเบิลคลิกที่เซลล์ Description แถวที่ 1 แก้ไขข้อความเล็กน้อย
4. ดับเบิลคลิกเปลี่ยนชื่อ Owner เป็นชื่ออื่น
5. คลิกเปลี่ยนคะแนน Likelihood ในเซลล์ดรอปดาวน์
6. นำเมาส์ไปชี้ที่หัวคอลัมน์ `Impact` ค้างไว้ 2 วินาที เพื่อแสดง Hover Header Guide Tooltip
7. ชี้แถบเตือนด้านล่าง "Unsaved Changes"
8. เลื่อนเมาส์ไปคลิกปุ่ม `Save All Changes` ด้านบนขวา ➔ สังเกตสถานะเปลี่ยนเป็น Saved สีเขียว

### ตอนที่ 7: Pre-Bid TOR Scanner & EMV
1. เข้าเมนู `TOR Assessment` บน Navbar
2. ลากไฟล์ PDF จำลอง (เช่น `TOR_SourGas_Unit.pdf`) วางลงในพื้นที่ Drag & Drop
3. คลิกปุ่ม `🤖 AI Scan TOR`
4. แสดงผลการสแกน: ชี้เมาส์ที่กล่องข้อความสกัดบทปรับ LDs 0.1%/day
5. คลิกไล่แท็บ Workflow: `1. Scope` ➔ `2. Identify` ➔ `3. 5x5 Matrix` ➔ `4. Contingency & Buffer`
6. ที่แท็บ 4 ชี้ที่ตัวเลขสรุป `EMV Contingency Buffer = 2,600,000 THB (5.20%)`
7. คลิกปุ่ม `1-Click Executive PDF` เพื่อแสดงหน้าพรีวิวเอกสารพร้อมพื้นที่ลงนาม

### ตอนที่ 8: Review Monitoring & Official Export
1. ในหน้า Risk Register ชี้แถบสีแดงของรายการที่ติดแท็ก `Overdue`
2. คลิกปุ่ม `Email Alert` หรือ `1-Click Dispatch` เพื่อแสดงหน้าต่างส่งเมล / คัดลอกลง MS Teams
3. คลิกปุ่ม `Export` บนแถบเมนู
4. ที่หน้าต่าง Export Modal เลือกเทมเพลต `EPM-03-014AT1 (Official GCME Format)`
5. คลิกดาวน์โหลดไฟล์ `.xlsx`
6. สลับไปเปิดไฟล์ Excel ที่โหลดขึ้นมา แสดงหน้าตารางที่จัดฟอร์แมต ฟอนต์ และสี Badge สวยงาม 100%
7. สลับกลับมาหน้าเว็บ คลิกปุ่ม `1-Click SQL Dump` โชว์การดาวน์โหลดไฟล์สำรองข้อมูล

### ตอนที่ 9: Weekly Routine & Best Practices
1. สาธิตการเปิด Dashboard กรองดูเฉพาะความเสี่ยงสีส้มและแดง (สเต็ป 1)
2. เคลียร์รายการ Overdue โดยการกดอัปเดตสถานะ (สเต็ป 2)
3. สลับเข้า Excel Grid กดแก้ไขความคืบหน้าแล้วกด Save All Changes (สเต็ป 3)
4. เปลี่ยนสถานะความเสี่ยงรายการหนึ่งเป็น `Closed` (สเต็ป 4)
5. เลื่อนเมาส์ขึ้นไปคลิกเมนู `Risk Guide / คู่มือ` บน Navbar เพื่อแสดงหน้าต่างคู่มือออนไลน์
6. เลื่อนหน้าจอไปยังส่วน Contact Support: E-PO-PM Team
