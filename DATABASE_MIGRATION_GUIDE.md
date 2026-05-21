# 🗄️ Relational Database Migration Guide
## คู่มือการทำฐานข้อมูล Relational (SQL) และย้ายข้อมูลจาก Firebase

คู่มือนี้ทำขึ้นสำหรับ Developer เพื่อใช้นำเข้าข้อมูลจาก Firebase Firestore เดิม เข้ามาสู่ระบบฐานข้อมูลแบบ Relational SQL (เช่น PostgreSQL หรือ MySQL) เพื่อการพัฒนาต่อยอดระบบ

---

## 🛠️ โครงสร้างเครื่องมือทำคู่มือ (Migration Tool)

ในโปรเจกต์นี้มีระบบอัตโนมัติเตรียมไว้เรียบร้อยแล้ว:
1. **`database_migration_tool.js`**: ตัวดึงข้อมูล (Extractor) จาก Firebase ออกมาเป็นไฟล์คำสั่ง SQL INSERT
2. **`firebase_to_sql_migration.md`**: โครงสร้างตาราง (DDL Database Schema) สำหรับ PostgreSQL และ MySQL

---

## 🚀 ขั้นตอนดำเนินการสำหรับ Developer

### ขั้นตอนที่ 1: ติดตั้ง Database Schema บน SQL Server
เปิดฐานข้อมูล SQL Server ของคุณ (เช่น PostgreSQL/MySQL) แล้วรันคำสั่ง DDL ที่มีเตรียมไว้ให้แล้วในไฟล์:
🔗 **[firebase_to_sql_migration.md](file:///C:/Users/PLA-PC09/.gemini/antigravity/brain/76e42f6e-a0b7-4a34-8be3-e7f714b10593/firebase_to_sql_migration.md)**

---

### ขั้นตอนที่ 2: ดาวน์โหลด Service Account Private Key จาก Firebase
เนื่องจากระบบ Firestore มี Security Rules ป้องกันไม่ให้ใครก็ตามเข้ามาอ่านข้อมูลโดยไม่ได้รับอนุญาต จึงจำเป็นต้องใช้สิทธิ์ Admin ในการดึงข้อมูลออกมา:
1. เข้าไปที่ [Firebase Console](https://console.firebase.google.com/)
2. เลือกโปรเจกต์ของคุณ (`risk-e-po-pm`)
3. ไปที่ **Project Settings** (ไอคอนฟันเฟือง) -> **Service Accounts**
4. กดเลือกแท็บ **Node.js** แล้วคลิกปุ่ม **Generate new private key** (สร้างคีย์ส่วนตัวใหม่)
5. ดาวน์โหลดไฟล์ Private Key นำมาบันทึกไว้ในโฟลเดอร์หลักของโปรเจกต์นี้ และเปลี่ยนชื่อไฟล์เป็น:
   `firebase-service-account.json`

---

### ขั้นตอนที่ 3: รันคำสั่งดึงข้อมูลเป็น SQL
เปิด Terminal/PowerShell ในโฟลเดอร์โปรเจกต์นี้ แล้วพิมพ์คำสั่ง:

```bash
node database_migration_tool.js
```

**ผลลัพธ์ที่ได้:**
ระบบจะดึงข้อมูลทั้งหมดจากคอลเลกชัน `users`, `risks`, และ `baseline_risks` จาก Firebase แปลงรูปแบบข้อมูลความสัมพันธ์ให้อัตโนมัติ และเซฟเป็นไฟล์ใหม่ชื่อ:
💾 **`migration_data.sql`**

---

### ขั้นตอนที่ 4: นำเข้าไฟล์ SQL สู่ Database ปลายทาง
หลังจากได้ไฟล์ `migration_data.sql` ให้รันไฟล์ดังกล่าวในระบบฐานข้อมูลของคุณ:

**สำหรับ PostgreSQL:**
```bash
psql -U username -d database_name -f migration_data.sql
```

**สำหรับ MySQL:**
```bash
mysql -u username -p database_name < migration_data.sql
```

ข้อมูลผู้ใช้, ความเสี่ยง และรายการประวัติการแก้ไขทั้งหมดจะย้ายเข้ามาอยู่ในตารางระบบ SQL พร้อมใช้งานทันที!
