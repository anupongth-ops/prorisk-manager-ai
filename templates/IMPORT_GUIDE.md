# Risk Import Template Guide
## คู่มือการนำเข้าข้อมูลความเสี่ยง

---

## 📥 ดาวน์โหลด Template

ใช้ไฟล์ [risk_import_template.csv](./risk_import_template.csv) เป็นตัวอย่าง

---

## 📋 โครงสร้างข้อมูล (20 คอลัมน์)

| # | คอลัมน์ | ประเภท | บังคับ | ค่าที่ยอมรับ | ตัวอย่าง |
|---|---------|--------|--------|-------------|---------|
| 1 | **Project No** | Text | ✅ | รหัสโครงการ | `P001` |
| 2 | **Project Name** | Text | | ชื่อโครงการ | `Power Plant Phase 1` |
| 3 | **PM Name** | Text | | ชื่อ Project Manager | `John Doe` |
| 4 | **Email** | Email | | อีเมล PM | `john@example.com` |
| 5 | **Risk ID** | Text | ✅ | รหัสความเสี่ยง (ไม่ซ้ำในโครงการ) | `R-001` |
| 6 | **Risk Category** | Text | | หมวดหมู่ (ดูรายการด้านล่าง) | `Construction` |
| 7 | **Description** | Text | ✅ | รายละเอียดความเสี่ยง | `Delay in foundation...` |
| 8 | **Initial Impact (1-5)** | Number | | 1-5 | `4` |
| 9 | **Initial Likelihood (1-5)** | Number | | 1-5 | `3` |
| 10 | **Possible Effect** | Text | | `C`, `T`, `Q`, `HSE` | `T` |
| 11 | **Strategy** | Text | | `A`, `T`, `M`, `AC` | `M` |
| 12 | **Action Plan** | Text | | แผนดำเนินการ | `Conduct survey...` |
| 13 | **Residual Impact (1-5)** | Number | | 1-5 | `2` |
| 14 | **Residual Likelihood (1-5)** | Number | | 1-5 | `2` |
| 15 | **Owner** | Text | | ผู้รับผิดชอบ | `John Doe` |
| 16 | **Raised Date** | Date | | DD-MMM-YYYY | `15-Jan-2026` |
| 17 | **Deadline Date** | Date | | DD-MMM-YYYY | `28-Feb-2026` |
| 18 | **Finished Date** | Date | | DD-MMM-YYYY (ถ้า Closed) | `10-Mar-2026` |
| 19 | **Status** | Text | | `Open`, `In Progress`, `Closed` | `Open` |
| 20 | **Comment** | Text | | หมายเหตุเพิ่มเติม | `Pending review...` |

---

## 📚 ค่าที่ยอมรับ (Reference Values)

### Risk Category
```
Construction, Corporate, Engineering, Government/Community,
Operations/Commissioning, Procurement/Contract, Project Management,
Quality, Regulatory (Compliance), SHE, Strategic/Finance, Technology/Systems
```

### Impact Level (1-5)
| ค่า | ความหมาย |
|-----|---------|
| 1 | Insignificant |
| 2 | Minor |
| 3 | Moderate |
| 4 | Major |
| 5 | Severe |

### Likelihood Level (1-5)
| ค่า | ความหมาย |
|-----|---------|
| 1 | Rarely |
| 2 | Unlikely |
| 3 | Occasional |
| 4 | Likely |
| 5 | Most Likely |

### Possible Effect
| ค่า | ความหมาย |
|-----|---------|
| C | Cost (ต้นทุน) |
| T | Time (เวลา) |
| Q | Quality (คุณภาพ) |
| HSE | Health, Safety & Environment |

### Mitigation Strategy
| ค่า | ความหมาย |
|-----|---------|
| A | Avoid (หลีกเลี่ยง) |
| T | Transfer (ถ่ายโอน) |
| M | Mitigate (บรรเทา) |
| AC | Accept (ยอมรับ) |

### Status
| ค่า | ความหมาย |
|-----|---------|
| Open | ยังไม่ดำเนินการ |
| In Progress | กำลังดำเนินการ |
| Closed | ปิดแล้ว |

---

## ⚠️ กฎการ Import

1. **ฟิลด์บังคับ**: `Project No`, `Risk ID`, `Description`
2. **ตรวจสอบซ้ำ**: ถ้า Risk ID ซ้ำใน Project เดียวกัน → **ข้ามแถวนั้น** (ไม่ overwrite)
3. **รูปแบบวันที่**: `DD-MMM-YYYY` เช่น `15-Jan-2026`
4. **Encoding**: ใช้ UTF-8 สำหรับภาษาไทย

---

## 🚀 วิธีการ Import

1. เปิด App → คลิก **Import** (ไอคอน ☁️↑)
2. คลิก **Download Blank Form** เพื่อดาวน์โหลด template
3. กรอกข้อมูลใน Excel/Google Sheets → Export เป็น CSV
4. อัพโหลดไฟล์ → คลิก **Start Import**
5. ตรวจสอบ Log สรุปผล

---

*สร้างเมื่อ: กุมภาพันธ์ 2026*
