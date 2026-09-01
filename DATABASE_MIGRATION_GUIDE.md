# 🗄️ Relational Database Migration & SQL Backup Guide
## คู่มือการสำรองข้อมูล (Backup) และแปลงฐานข้อมูล Firebase เป็น SQL

คู่มือนี้สำหรับผู้ดูแลระบบ (Admin) และนักพัฒนา (Developer) ในการสำรองข้อมูลจาก Firebase Firestore ออกมาเป็นไฟล์คำสั่ง SQL (PostgreSQL, MySQL, SQL Server) ที่พร้อม Import เข้าฐานข้อมูล Relational ได้ทันที

---

## 🌟 วิธีที่ 1: ดาวน์โหลดผ่านหน้าเว็บ 1-Click (ง่ายและสะดวกที่สุด - แนะนำ)

หากคุณเข้าสู่ระบบในฐานะ **Admin** (`anupong.th@gmail.com`):

1. เปิดแอปพลิเคชันที่หน้าหลัก: [https://www.gcmeapp.com/epopm](https://www.gcmeapp.com/epopm) (หรือรัน `npm run dev`)
2. คลิกปุ่ม **"Admin"** (ไอคอนโล่ 🛡️) บนแถบ Navbar ด้านบน
3. เลือกแท็บ **"System Backup"** (ไอคอนฐานข้อมูล 🗄️)
4. เลือกระบบฐานข้อมูลที่ต้องการดาวน์โหลด:
   - 🐘 **Export PostgreSQL**: สำหรับ PostgreSQL 13+, Supabase, AWS RDS PostgreSQL / Aurora
   - 🐬 **Export MySQL**: สำหรับ MySQL 8.0+, MariaDB, AWS RDS MySQL
   - 📦 **Export JSON**: สำหรับไฟล์ JSON Snapshot ดั้งเดิม
5. เบราว์เซอร์จะดาวน์โหลดไฟล์ `.sql` พร้อมโครงสร้างตาราง (DDL), ข้อมูลตารางทั้งหมด (INSERT), ความสัมพันธ์ (Relations/JSONB), และคำสั่ง Transaction (`BEGIN...COMMIT;`) ให้อัตโนมัติทันที

---

## 🛠️ วิธีที่ 2: รันผ่าน Node.js CLI Script

หากต้องการดึงข้อมูลผ่าน Command Line หรือ CI/CD:

### ขั้นตอนที่ 1: ดาวน์โหลด Service Account Private Key จาก Firebase
1. เข้าไปที่ [Firebase Console](https://console.firebase.google.com/project/epc-project-management-5e14a/settings/serviceaccounts/adminsdk)
2. เลือกแท็บ **Node.js** แล้วคลิกปุ่ม **Generate new private key**
3. บันทึกไฟล์ไว้ที่โฟลเดอร์หลักของโปรเจกต์นี้ และตั้งชื่อเป็น:
   `firebase-service-account.json`

### ขั้นตอนที่ 2: รันคำสั่งดึงข้อมูลเป็น SQL
เปิด PowerShell/Terminal ในโฟลเดอร์โปรเจกต์:

```bash
node database_migration_tool.js
```

**ผลลัพธ์:** ระบบจะสร้างไฟล์ `migration_data.sql` ให้ทันที

---

## 🚀 ขั้นตอนการนำเข้าไฟล์ SQL สู่ Database ปลายทาง

### สำหรับ PostgreSQL / Supabase:
```bash
psql -U postgres -d prorisk_db -f ProRisk_Database_POSTGRESQL_Backup.sql
```

### สำหรับ MySQL / MariaDB:
```bash
mysql -u root -p prorisk_db < ProRisk_Database_MYSQL_Backup.sql
```

---

## 📋 ตารางและข้อมูลที่ถูกสำรอง (Tables & Collections)

1. `users` - รายชื่อผู้ใช้ สิทธิ์การเข้าถึง (Admin, PM, User) และโครงการที่รับผิดชอบ
2. `baseline_risks` - ข้อมูลความเสี่ยงมาตรฐานอุตสาหกรรม (Discipline, Base Impact/Likelihood)
3. `risks` - ทะเบียนความเสี่ยงโครงการทั้งหมด (Inherent Risk, Treatment Action, Residual Risk, Owner, Deadlines)
4. `risk_history` - บันทึกประวัติการแก้ไขและ Snapshot ความเสี่ยงแต่ละเวอร์ชัน
5. `tor_projects` - โครงการวิเคราะห์ความเสี่ยงเอกสารประกวดราคา (TOR & Proposal Risk Assessments, EMV Reserves)
