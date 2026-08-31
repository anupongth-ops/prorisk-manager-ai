# คู่มือการใช้งาน ProRisk Manager E-PO-PM

## 📖 ภาพรวม

**ProRisk Manager E-PO-PM** เป็นระบบบริหารความเสี่ยงสำหรับโครงการ EPC (Engineering, Procurement, Construction) พัฒนาด้วย React และ Firebase พร้อมระบบ AI สำหรับแนะนำกลยุทธ์การจัดการความเสี่ยง

---

## 🔐 การเข้าสู่ระบบ

### การ Login
1. เปิดเว็บแอปพลิเคชัน: [https://www.gcmeapp.com/epopm](https://www.gcmeapp.com/epopm)
2. กรอก **Email** และ **Password**
3. คลิกปุ่ม **"Sign In"** (หรือ **"Sign in with Microsoft"**)

### การเปลี่ยนรหัสผ่าน
- ผู้ใช้ใหม่ที่ใช้รหัสผ่านเริ่มต้น จะถูกบังคับให้เปลี่ยนรหัสผ่านในการ login ครั้งแรก
- สามารถเปลี่ยนรหัสผ่านได้ภายหลังจากหน้า **User Account**

---

## 🏠 หน้าหลัก (Dashboard)

### ส่วนประกอบหลัก

| ส่วน | คำอธิบาย |
|------|----------|
| **Project Filter** | เลือกดูข้อมูลเฉพาะโครงการ หรือ "All Projects" |
| **Risk Matrix** | แผนภูมิ 5x5 แสดงระดับความเสี่ยง (Impact x Likelihood) |
| **Status Overview** | กราฟแท่งแสดงจำนวน Risk ตามสถานะ (Open/In Progress/Closed) |
| **Risk Distribution** | กราฟแท่งแสดงการกระจายตามระดับความเสี่ยง |
| **Risk Table** | ตารางแสดงรายการความเสี่ยงทั้งหมด |

### การค้นหาและจัดเรียง
- ใช้ช่อง **Search** เพื่อค้นหาตาม Risk ID, Description หรือ Owner
- คลิกหัวตาราง **Risk ID** เพื่อเรียงลำดับ (ขึ้น/ลง)

---

## ➕ การสร้างโครงการใหม่

1. คลิกปุ่ม **"New Project"** (ไอคอน 📁+)
2. กรอกข้อมูลโครงการ:
   - **Project Number**: หมายเลขโครงการ (ต้องไม่ซ้ำ)
   - **Project Name**: ชื่อโครงการ
   - **PM Name**: ชื่อ Project Manager
   - **Email**: อีเมล PM
   - **Industry Type**: ประเภทอุตสาหกรรม (Power Plants, Petrochemical, Oil & Gas, Data Center)
3. เลือก **Project Modifiers** (Weighting Factors) ที่เกี่ยวข้อง
4. เลือก **"Generate Baseline Risks"** หากต้องการให้ระบบสร้างความเสี่ยงพื้นฐานอัตโนมัติ (31 รายการ)
5. คลิก **"Create Project"**

---

## 📝 การเพิ่มความเสี่ยง (Risk)

1. คลิกปุ่ม **"Add Risk"** (ไอคอน +)
2. กรอกข้อมูลความเสี่ยง:
   - **Project**: เลือกโครงการ
   - **Risk Category**: หมวดหมู่ความเสี่ยง
   - **Description**: รายละเอียดความเสี่ยง
   - **Owner**: ผู้รับผิดชอบ
   - **Status**: สถานะ (Open, In Progress, Closed)
   - **Impact** (1-5): ระดับผลกระทบ
   - **Likelihood** (1-5): โอกาสเกิด
   - **Possible Effect**: ผลกระทบที่อาจเกิด (C/T/Q/HSE)
   - **Mitigation Strategy**: กลยุทธ์การจัดการ (A/T/M/AC)
   - **Action Plan**: แผนการดำเนินการ
   - **Target Date**: วันที่เป้าหมาย
3. คลิก **"Save Risk"**

### AI Suggest (ถ้าเปิดใช้งาน)
- คลิกปุ่ม **"AI Suggest"** เพื่อให้ระบบแนะนำ Mitigation Strategy และ Action Plan อัตโนมัติ
- ต้องมีการตั้งค่า Groq API Key ใน `.env.local`
- AI ใช้โมเดล **Llama 3.3 70B** จาก Groq (ฟรี)

---

## ✏️ การแก้ไข/ลบความเสี่ยง

### แก้ไข
1. คลิกไอคอน **✏️ (Edit)** ที่แถวของ Risk ที่ต้องการ
2. แก้ไขข้อมูล
3. คลิก **"Save Risk"**

### ลบ
1. คลิกไอคอน **🗑️ (Delete)** ที่แถวของ Risk
2. ยืนยันการลบ

> **หมายเหตุ**: การแก้ไขจะถูกบันทึกเป็น History โดยอัตโนมัติ

---

## 📊 ดูประวัติการเปลี่ยนแปลง

1. คลิกไอคอน **📜 (History)** ที่แถวของ Risk
2. ดู Timeline การเปลี่ยนแปลงทั้งหมด พร้อมรายละเอียด:
   - วันที่/เวลา
   - ผู้แก้ไข
   - ฟิลด์ที่เปลี่ยน
   - ค่าเก่า → ค่าใหม่

---

## 📄 Risk Summary Report

1. คลิกปุ่ม **"Summary"** (ไอคอน 📄)
2. ดูรายงานสรุป:
   - สถิติความเสี่ยงตามระดับ
   - รายการความเสี่ยงที่ยังเปิดอยู่
   - ความเสี่ยงที่เกินกำหนด (Overdue)

---

## 📥 Import ข้อมูลจาก CSV

1. คลิกปุ่ม **"Import"** (ไอคอน ☁️↑)
2. เลือกไฟล์ CSV
3. ตรวจสอบ Preview
4. คลิก **"Import"**

### รูปแบบ CSV ที่รองรับ
```csv
riskId,projectNo,projectName,category,description,owner,impact,likelihood,status
R-001,P001,Project A,Technical,Risk description,John,4,3,Open
```

---

## ⚖️ Industry Benchmark Comparison

1. เลือกโครงการที่ต้องการเปรียบเทียบ (ไม่ใช่ "All Projects")
2. คลิกปุ่ม **"Benchmark"**
3. ดู Heatmap เปรียบเทียบ:
   - **Actual**: ความเสี่ยงจริงของโครงการ
   - **Baseline**: ค่ามาตรฐานอุตสาหกรรม

---

## 👤 User Account

### เข้าถึง
คลิกไอคอน **User** ที่มุมขวาบน

### ฟังก์ชัน
- ดูข้อมูลบัญชี (Email, Role)
- เปลี่ยนรหัสผ่าน
- ออกจากระบบ

---

## 🛡️ Admin Panel (สำหรับ Admin)

### เข้าถึง
1. Login ด้วยบัญชี Admin
2. คลิกปุ่ม **"Admin"** (ไอคอน 🛡️)

### ฟังก์ชัน

| ฟังก์ชัน | คำอธิบาย |
|----------|----------|
| **Manage Users** | ดูรายชื่อผู้ใช้, แก้ไข Role, กำหนดโครงการที่อนุญาต |
| **Register New User** | เพิ่มผู้ใช้ใหม่ด้วย Email |
| **System Backup** | ดาวน์โหลดข้อมูลทั้งหมดเป็น JSON |
| **Delete User** | ลบบัญชีผู้ใช้ |

### User Roles

| Role | สิทธิ์ |
|------|--------|
| **Admin** | เข้าถึงทุกโครงการ, จัดการผู้ใช้ |
| **User** | เข้าถึงเฉพาะโครงการที่ Assign |

---

## 🌙 Dark Mode

- คลิกไอคอน **🌙/☀️** ที่มุมขวาบน เพื่อสลับธีม
- ระบบจะจำการตั้งค่าไว้

---

## ⚠️ การแก้ไขปัญหาเบื้องต้น

| ปัญหา | วิธีแก้ไข |
|-------|----------|
| ไม่สามารถ Login ได้ | ตรวจสอบ Email/Password, ลอง Reset Password |
| ไม่เห็นข้อมูล Risk | ตรวจสอบ Project Filter, รีเฟรชหน้าเว็บ |
| Permission Denied | ติดต่อ Admin เพื่อขอสิทธิ์เข้าถึงโครงการ |
| AI Suggest ไม่ทำงาน | ตรวจสอบว่า Groq API Key ถูกตั้งค่าใน `.env.local` แล้ว |

---

## 📞 Contact Support

หากพบปัญหาหรือต้องการความช่วยเหลือ กรุณาติดต่อ Admin ของระบบ

---

*คู่มือนี้สร้างเมื่อ: กุมภาพันธ์ 2026*
