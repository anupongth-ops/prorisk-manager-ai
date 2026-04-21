# ProRisk Manager AI — ขั้นตอนการทำงานและคู่มือการใช้งาน

**Version:** 0.2 | **Updated:** มีนาคม 2026

---

## 📌 ภาพรวมระบบ (System Overview)

**ProRisk Manager AI** เป็นเว็บแอปพลิเคชันสำหรับบริหารจัดการความเสี่ยงของโครงการ EPC (Engineering, Procurement, Construction) พัฒนาด้วย React + TypeScript บน Firebase โดยมีระบบ AI (Groq Llama-3) ช่วยแนะนำแผนการจัดการความเสี่ยงอัตโนมัติ

### กลุ่มผู้ใช้งาน

| บทบาท | สิทธิ์ |
|-------|--------|
| **Admin** | เข้าถึงทุกโครงการ, จัดการผู้ใช้, สร้าง/แก้ไข/ลบ Risk ทุกโครงการ |
| **User** | เข้าถึงเฉพาะโครงการที่ Admin กำหนดให้ |

---

## 🔄 ขั้นตอนการทำงานหลัก (Main Workflow)

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  เข้าสู่ระบบ  │────▶│ สร้างโครงการ │────▶│  เพิ่ม/จัดการ Risk │────▶│  วิเคราะห์   │
│  (Login)    │     │ (New Project) │     │  (Risk Register)  │     │  รายงาน      │
└─────────────┘     └──────────────┘     └──────────────────┘     └──────────────┘
       │                                          │
       │                                   ┌──────────────┐
       │                                   │  AI Suggest  │
       │                                   │  (Groq AI)   │
       └───────────────────────────────────┴──────────────┘
```

---

## 1️⃣ การเข้าสู่ระบบ (Authentication Flow)

### ขั้นตอน
```
เปิดเว็บแอป
     │
     ▼
กรอก Email + Password ──▶ คลิก "Sign In"
     │
     ▼
Firebase Authentication ตรวจสอบ
     │
     ├──▶ [ครั้งแรก / รหัสผ่านเริ่มต้น]
     │        │
     │        ▼
     │    บังคับเปลี่ยนรหัสผ่าน (ChangePasswordScreen)
     │        │
     │        ▼
     └──▶ [ปกติ] เข้าสู่หน้า Dashboard
```

**หมายเหตุ:**
- รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร
- Admin จะสร้างบัญชีผู้ใช้ใหม่ผ่าน Admin Panel
- ผู้ใช้ใหม่จะได้รับรหัสผ่านเริ่มต้นและต้องเปลี่ยนทันที

---

## 2️⃣ หน้าหลัก (Dashboard)

### เลย์เอาต์หน้าหลัก

```
┌─────────────────────────────────────────────────────┐
│  NAVBAR: Logo | Import | Summary | Admin | User | 🌙 │
├─────────────────────┬───────────────────────────────┤
│  Dashboard Stats    │       Risk Bar Chart           │
│  • ความเสี่ยงรวม    │  (กราฟแท่งการกระจายความเสี่ยง)│
│  • Open/Closed      │                               │
│  • โครงการทั้งหมด   │                               │
├──────────────────────┬──────────────────────────────┤
│  Status Bar Chart    │  Overdue Risk Chart           │
│  (Open/InProgress/   │  (ความเสี่ยงที่เกินกำหนด)     │
│   Closed)            │                               │
├──────────────────────┬──────────────────────────────┤
│  Initial Risk Matrix │  Residual Risk Matrix         │
│  (ก่อน Mitigation)   │  (หลัง Mitigation)            │
├─────────────────────────────────────────────────────┤
│  Dashboard Controls: Project Filter | Benchmark | Search │
├─────────────────────────────────────────────────────┤
│              Risk Table (ตารางรายการความเสี่ยง)        │
└─────────────────────────────────────────────────────┘
```

### แผงควบคุมหลัก (Navbar)

| ปุ่ม/ไอคอน | ฟังก์ชัน |
|------------|---------|
| **+ Add Risk** | เพิ่มความเสี่ยงใหม่ |
| **📁+ New Project** | สร้างโครงการใหม่ |
| **☁️↑ Import** | นำเข้าจาก CSV |
| **📄 Summary** | ดูรายงานสรุป |
| **🛡️ Admin** | จัดการผู้ใช้ (Admin เท่านั้น) |
| **User Icon** | ข้อมูลบัญชีผู้ใช้ |
| **🌙/☀️** | สลับ Dark/Light Mode |

---

## 3️⃣ การสร้างโครงการใหม่ (New Project Flow)

```
คลิก "New Project" (📁+)
     │
     ▼
กรอกข้อมูลโครงการ:
  • Project Number (ห้ามซ้ำ)
  • Project Name
  • PM Name + Email
  • Industry Type (Power Plants / Petrochemical / Oil&Gas / Data Centre)
     │
     ▼
เลือก Project Modifiers (Weighting Factors)
(ปัจจัยที่มีผลต่อน้ำหนักความเสี่ยง)
     │
     ▼
[ตัวเลือก] เปิด "Generate Baseline Risks"
     │  ──▶ ระบบสร้าง 31 Baseline Risks อัตโนมัติตามอุตสาหกรรม
     │
     ▼
คลิก "Create Project"
     │
     ▼
ระบบเปิด Add Risk Form (สำหรับใส่ Risk แรก)
```

---

## 4️⃣ การจัดการความเสี่ยง (Risk Management Flow)

### 4.1 เพิ่มความเสี่ยงใหม่

```
คลิก "Add Risk" (+)
     │
     ▼
กรอกข้อมูล Risk:
  ┌─────────────────────────────────────────┐
  │ ข้อมูลโครงการ                            │
  │  • Project: เลือกโครงการ                │
  │  • Risk Category: หมวดหมู่ความเสี่ยง     │
  │  • Risk ID: ระบบสร้างอัตโนมัติ (R-001)  │
  ├─────────────────────────────────────────┤
  │ รายละเอียดความเสี่ยง                      │
  │  • Description: อธิบายความเสี่ยง         │
  │  • Possible Effect: C / T / Q / HSE     │
  │  • Owner: ผู้รับผิดชอบ                   │
  ├─────────────────────────────────────────┤
  │ การประเมินเบื้องต้น (Initial Risk)        │
  │  • Impact: 1-5 (Insignificant → Severe) │
  │  • Likelihood: 1-5 (Rarely → Most Likely)│
  ├─────────────────────────────────────────┤
  │ แผนการจัดการ (Mitigation)                │
  │  • Strategy: Avoid/Transfer/Mitigate/   │
  │              Accept                      │
  │  • Action Plan: แผนดำเนินการ            │
  │  [🤖 AI Suggest] ← คลิกให้ AI แนะนำ    │
  ├─────────────────────────────────────────┤
  │ ความเสี่ยงที่เหลือ (Residual Risk)        │
  │  • Impact: 1-5                          │
  │  • Likelihood: 1-5                      │
  ├─────────────────────────────────────────┤
  │ ข้อมูลติดตาม                              │
  │  • Status: Open / In Progress / Closed  │
  │  • Raised Date / Deadline / Finished    │
  │  • Comment                              │
  └─────────────────────────────────────────┘
     │
     ▼
คลิก "Save Risk" ──▶ บันทึกลง Firestore
                 ──▶ ระบบสร้าง History อัตโนมัติ
```

### 4.2 ระดับความเสี่ยง (Risk Level Matrix 5×5)

| | Rarely (1) | Unlikely (2) | Occasional (3) | Likely (4) | Most Likely (5) |
|---|---|---|---|---|---|
| **Severe (5)** | Low | Significant | Critical | Extreme | Extreme |
| **Major (4)** | Low | Significant | Critical | Critical | Extreme |
| **Moderate (3)** | Low | Low | Significant | Critical | Critical |
| **Minor (2)** | Very Low | Low | Low | Significant | Significant |
| **Insignificant (1)** | Very Low | Very Low | Low | Low | Low |

**สีระดับความเสี่ยง:**
- 🟢 **Very Low** — ปลอดภัย
- 🟡 **Low** — ต่ำ
- 🟠 **Significant** — มีนัยสำคัญ
- 🔴 **Critical** — วิกฤต
- ⚫ **Extreme** — รุนแรงสูงสุด

### 4.3 กลยุทธ์การจัดการความเสี่ยง

| รหัส | กลยุทธ์ | ความหมาย |
|------|---------|----------|
| **A** | Avoid | หลีกเลี่ยงความเสี่ยง (ยกเลิกกิจกรรม/เปลี่ยนแผน) |
| **T** | Transfer | ถ่ายโอนความเสี่ยง (ประกันภัย/สัญญา) |
| **M** | Mitigate | ลดความเสี่ยง (มาตรการควบคุม) |
| **AC** | Accept | ยอมรับความเสี่ยง (เฝ้าระวังตามปกติ) |

### 4.4 ผลกระทบที่อาจเกิด (Possible Effect)

| รหัส | ความหมาย |
|------|----------|
| **C** | Cost — ต้นทุน/งบประมาณ |
| **T** | Time — ระยะเวลา/กำหนดการ |
| **Q** | Quality — คุณภาพงาน |
| **HSE** | Health, Safety & Environment |

---

## 5️⃣ ระบบ AI (Groq AI Suggestion Flow)

```
เปิดฟอร์ม Add/Edit Risk
     │
     ▼
กรอก: Description + Impact + Likelihood + Possible Effect
     │
     ▼
คลิกปุ่ม "🤖 AI Suggest"
     │
     ▼
ระบบส่งข้อมูลไปยัง Groq API (Llama-3.3-70B)
     │
     ▼
AI ประมวลผลและส่งกลับ (JSON format):
  {
    "strategy": "Mitigate",
    "action": "1. ดำเนินการ...\n2. ติดตาม..."
  }
     │
     ▼
ระบบเติม Mitigation Strategy + Action Plan อัตโนมัติ
     │
     ▼
ผู้ใช้ตรวจสอบและแก้ไขได้ตามต้องการ
```

> **ต้องการ:** ตั้งค่า `GROQ_API_KEY` ใน `.env.local`  
> **โมเดล:** `llama-3.3-70b-versatile` (ฟรี)

---

## 6️⃣ การวิเคราะห์และรายงาน (Analytics & Reports)

### 6.1 Risk Matrix Heatmap

- **Initial Risk Matrix** — แสดงความเสี่ยงก่อนมีแผนรับมือ
- **Residual Risk Matrix** — แสดงความเสี่ยงหลังดำเนินแผนแล้ว
- คลิกเซลล์ในตารางเพื่อ **กรอง Risk** ที่อยู่ในระดับนั้น

### 6.2 Industry Benchmark Comparison

```
เลือก Project เฉพาะ (ไม่ใช่ "All Projects")
     │
     ▼
คลิกปุ่ม "Benchmark"
     │
     ▼
แสดง Heatmap 2 แผง:
  • Actual Risk Matrix — ความเสี่ยงจริงของโครงการ
  • Baseline Comparison — เทียบกับมาตรฐานอุตสาหกรรม
```

### 6.3 Risk Summary Report

```
คลิก "📄 Summary"
     │
     ▼
แสดงรายงานสรุปสำหรับโครงการที่เลือก:
  • สถิติตามระดับความเสี่ยง
  • รายการ Open Risks พร้อมรายละเอียด
  • Overdue Risks (เกินกำหนด)
  • พิมพ์/Export ได้
```

---

## 7️⃣ ประวัติการเปลี่ยนแปลง (Risk History / Audit Trail)

```
คลิกไอคอน 📜 (History) ที่แถว Risk
     │
     ▼
ดู Timeline การเปลี่ยนแปลงทั้งหมด:
  • วันที่ / เวลา
  • ผู้แก้ไข (Email)
  • ฟิลด์ที่เปลี่ยนแปลง
  • ค่าเก่า → ค่าใหม่
```

> **ระบบจะบันทึก History อัตโนมัติ** ทุกครั้งที่มีการแก้ไข Risk

---

## 8️⃣ การนำเข้าข้อมูล (CSV Import)

```
คลิก "☁️↑ Import"
     │
     ▼
เลือกไฟล์ CSV
     │
     ▼
ระบบแสดง Preview ข้อมูล
     │
     ▼
ตรวจสอบ Mapping คอลัมน์
     │
     ▼
คลิก "Import" ──▶ บันทึกลงฐานข้อมูล
```

### รูปแบบ CSV ที่รองรับ

```csv
riskId,projectNo,projectName,category,description,owner,impact,likelihood,status
R-001,P001,โครงการ A,Engineering,รายละเอียดความเสี่ยง,John,4,3,Open
```

---

## 9️⃣ การจัดการผู้ใช้ (Admin Panel)

### เข้าถึง: คลิกปุ่ม "🛡️ Admin" (เฉพาะ Admin)

```
Admin Panel
     │
     ├── 👥 Manage Users
     │       • ดูรายชื่อผู้ใช้ทั้งหมด
     │       • แก้ไข Role (Admin/User)
     │       • กำหนดโครงการที่อนุญาต (assignedProjects)
     │       • รีเซ็ตรหัสผ่าน
     │
     ├── ➕ Register New User
     │       • กรอก Email → สร้างบัญชีใหม่
     │       • กำหนด Role เริ่มต้น
     │
     ├── 💾 System Backup
     │       • ดาวน์โหลดข้อมูลทั้งหมดเป็น JSON
     │
     └── 🗑️ Delete User
             • ลบบัญชีผู้ใช้
```

---

## 🔟 บัญชีผู้ใช้ (User Account)

### เข้าถึง: คลิกไอคอน User มุมขวาบน

| ฟังก์ชัน | รายละเอียด |
|---------|-----------|
| ดูข้อมูลบัญชี | Email, Role, โครงการที่ได้รับมอบหมาย |
| เปลี่ยนรหัสผ่าน | ต้องกรอกรหัสเดิมก่อน |
| ออกจากระบบ | Logout และกลับหน้า Login |

---

## 🔑 สรุปสิทธิ์การใช้งาน (Permissions Summary)

| การกระทำ | Admin | User (มีสิทธิ์โครงการ) | User (ไม่มีสิทธิ์) |
|---------|-------|----------------------|-----------------|
| ดู Dashboard | ✅ | ✅ | ✅ |
| สร้างโครงการ | ✅ | ❌ | ❌ |
| เพิ่ม Risk | ✅ | ✅ | ❌ |
| แก้ไข Risk | ✅ | ✅ | ❌ |
| ลบ Risk | ✅ | ✅ | ❌ |
| Import CSV | ✅ | ✅ | ❌ |
| ดู Risk Summary | ✅ | ✅ | ✅ |
| Admin Panel | ✅ | ❌ | ❌ |
| จัดการผู้ใช้ | ✅ | ❌ | ❌ |
| System Backup | ✅ | ❌ | ❌ |

---

## ⚙️ การตั้งค่าระบบ (Setup & Configuration)

### โครงสร้างไฟล์สำคัญ

```
/
├── .env.local              ← API Keys (ห้าม commit!)
│     GROQ_API_KEY=gsk_xxx
├── App.tsx                 ← Main App + Routing
├── types.ts                ← TypeScript Types
├── components/             ← UI Components
│   ├── LoginPage.tsx
│   ├── Navbar.tsx
│   ├── RiskForm.tsx        ← Add/Edit Risk Modal
│   ├── RiskMatrix.tsx      ← 5×5 Heatmap
│   ├── AdminPanel.tsx
│   └── ...
├── hooks/                  ← Custom React Hooks
│   ├── useAuth.ts          ← Authentication Logic
│   ├── useRisks.ts         ← Risk CRUD Operations
│   └── useFilters.ts       ← Filter/Sort Logic
└── services/               ← API/Backend Wrappers
    ├── firebaseService.ts  ← Firestore + Auth
    ├── groqService.ts      ← AI Integration
    ├── riskBaselineService.ts ← Industry Baselines
    └── adminService.ts     ← User Management
```

### คำสั่งสำหรับนักพัฒนา

```bash
# ติดตั้ง dependencies
npm install

# รันโหมดพัฒนา (http://localhost:5173)
npm run dev

# Build สำหรับ Production
npm run build

# Deploy ขึ้น Firebase Hosting
npm run build
npx firebase deploy
```

---

## 🚨 การแก้ไขปัญหาเบื้องต้น (Troubleshooting)

| ปัญหา | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| Login ไม่ได้ | Email/Password ผิด | ตรวจสอบข้อมูล หรือ Reset Password |
| ไม่เห็น Risk | Filter ผิด | ตรวจสอบ Project Filter |
| Permission Denied | Firestore Rules | ติดต่อ Admin ขอสิทธิ์ |
| AI ไม่ทำงาน | Groq API Key ผิด/หมด | ตรวจสอบ `.env.local` |
| ข้อมูลไม่อัปเดต | Cache | Refresh หน้าเว็บ (F5) |
| Import ล้มเหลว | รูปแบบ CSV ผิด | ตรวจสอบ column headers |

---

## 📐 Diagram: Data Flow

```
User Browser
    │
    ├──▶ Firebase Auth (Login/Logout)
    │
    ├──▶ Cloud Firestore
    │        ├── /risks         (Risk data)
    │        ├── /users         (User profiles & roles)
    │        └── /projects      (Project metadata)
    │
    └──▶ Groq API (AI Suggestions)
              └── llama-3.3-70b-versatile
```

---

*เอกสารนี้ครอบคลุมการทำงานของ ProRisk Manager AI v0.2*  
*สร้าง: มีนาคม 2026*
