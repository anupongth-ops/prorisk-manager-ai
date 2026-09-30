---
marp: true
theme: gaia
_class: lead
paginate: true
backgroundColor: #f8fafc
color: #0f172a
size: 16:9
style: |
  section {
    font-family: 'Segoe UI', 'Sarabun', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
    padding: 24px 45px 20px 45px;
    background: #f8fafc;
    font-size: 0.75rem;
    overflow: hidden;
  }
  h1 {
    color: #0f2c59;
    font-size: 1.35rem;
    margin: 0 0 2px 0;
    font-weight: 800;
  }
  h2 {
    color: #475569;
    font-size: 0.88rem;
    margin: 0 0 8px 0;
    font-weight: 500;
  }
  h3, h4 {
    margin: 0 0 4px 0;
    font-size: 0.92rem;
  }
  p, li {
    font-size: 0.73rem;
    line-height: 1.32;
    color: #334155;
    margin: 0;
  }
  ul, ol {
    margin: 2px 0 4px 0;
    padding-left: 16px;
  }
  li {
    margin-bottom: 3px;
  }
  .badge {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .badge-green { background: #dcfce7; color: #15803d; }
  .badge-amber { background: #fef3c7; color: #b45309; }
  .badge-purple { background: #f3e8ff; color: #7e22ce; }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: 4px;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
    margin-top: 4px;
  }
  .grid-4 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 10px;
    margin-top: 4px;
  }
  .card {
    background: #ffffff;
    border-radius: 8px;
    padding: 10px 14px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    border: 1px solid #cbd5e1;
    box-sizing: border-box;
  }
  .card-highlight { border-left: 4px solid #2563eb; }
  .card-green { border-left: 4px solid #16a34a; }
  .card-amber { border-left: 4px solid #d97706; }
  .card-purple { border-left: 4px solid #9333ea; }
  .step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #2563eb;
    color: #ffffff;
    font-weight: 700;
    font-size: 0.7rem;
    margin-right: 4px;
  }
  footer {
    font-size: 0.65rem;
    color: #94a3b8;
    position: absolute;
    bottom: 10px;
    left: 45px;
    right: 45px;
    display: flex;
    justify-content: space-between;
  }
---

<!-- _class: lead -->
<div style="text-align: center; margin-top: 45px;">
  <span class="badge badge-blue" style="font-size: 0.8rem; padding: 0.3rem 0.8rem;">USER QUICK START GUIDE • 2026 EDITION</span>
  <h1 style="font-size: 2.2rem; margin-top: 15px; color: #0f2c59; font-weight: 800;">
    Smart Risk Management
  </h1>
  <p style="font-size: 1.05rem; color: #475569; max-width: 800px; margin: 10px auto 0 auto; line-height: 1.4;">
    คู่มือแนะนำการใช้งานระบบบริหารความเสี่ยงโครงการ EPC อัจฉริยะ<br>
    รวดเร็ว • ใช้งานง่าย • แม่นยำตามมาตรฐาน ISO 31000 & COSO ERM
  </p>
  <div style="margin-top: 25px;">
    <span class="badge badge-green" style="font-size: 0.8rem; padding: 0.35rem 0.9rem;">🌐 URL: www.gcmeapp.com/epopm</span>
    <span class="badge badge-purple" style="font-size: 0.8rem; padding: 0.35rem 0.9rem;">🤖 Gemini 3.7 Flash & Llama 3</span>
  </div>
</div>

---

# 1. ภาพรวมระบบ (System Architecture)
## ศูนย์กลางการบริหารความเสี่ยงโครงการครอบคลุมทั้งวงจร 4 เสาหลัก

<div class="grid-4">
  <div class="card card-highlight">
    <span class="badge badge-blue">MODULE 1</span>
    <h3 style="margin-top: 4px; color: #0f2c59;">📊 Dashboard & Matrix</h3>
    <p>• <strong>5x5 Heatmap:</strong> แสดงความเสี่ยง Initial vs Residual<br>
    • <strong>Dynamic Filter:</strong> กรองเฉพาะโครงการหรือดูทั้งบริษัท<br>
    • <strong>Visual Charts:</strong> กราฟแยกหมวดหมู่และสถานะโครงการ</p>
  </div>

  <div class="card card-green">
    <span class="badge badge-green">MODULE 2</span>
    <h3 style="margin-top: 4px; color: #15803d;">📑 Excel Register Grid</h3>
    <p>• <strong>Inline Editing:</strong> พิมพ์แก้ไขในตารางรวดเร็วเหมือน Excel<br>
    • <strong>Header Guides:</strong> ชี้ดูคำอธิบายตามเกณฑ์ EPM-03-014<br>
    • <strong>Unsaved Shield:</strong> ข้อมูลไม่สูญหายแม้มี Real-time sync</p>
  </div>

  <div class="card card-purple">
    <span class="badge badge-purple">MODULE 3</span>
    <h3 style="margin-top: 4px; color: #7e22ce;">🤖 TOR AI Assessment</h3>
    <p>• <strong>Scan TOR Docs:</strong> อัปโหลด PDF/Word วิเคราะห์ทันที<br>
    • <strong>สกัดค่าปรับ LDs:</strong> ตรวจพบบทลงโทษสัญญา<br>
    • <strong>EMV Buffer:</strong> คำนวณงบสำรองความเสี่ยงก่อนยื่นซอง</p>
  </div>

  <div class="card card-amber">
    <span class="badge badge-amber">MODULE 4</span>
    <h3 style="margin-top: 4px; color: #b45309;">✉️ Alerts & Export</h3>
    <p>• <strong>Overdue Alert:</strong> ส่งอีเมลแจ้งเตือนความเสี่ยงเลยกำหนด<br>
    • <strong>Official Excel:</strong> ออกรายงาน Template EPM-03-014AT1<br>
    • <strong>SQL Backup:</strong> สำรองฐานข้อมูลลง PostgreSQL / MySQL</p>
  </div>
</div>

<div class="card" style="margin-top: 10px; background: #eff6ff; border-color: #bfdbfe; padding: 8px 14px;">
  <p style="margin: 0; color: #1e40af; font-size: 0.72rem;">
    💡 <strong>จุดเด่นสำคัญ:</strong> ปรับปรุงความเร็วโหลดด้วย Code Splitting, รองรับ Microsoft SSO Login, ใช้งานได้ทั้งบน PC, Tablet และ Mobile
  </p>
</div>

---

# 2. การเข้าสู่ระบบและสิทธิ์การใช้งาน (Login & Roles)
## เข้าใช้งานสะดวกรวดเร็วผ่าน Web Browser ปลอดภัยระดับองค์กร

<div class="grid-2">
  <div class="card card-highlight">
    <h3 style="color: #0f2c59;">🔐 ขั้นตอนการเข้าใช้งาน</h3>
    <ul>
      <li><strong>เข้าสู่ระบบ:</strong> ไปที่ <a href="https://www.gcmeapp.com/epopm">www.gcmeapp.com/epopm</a></li>
      <li><strong>ช่องทาง Login:</strong>
        <ul>
          <li><strong>Email & Password:</strong> กรอกอีเมลบริษัทและรหัสผ่าน</li>
          <li><strong>Sign in with Microsoft:</strong> ล็อกอินด้วยบัญชีองค์กร 1-Click</li>
        </ul>
      </li>
      <li><strong>รหัสผ่านเริ่มต้น:</strong> ผู้ใช้ใหม่ใช้ <code>gcme1234567</code> (บังคับเปลี่ยนครั้งแรก)</li>
      <li><strong>Theme:</strong> สลับ Dark Mode / Light Mode ได้อิสระที่มุมขวาบน</li>
      <li><strong>User Account:</strong> ตรวจสอบสิทธิ์และเปลี่ยนรหัสผ่านได้ตลอดเวลา</li>
    </ul>
  </div>

  <div class="card card-amber">
    <h3 style="color: #92400e;">👥 ระดับสิทธิ์ผู้ใช้งาน (Roles & Permissions)</h3>
    <div style="margin-bottom: 6px;">
      <span class="badge badge-purple">Admin (ผู้ดูแลระบบกลาง)</span>
      <p style="margin-top: 2px;">เห็นทุกโครงการ, เพิ่ม/ลบผู้ใช้, กำหนดสิทธิ์ Project Assignment, จัดการ Baseline และดาวน์โหลด Database Backup</p>
    </div>
    <div style="margin-bottom: 6px;">
      <span class="badge badge-blue">Project Manager / User</span>
      <p style="margin-top: 2px;">เข้าถึงและแก้ไขเฉพาะโครงการที่ตนเองได้รับมอบหมาย (Assigned Projects)</p>
    </div>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 6px 10px; margin-top: 4px;">
      <p style="margin: 0; color: #991b1b; font-size: 0.7rem;">
        ⚠️ <strong>หากขึ้น "Permission Denied":</strong> แสดงว่ายังไม่ได้รับ Assign โครงการ ให้แจ้ง Admin เพื่อเพิ่ม Project Number ในสิทธิ์ของผู้ใช้
      </p>
    </div>
  </div>
</div>

---

# 3. เริ่มต้นโครงการใหม่ (Project Setup - Step 1)
## สร้างโครงการพร้อมเชื่อมโยงรหัส ERP และมาตรฐาน ISO 31000

<div class="grid-2">
  <div class="card card-highlight">
    <h3 style="color: #0f2c59;">➕ ขั้นตอนการสร้างโครงการใหม่ (Step 1)</h3>
    <ol>
      <li>คลิกปุ่ม <strong>"New Project" (📁+)</strong> บนแถบ Navbar ด้านบน</li>
      <li><strong>Data Inheritance:</strong> เลือก Clone ความเสี่ยงจากโครงการเดิม หรือเริ่มจาก Blank</li>
      <li>กรอก <strong>Project Number</strong> (เช่น <code>PJ-2025-001</code>) ให้ตรงกับรหัส ERP</li>
      <li>ระบุ <strong>PM Name & Contact Email</strong> สำหรับรับการแจ้งเตือน Overdue Task</li>
      <li>เลือกประเภทอุตสาหกรรม (Power Plant, Petrochemical, Infrastructure)</li>
      <li>กำหนด <strong>Risk Appetite</strong> และ Review Frequency ตาม ISO 31000</li>
      <li>คลิกปุ่ม <strong>"Next →"</strong> สีน้ำเงิน เพื่อเข้าสู่ขั้นตอนถ่วงน้ำหนักใน Step 2</li>
    </ol>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 5px 8px; margin-top: 6px;">
      <p style="margin: 0; color: #166534; font-size: 0.68rem;">
        💡 <strong>Pro-Tip:</strong> ตั้งชื่อ Project No ให้ตรงกับ ERP เพื่อการวิเคราะห์ข้ามระบบอย่างไร้รอยต่อ
      </p>
    </div>
  </div>

  <div class="card" style="padding: 6px; display: flex; flex-direction: column;">
    <div style="background: #0f172a; color: #94a3b8; width: 100%; padding: 4px 8px; border-radius: 4px 4px 0 0; font-size: 0.65rem; font-weight: 600; display: flex; align-items: center; box-sizing: border-box;">
      <span style="color: #ef4444; margin-right: 4px;">●</span><span style="color: #f59e0b; margin-right: 4px;">●</span><span style="color: #10b981; margin-right: 8px;">●</span>
      📁 New Project Setup • Step 1: Basic Information
    </div>
    <img src="scratch/app_screenshots/screen_project_form.png" style="width: 100%; height: 225px; object-fit: cover; object-position: top center; border-radius: 0 0 4px 4px; border: 1px solid #cbd5e1; border-top: none;" alt="New Project Setup Modal" />
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 5px 8px; margin-top: 6px; box-sizing: border-box;">
      <p style="margin: 0; font-size: 0.66rem; color: #334155; line-height: 1.25;">
        📋 <strong>ข้อมูลโครงการ:</strong> ระบุ Project No, Industry Type, ISO 31000 Thresholds แล้วกด Next เข้าสู่ Step 2
      </p>
    </div>
  </div>
</div>

---

# 4. บริบทโครงการ & การถ่วงน้ำหนัก (Weighting Factors - Step 2)
## ปรับจูนคะแนนความเสี่ยงให้ตรงกับสภาพจริงของโครงการด้วยโมเดล 7 หมวดหมู่

<div class="grid-2">
  <div class="card card-purple">
    <h3 style="color: #6b21a8;">⚙️ เกณฑ์การเลือก Weighting Factors (7 หมวดหมู่)</h3>
    <ol style="font-size: 0.72rem; line-height: 1.35; margin: 0; padding-left: 18px;">
      <li><strong>Project Nature:</strong> ติ๊ก <em>Brownfield / Live Plant</em> หากทำในโรงงานเดิม (+2 Both), หรือ <em>Fast-track</em> (+2 Impact)</li>
      <li><strong>Technology & Criticality:</strong> หากใช้ <em>Proven Tech</em> จะได้แต้มลด (-1 Likelihood), หากเป็น <em>New Tech</em> (+2 Impact)</li>
      <li><strong>Commercial Pressure:</strong> ติ๊ก <em>Fixed Price / Lump Sum</em>, <em>Tight Milestone / COD</em> (+2 Impact), หรือสัญญาที่มี <em>LD Penalty</em></li>
      <li><strong>Location & Environment:</strong> ไซต์งานห่างไกล <em>Remote / Offshore</em> หรือสภาพอากาศสุดขั้ว <em>Extreme Climate</em></li>
      <li><strong>Supply Chain:</strong> มีเครื่องจักรนำเข้านาน <em>Long Lead Equipment</em> (+Both) หรือใช้วัสดุผูกขาด <em>Single Source</em></li>
      <li><strong>Workforce & Site:</strong> ขาดแคลนช่างเฉพาะทาง <em>Skilled Labor Shortage</em> หรือหน้างานแออัด <em>Congested Site</em></li>
      <li><strong>Commissioning:</strong> ลำดับสตาร์ตรันระบบซับซ้อน <em>Complex Start-up</em> หรือพึ่งพา <em>Critical Utility</em></li>
    </ol>
    <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 6px; padding: 5px 8px; margin-top: 6px;">
      <p style="margin: 0; color: #6b21a8; font-size: 0.68rem; line-height: 1.25;">
        🎯 <strong>หลักการคำนวณ:</strong> นำคะแนนฐาน + Modifiers ที่เลือก (Clamped 1-5) เพื่อสร้าง 31 Baseline Risks ที่สะท้อนความจริง
      </p>
    </div>
  </div>

  <div class="card" style="padding: 6px; display: flex; flex-direction: column;">
    <div style="background: #0f172a; color: #94a3b8; width: 100%; padding: 4px 8px; border-radius: 4px 4px 0 0; font-size: 0.65rem; font-weight: 600; display: flex; align-items: center; box-sizing: border-box;">
      <span style="color: #ef4444; margin-right: 4px;">●</span><span style="color: #f59e0b; margin-right: 4px;">●</span><span style="color: #10b981; margin-right: 8px;">●</span>
      ⚙️ Project Context • Step 2: Selection of Weighting Factors
    </div>
    <img src="scratch/app_screenshots/screen_weighting_factors.png" style="width: 100%; height: 225px; object-fit: cover; object-position: top center; border-radius: 0 0 4px 4px; border: 1px solid #cbd5e1; border-top: none;" alt="Weighting Factors Modal" />
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 5px 8px; margin-top: 6px; box-sizing: border-box;">
      <p style="margin: 0; font-size: 0.66rem; color: #334155; line-height: 1.25;">
        ⚡ <strong>Industry Modifiers:</strong> ค่า Impact/Likelihood ถูกปรับแต่งตามประเภทโรงงาน คลิก <strong>"Initialize Baseline Risks"</strong> ทันที
      </p>
    </div>
  </div>
</div>

---

# 5. การจัดการรายการความเสี่ยง (Risk Management)
## บันทึกและประเมินระดับความเสี่ยงตามมาตรฐาน 5x5 Heatmap Matrix

<div class="grid-3">
  <div class="card card-highlight">
    <h4 style="color: #0f2c59;"><span class="step-num">1</span> บันทึกความเสี่ยง (Identification)</h4>
    <ul>
      <li><strong>Category:</strong> เลือกหมวดหมู่งาน (Eng, Procure, Const, SHE)</li>
      <li><strong>Description (ISO 31000):</strong><br>
        <em>"เนื่องจาก [สาเหตุ] จึงเสี่ยงต่อ [เหตุการณ์] ส่งผลให้ [ผลกระทบ]"</em></li>
      <li><strong>Possible Effect:</strong> Cost (C), Time (T), Quality (Q), HSE, Reputation (R)</li>
    </ul>
  </div>

  <div class="card card-amber">
    <h4 style="color: #92400e;"><span class="step-num" style="background:#d97706;">2</span> ประเมินคะแนน 5x5 Matrix</h4>
    <ul>
      <li><strong>Impact (1-5):</strong> Insignificant &rarr; Severe</li>
      <li><strong>Likelihood (1-5):</strong> Rarely &rarr; Most Likely</li>
      <li><strong>Initial Score:</strong> คะแนนก่อนมีมาตรการ (1-25)</li>
      <li><strong>Residual Score:</strong> คะแนนคงเหลือหลังมีมาตรการ</li>
      <li><strong>ระดับความเสี่ยง:</strong> Low (เขียว), Medium (เหลือง), High (ส้ม), Very High (แดง)</li>
    </ul>
  </div>

  <div class="card card-green">
    <h4 style="color: #15803d;"><span class="step-num" style="background:#16a34a;">3</span> มาตรการควบคุม (Treatment)</h4>
    <ul>
      <li><strong>กลยุทธ์ 4 รูปแบบ:</strong>
        <br><strong>A</strong> = Avoid (หลีกเลี่ยง/ขจัด)
        <br><strong>T</strong> = Transfer (ถ่ายโอน/ประกัน)
        <br><strong>M</strong> = Mitigate (บรรเทาผลกระทบ)
        <br><strong>AC</strong> = Accept (ยอมรับความเสี่ยงต่ำ)</li>
      <li><strong>Action Plan:</strong> แผนงานที่ชัดเจน</li>
      <li><strong>Owner & Date:</strong> ผู้รับผิดชอบและวันแล้วเสร็จ</li>
    </ul>
  </div>
</div>

---

# 6. ตัวช่วยอัจฉริยะ AI Suggest (Risk Copilot)
## แนะนำกลยุทธ์การรับมือความเสี่ยงและแผนดำเนินการใน 3 วินาที

<div class="grid-2">
  <div class="card card-purple">
    <h3 style="color: #6b21a8;">✨ วิธีใช้งานปุ่ม "AI Suggest"</h3>
    <ol>
      <li>ขณะกรอก Risk Form ให้ระบุ Description และคะแนนเบื้องต้น</li>
      <li>คลิกปุ่ม <strong>"AI Suggest" (✨)</strong> สีม่วงด้านขวาของฟอร์ม</li>
      <li>AI ประมวลผลจากคลังความเชี่ยวชาญด้าน EPC Project Management</li>
      <li>ระบบสรุป <strong>กลยุทธ์ที่เหมาะสมที่สุด</strong> (A/T/M/AC) พร้อม <strong>Action to Control</strong> ภาษาไทยอย่างเป็นรูปธรรม</li>
      <li>ระบุทั้งสิ่งที่ต้องทำ, ผู้รับผิดชอบ และเกณฑ์วัดความสำเร็จ</li>
      <li>คลิกนำข้อความมาปรับใช้ในฟอร์มได้ทันที</li>
    </ol>
  </div>

  <div class="card card-highlight">
    <h3 style="color: #0f2c59;">⚙️ ขุมพลังและการรักษาความปลอดภัย</h3>
    <ul>
      <li><strong>Dual-Engine AI:</strong> ขับเคลื่อนด้วย Google Gemini 3.7 Flash และ Groq Llama 3.3 70B ตอบกลับรวดเร็วทันใจ</li>
      <li><strong>Data Privacy:</strong> ข้อมูลโครงการไม่ถูกนำไปเทรนโมเดลภายนอก</li>
      <li><strong>Custom API Key:</strong> สามารถระบุ Gemini API Key ส่วนตัวได้ในหน้า AI Setting เพื่อความคล่องตัวสูงสุด</li>
      <li><strong>ISO 31000 Alignment:</strong> แผนงานที่ AI แนะนำสอดคล้องกับกรอบบริหารความเสี่ยงระดับสากล</li>
    </ul>
  </div>
</div>

---

# 7. โหมดแก้ไขตารางด่วน Excel Grid View
## จัดการความเสี่ยงหลายสิบรายการพร้อมกันอย่างรวดเร็วเหมือนโปรแกรม Excel

<div class="grid-3">
  <div class="card card-green">
    <h4 style="color: #15803d;">⚡ Inline Grid Editing</h4>
    <ul>
      <li>สลับเข้าโหมด <strong>"Excel Grid"</strong> ได้ทันทีจาก Navbar</li>
      <li>คลิกแก้ไข Description, Owner, หรือเปลี่ยนสถานะ Open / Closed ได้ทันทีในตาราง</li>
      <li>ปรับคะแนน Impact / Likelihood ในเซลล์ได้เลย โดยไม่ต้องเปิด Modal ทีละรายการ</li>
      <li>ค้นหา (Search) และคลิกหัวคอลัมน์เพื่อ Sort ลำดับข้อมูล</li>
    </ul>
  </div>

  <div class="card card-highlight">
    <h4 style="color: #0f2c59;">💡 Hover Header Guides</h4>
    <ul>
      <li>ชี้เมาส์ที่หัวคอลัมน์ใดๆ จะปรากฏ Tooltip อธิบายข้อกำหนดตามคู่มือ <strong>EPM-03-014 Rev F3</strong></li>
      <li>แนะนำโครงสร้างข้อความ ISO 31000 และเกณฑ์คะแนนผลกระทบ Cost & Time</li>
      <li>ช่วยให้วิศวกรใหม่บันทึกข้อมูลได้อย่างถูกต้องทันที</li>
    </ul>
  </div>

  <div class="card card-amber">
    <h4 style="color: #92400e;">🛡️ Safe Batch & Unsaved Shield</h4>
    <ul>
      <li><strong>Duplicate Row (📋):</strong> โคลนแถวที่คล้ายกันเพื่อปรับแก้ต่อ</li>
      <li><strong>Add Row (+):</strong> เพิ่มแถวใหม่อย่างต่อเนื่อง</li>
      <li><strong>Batch Save:</strong> ไฮไลต์แถวที่แก้ไข (Dirty Rows) และบันทึกลงฐานข้อมูลทีเดียว</li>
      <li><strong>Unsaved Shield:</strong> แถวที่กำลังพิมพ์อยู่จะไม่ถูกเขียนทับจาก Real-time sync เด็ดขาด</li>
    </ul>
  </div>
</div>

---

# 8. โมดูลวิเคราะห์ TOR & Proposal Risk Assessment
## ป้องกันความเสี่ยงขาดทุนตั้งแต่ขั้นตอนจัดทำข้อเสนอประกวดราคา

<div class="grid-2">
  <div class="card card-purple">
    <h3 style="color: #6b21a8;">📑 การวิเคราะห์เอกสาร TOR</h3>
    <ul>
      <li>แนบไฟล์ TOR ได้ทั้ง PDF และ Word (.docx) ระบบดึงข้อความอัตโนมัติ</li>
      <li>AI สกัดเงื่อนไขสัญญาสำคัญ (Constraints) และ <strong>บทปรับส่งมอบงานล่าช้า (Liquidated Damages: LDs เช่น 0.1%/วัน)</strong></li>
      <li>จำแนกความเสี่ยงอัตโนมัติ 8 มิติ: Strategic, Operational, Financial, Compliance, Technology, Resource, Reputational, Schedule</li>
      <li>ประเมินมูลค่าความเสียหายคาดการณ์ (Estimated Impact Cost)</li>
    </ul>
  </div>

  <div class="card card-highlight">
    <h3 style="color: #0f2c59;">🏛️ ประโยชน์สำหรับคณะกรรมการเสนอราคา</h3>
    <ul>
      <li><strong>คำนวณงบสำรองความเสี่ยง EMV:</strong>
        <br><code>EMV = Probability (%) × Estimated Impact Cost (THB)</code>
        <br>รวมเป็น <strong>Contingency Buffer</strong> ที่ต้องบวกเพิ่มในราคาขาย</li>
      <li><strong>แนะนำ Qualification Clause:</strong> ข้อสงวนสิทธิ์ยื่นแนบในซองราคา เช่น ขอขยายเวลากรณีส่งมอบพื้นที่ล่าช้า</li>
      <li><strong>1-Click PDF Report:</strong> พิมพ์รายงานสรุปพร้อมพื้นที่เซ็นชื่อ Preparer / Reviewer / Approver เข้าที่ประชุมบอร์ดได้ทันที</li>
    </ul>
  </div>
</div>

---

# 9. การติดตามสถานะและการแจ้งเตือน (Monitoring & Alerts)
## ติดตามรอบทบทวนความเสี่ยง และแจ้งเตือนรายการที่เกินกำหนด (Overdue)

<div class="grid-3">
  <div class="card card-amber">
    <h4 style="color: #92400e;">⏰ Next Review & Overdue</h4>
    <ul>
      <li>ตามเกณฑ์ ISO 31000 Cl.6.6 ระบบคำนวณวันนัดทบทวนถัดไปให้อัตโนมัติ (Monthly 30 วัน, Quarterly 90 วัน)</li>
      <li>รายการที่เลยกำหนดจะแสดงสถานะ <strong>Overdue (สีแดง)</strong> บน Dashboard ทันที</li>
      <li>มีกราฟ Overdue Risk Chart แสดงสัดส่วนความเสี่ยงเกินกำหนด</li>
    </ul>
  </div>

  <div class="card card-highlight">
    <h4 style="color: #0f2c59;">📧 Email Alert Notification</h4>
    <ul>
      <li>สรุปรายการความเสี่ยงเกินกำหนดแยกรายโครงการและราย PM</li>
      <li><strong>1-Click Dispatch:</strong> เปิดโปรแกรม Outlook/Mail พร้อมสร้างเนื้อหาอีเมลให้อัตโนมัติ</li>
      <li><strong>Copy Template:</strong> คัดลอกข้อความสรุปส่งต่อใน Teams หรือ Line ได้ในคลิกเดียว</li>
    </ul>
  </div>

  <div class="card card-green">
    <h4 style="color: #15803d;">📊 Official Export & Backup</h4>
    <ul>
      <li><strong>Export Excel ทางการ:</strong> ส่งออกลงใน Template <strong>EPM-03-014AT1</strong> พร้อมสี Matrix</li>
      <li><strong>Client Fallback:</strong> ดาวน์โหลดได้ตลอดเวลาแม้ Server ออฟไลน์</li>
      <li><strong>1-Click SQL Dump:</strong> สำรองฐานข้อมูลลง PostgreSQL / MySQL ได้ทันที</li>
    </ul>
  </div>
</div>

---

# 10. สรุป Checklist ประจำสัปดาห์สำหรับ PM (Weekly Routine)
## ขั้นตอนง่ายๆ ใน 5 นาที เพื่อให้ข้อมูลความเสี่ยงของโครงการอัปเดตอยู่เสมอ

<div class="grid-2">
  <div class="card card-highlight">
    <h3 style="color: #0f2c59;">📋 Weekly 4-Step Routine สำหรับ PM</h3>
    <div style="margin-bottom: 6px;">
      <span class="step-num">1</span> <strong>ตรวจสอบ Dashboard:</strong> กรองเฉพาะโครงการของตนเอง เช็คความเสี่ยง High / Very High
    </div>
    <div style="margin-bottom: 6px;">
      <span class="step-num">2</span> <strong>เคลียร์รายการ Overdue:</strong> ตรวจสอบรายการที่เลยกำหนด ขยายเวลาหรืออัปเดตงาน
    </div>
    <div style="margin-bottom: 6px;">
      <span class="step-num">3</span> <strong>อัปเดตใน Excel Grid:</strong> บันทึกความคืบหน้า Action to Control และบันทึกทีเดียว
    </div>
    <div style="margin-bottom: 6px;">
      <span class="step-num">4</span> <strong>ปิดความเสี่ยงที่สำเร็จ:</strong> เปลี่ยน Status เป็น 'Closed' เพื่อลดความเสี่ยงคงเหลือ
    </div>
  </div>

  <div class="card card-green">
    <h3 style="color: #15803d;">📞 ช่องทางสนับสนุนและติดต่อช่วยเหลือ</h3>
    <ul>
      <li><strong>เว็บแอปพลิเคชัน:</strong> <a href="https://www.gcmeapp.com/epopm">www.gcmeapp.com/epopm</a></li>
      <li><strong>คู่มือออนไลน์:</strong> กดปุ่ม "Risk Guide / คู่มือ" บน Navbar เพื่ออ่านคู่มือแบบละเอียด</li>
      <li><strong>ขอสิทธิ์เข้าถึงโครงการ:</strong> ติดต่อ Admin ทีมงาน E-PO-PM</li>
      <li><strong>สรุปหัวใจสำคัญ:</strong> <em>"การบันทึกสม่ำเสมอ คือเกราะป้องกันต้นทุนบานปลาย และทำให้โครงการส่งมอบสำเร็จตามเป้าหมาย"</em></li>
    </ul>
  </div>
</div>
