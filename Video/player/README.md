# Smart Risk Management - Interactive Video Training Player

เครื่องมือเล่นวิดีโอจำลองการอบรมเชิงโต้ตอบ (Interactive Video Slideshow Player) สำหรับระบบ **Smart Risk Management** 

---

## 🚀 วิธีการเปิดใช้งาน (How to Run)

1. **เปิดด้วย Web Browser:**
   - ดับเบิลคลิกที่ไฟล์ [`index.html`](file:///D:/Apps/epopm/prorisk-manager-ai/Video/player/index.html) ใน Google Chrome, Microsoft Edge หรือ Brave
   - หรือเปิดผ่าน PowerShell:
     ```powershell
     Start-Process "D:\Apps\epopm\prorisk-manager-ai\Video\player\index.html"
     ```

2. **เนื้อหาครบถ้วนทั้ง 9 ตอน (Complete Series EP 01 - 09):**
   - **PART 1: Foundation & Setup**
     - **EP 01:** ทำความรู้จัก Smart Risk Management & 4 เสาหลัก (Slide 1–2)
     - **EP 02:** การเข้าใช้งานและระบบความปลอดภัย (Slide 3 & Login)
     - **EP 03:** การเริ่มต้นโครงการใหม่และการถ่วงน้ำหนัก (Slide 4–5 & Weighting)
   - **PART 2: Risk Assessment & Productivity**
     - **EP 04:** การประเมินความเสี่ยงและเมทริกซ์ 5x5 Heatmap Matrix (Slide 6 & Dashboard)
     - **EP 05:** ตัวช่วย AI อัจฉริยะในการวางมาตรการควบคุม (AI Risk Copilot) (Slide 7 & Risk Form)
     - **EP 06:** โหมดตารางด่วน Excel Grid View (Productivity Mode) (Slide 8 & Excel View)
   - **PART 3: Advanced Intelligence, Monitoring & Best Practices**
     - **EP 07:** โมดูลวิเคราะห์ TOR และคำนวณงบสำรอง EMV (Pre-Bid & Proposal) (Slide 9 & TOR Scanner)
     - **EP 08:** การติดตามรอบทบทวนและการส่งออกรายงานทางการ (Monitoring & Exports) (Slide 10 & Export Form EPM-03-014AT1)
     - **EP 09:** กิจวัตร 5 นาทีประจำสัปดาห์และช่องทางสนับสนุน (Weekly Routine & Support) (Slide 11 & Online Guide)

3. **ฟังก์ชันเด่นในตัวเล่น (Player Features):**
   - **ระบบป้องกันเสียงบรรยายถูกตัดและกระชับจังหวะ (Smart Audio & Transition Engine):**
     - คำนวณระยะเวลาแต่ละฉากตามจำนวนตัวอักษรภาษาไทยจริง (`calibrateDurations`)
     - ล็อกการเปลี่ยนฉากด้วย Event-Driven Guard (`speechDone`) มั่นใจได้ 100% ว่าเสียงพากย์จะอ่านจบประโยคครบถ้วนสมบูรณ์ก่อนที่จะเปลี่ยนไปยังหัวข้อถัดไป
     - **ควบคุมช่วงว่างระหว่างการบรรยายฉากถัดไปให้กระชับไม่เกิน 4 วินาที** (หน่วงเวลาพอดีที่ 2.5 วินาที พร้อมแถบนับถอยหลัง `✅ อ่านจบแล้ว • ไปหัวข้อถัดไปใน 2.5 วิ`) ทำให้การรับชมต่อเนื่อง ลื่นไหล ไม่มีจังหวะเงียบว่างนานเกินไป
     - ป้องกัน Chrome/Edge Audio Buffer พักสายด้วย Heartbeat Keep-Alive ทุก 7 วินาที
     - แสดงแถบสถานะเสียงพากย์สด `🔊 กำลังบรรยาย...` พร้อมแอนิเมชันคลื่นเสียง
   - **โหมดคู่ขนาน (Dual-Mode):**
     - **💻 หน้าจำลอง (Simulation Mode):** จำลองหน้าจอระบบ Smart Risk Management ด้วยภาพหน้าจอ Full HD 1080p จริง 100% พร้อมเคอร์เซอร์เมาส์จำลองวิ่งและคลิกอัตโนมัติ
     - **🌐 เว็บจริง (Live Web Mode):** เชื่อมต่อหน้าเว็บจริง `https://www.gcmeapp.com/epopm/` เข้ามาในตัวเล่นโดยตรง ให้ท่านสามารถพิมพ์ล็อกอิน หรือคลิก *Sign in with Microsoft* เข้าสู่ระบบจริงได้ทันที
   - **ระบบหยุดเพื่อล็อกอิน (Pause for Login):** ในโหมดเว็บจริง ท่านสามารถกดปุ่ม `⏸️ หยุดวิดีโอเพื่อล็อกอิน` เพื่อให้เวลาท่านเข้าสู่ระบบจริงอย่างปลอดภัย และเมื่อเข้าสู่ระบบเรียบร้อยแล้ว ให้กด `▶️ ล็อกอินแล้ว (คลิกเพื่อไปต่อ)` เพื่อให้วิดีโอพาทำขั้นตอนถัดไปต่อ
   - **Synchronized Thai Subtitles & Audio:** แถบซับไตเติลภาษาไทยและเสียงพากย์สังเคราะห์ AI Thai Voice แนะนำการใช้งานไปพร้อมๆ กัน
   - **Script Drawer:** แสดงบทพากย์คำต่อคำทางขวามือ คลิกการ์ดเพื่อข้ามไปยังฉากนั้นๆ ได้ทันที
   - **Speed Control & Fullscreen:** ปรับความเร็ว 1.0x, 1.25x, 1.5x และกด `F` ขยายเต็มจอได้

---

## ⌨️ ปุ่มลัดแป้นพิมพ์ (Keyboard Shortcuts)

| ปุ่มลัด | หน้าที่การทำงาน |
| :---: | :--- |
| `Spacebar` | เล่น (Play) / หยุดชั่วคราว (Pause) |
| `ArrowRight` (→) | ข้ามไปยังฉากถัดไป (Next Scene) |
| `ArrowLeft` (←) | ย้อนกลับไปยังฉากก่อนหน้า (Previous Scene) |
| `F` | สลับโหมดเต็มหน้าจอ (Toggle Fullscreen) |
| `M` | เปิด/ปิดเสียงพากย์สังเคราะห์ (Toggle Audio/TTS) |

---

## 📹 วิธีการบันทึกเป็นไฟล์วิดีโอ MP4 (Recording Guide)

หากต้องการบันทึกหน้าจอจากตัวเล่นนี้ออกมาเป็นไฟล์วิดีโอ MP4:
1. เปิดโปรแกรมบันทึกหน้าจอ (เช่น **OBS Studio**, **Camtasia** หรือ **Xbox Game Bar** ใน Windows กด `Win + G`)
2. เปิดไฟล์ `index.html` แล้วกดปุ่ม `F` เพื่อเข้าสู่โหมดเต็มหน้าจอ (Fullscreen)
3. กดบันทึก (Start Recording) ในโปรแกรมอัดหน้าจอ
4. กด `Spacebar` ในตัวเล่นเพื่อเริ่มเล่นฉาก ตัวเล่นจะดำเนินฉาก เปลี่ยนภาพหน้าจอ และอ่านบทพากย์ให้โดยอัตโนมัติตามลำดับ
