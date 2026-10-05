/**
 * generate-presentation.cjs
 * Generates an executive-ready, 100% native widescreen 16:9 PowerPoint presentation
 * with embedded real UI screenshots, zero overflow, zero underfill, precise mathematical layout budgets, and GCME brand styling.
 * Output: ProRisk_Manager_AI_User_Guide.pptx and PRORISK_USER_GUIDE.pptx
 */

const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');
const JSZip = require('jszip');

async function buildPresentation() {
  const pres = new pptxgen();

  // Modern Widescreen 16:9 (13.3333" x 7.500")
  // 12192000 EMU x 6858000 EMU
  pres.layout = 'LAYOUT_WIDE';

  // Design Tokens
  const THEME = {
    colors: {
      navyDark: '0A192F',      // Cover background
      navyPrimary: '0F2C59',   // Primary brand titles
      navyCardTitle: '1E3A8A', // Card header title
      charcoal: '1E293B',      // Body text dark
      slateMuted: '475569',    // Subtitles
      slateLight: 'F8FAFC',    // Canvas background
      borderSlate: 'CBD5E1',   // Card border
      cardBg: 'FFFFFF',        // Card background
      boxBgLight: 'F1F5F9',    // Inner callout background
      bluePillBg: 'DBEAFE',
      bluePillText: '1D4ED8',
      greenPillBg: 'DCFCE7',
      greenPillText: '15803D',
      amberPillBg: 'FEF3C7',
      amberPillText: 'B45309',
      purplePillBg: 'F3E8FF',
      purplePillText: '7E22CE',
      accentCyan: '38BDF8',
      accentGreen: '16A34A',
      accentAmber: 'D97706',
      accentPurple: '9333EA',
      accentBlue: '2563EB',
    },
    fonts: {
      title: 'Segoe UI',
      body: 'Segoe UI',
    }
  };

  const screenshotsDir = path.join(__dirname, 'scratch', 'app_screenshots');

  // Helper: Create slide with automatic modern corner radius for roundRect
  function createSlide() {
    const slide = pres.addSlide();
    const origAddShape = slide.addShape.bind(slide);
    slide.addShape = function(type, options) {
      if (type === pres.ShapeType.roundRect && options && !options.rectRadius) {
        if (options.h <= 0.38) options.rectRadius = 0.12;
        else if (options.h <= 0.85) options.rectRadius = 0.06;
        else options.rectRadius = 0.08;
      }
      return origAddShape(type, options);
    };
    return slide;
  }

  // Helper: Standard Slide Header & Footer
  function addHeader(slide, badgeText, badgeBg, badgeColor, titleText, subtitleText, slideNum) {
    // Top Category Badge
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 0.35, w: 2.8, h: 0.28,
      fill: { color: badgeBg },
      line: { color: badgeBg }
    });
    slide.addText(badgeText, {
      x: 0.8, y: 0.35, w: 2.8, h: 0.28,
      fontSize: 8.5, fontFace: THEME.fonts.title, bold: true,
      color: badgeColor, align: 'center', valign: 'middle'
    });

    // Action Title
    slide.addText(titleText, {
      x: 0.8, y: 0.68, w: 11.733, h: 0.40,
      fontSize: 16.5, fontFace: THEME.fonts.title, bold: true,
      color: THEME.colors.navyPrimary, valign: 'middle'
    });

    // Subtitle
    if (subtitleText) {
      slide.addText(subtitleText, {
        x: 0.8, y: 1.08, w: 11.733, h: 0.25,
        fontSize: 10, fontFace: THEME.fonts.body,
        color: THEME.colors.slateMuted, valign: 'middle'
      });
    }

    // Top divider line
    slide.addShape(pres.ShapeType.line, {
      x: 0.8, y: 1.36, w: 11.733, h: 0,
      line: { color: 'E2E8F0', width: 1 }
    });

    // Footer
    slide.addText('Smart Risk Management • User Quick Start Guide', {
      x: 0.8, y: 7.02, w: 6.0, h: 0.25,
      fontSize: 8, fontFace: THEME.fonts.body, color: '94A3B8', valign: 'middle'
    });
    slide.addText(`Slide ${slideNum} • E-PO-PM System v0.3.20261005`, {
      x: 6.8, y: 7.02, w: 5.733, h: 0.25,
      fontSize: 8, fontFace: THEME.fonts.body, color: '94A3B8', align: 'right', valign: 'middle'
    });
  }

  // Helper: Visual UI Mockup Card for Screenshot embedding
  function addUiMockupCard(slide, {
    x = 6.45,
    y = 1.50,
    w = 6.08,
    h = 5.30,
    browserTitle = '🌐 GCME ProRisk • Live Interface',
    imageFile,
    callout1 = '',
    callout2 = ''
  }) {
    const fullImagePath = path.join(screenshotsDir, imageFile);

    // 1. Outer Container Card
    slide.addShape(pres.ShapeType.roundRect, {
      x, y, w, h,
      fill: { color: 'FFFFFF' },
      line: { color: THEME.colors.borderSlate, width: 1.2 }
    });

    // 2. Browser Header Bar (Dark modern window header)
    slide.addShape(pres.ShapeType.roundRect, {
      x: x + 0.02, y: y + 0.02, w: w - 0.04, h: 0.36,
      fill: { color: '0F172A' },
      line: { color: '0F172A' }
    });

    // 3 Window control dots (Mac/Modern style)
    slide.addShape(pres.ShapeType.ellipse, { x: x + 0.18, y: y + 0.13, w: 0.10, h: 0.10, fill: { color: 'EF4444' }, line: { color: 'EF4444' } });
    slide.addShape(pres.ShapeType.ellipse, { x: x + 0.33, y: y + 0.13, w: 0.10, h: 0.10, fill: { color: 'F59E0B' }, line: { color: 'F59E0B' } });
    slide.addShape(pres.ShapeType.ellipse, { x: x + 0.48, y: y + 0.13, w: 0.10, h: 0.10, fill: { color: '10B981' }, line: { color: '10B981' } });

    // Browser Address / Window Title
    slide.addText(browserTitle, {
      x: x + 0.65, y: y + 0.04, w: w - 0.75, h: 0.30,
      fontSize: 8.5, fontFace: THEME.fonts.title, bold: true,
      color: '94A3B8', valign: 'middle'
    });

    // 3. Screenshot Image
    const imgW = w - 0.30; // 5.78"
    const imgH = 3.25;     // 16:9 ratio
    const imgX = x + 0.15;
    const imgY = y + 0.44;

    if (fs.existsSync(fullImagePath)) {
      slide.addImage({
        path: fullImagePath,
        x: imgX,
        y: imgY,
        w: imgW,
        h: imgH
      });
    }

    // Image border outline
    slide.addShape(pres.ShapeType.rect, {
      x: imgX, y: imgY, w: imgW, h: imgH,
      fill: { type: 'none' },
      line: { color: 'CBD5E1', width: 1 }
    });

    // 4. Bottom Callout Annotation Box
    const annotY = imgY + imgH + 0.12; // 5.31
    const annotH = (y + h) - annotY - 0.14; // ~1.35
    slide.addShape(pres.ShapeType.roundRect, {
      x: imgX, y: annotY, w: imgW, h: annotH,
      fill: { color: 'F8FAFC' },
      line: { color: 'E2E8F0', width: 1 }
    });

    const calloutText = `${callout1}\n${callout2}`;
    slide.addText(calloutText, {
      x: imgX + 0.15, y: annotY + 0.06, w: imgW - 0.30, h: annotH - 0.12,
      fontSize: 8.8, fontFace: THEME.fonts.body,
      color: THEME.colors.charcoal, lineSpacingMultiple: 1.22, valign: 'middle'
    });
  }

  // ===========================================================================
  // SLIDE 1: Title & Cover Slide
  // ===========================================================================
  {
    const slide = createSlide();
    slide.background = { color: THEME.colors.navyDark };

    // Decorative top accent strip
    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: 13.333, h: 0.12,
      fill: { color: THEME.colors.accentCyan },
      line: { color: THEME.colors.accentCyan }
    });

    // Category Badge
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 0.80, w: 3.5, h: 0.36,
      fill: { color: '1E293B' },
      line: { color: '334155', width: 1 }
    });
    slide.addText('USER QUICK START GUIDE • 2026 EDITION', {
      x: 0.8, y: 0.80, w: 3.5, h: 0.36,
      fontSize: 9, fontFace: THEME.fonts.title, bold: true,
      color: THEME.colors.accentCyan, align: 'center', valign: 'middle'
    });

    // Main Title
    slide.addText('Smart Risk Management', {
      x: 0.8, y: 1.30, w: 11.733, h: 0.95,
      fontSize: 44, fontFace: THEME.fonts.title, bold: true,
      color: 'FFFFFF', valign: 'middle'
    });

    // Subtitle
    slide.addText('คู่มือแนะนำการใช้งานระบบบริหารความเสี่ยงโครงการ EPC อัจฉริยะ\nรวดเร็ว • ใช้งานง่าย • แม่นยำตามมาตรฐาน ISO 31000:2018 & COSO ERM', {
      x: 0.8, y: 2.38, w: 11.733, h: 0.85,
      fontSize: 15.5, fontFace: THEME.fonts.body,
      color: 'CBD5E1', lineSpacingMultiple: 1.25, valign: 'top'
    });

    // 3 Feature Highlight Cards
    const cards = [
      {
        title: '🌐 WEB APPLICATION',
        badge: 'PORTAL',
        desc: '• URL: www.gcmeapp.com/epopm\n• เข้าใช้งานผ่านเว็บเบราว์เซอร์ได้ทันที ไม่ต้องลงโปรแกรม\n• รองรับ Microsoft Single Sign-On (SSO)\n• ใช้งานได้สมบูรณ์แบบทั้ง PC, Tablet และ Mobile',
        highlight: '⚡ เข้าถึงได้ทุกที่ทุกเวลาบน Cloud'
      },
      {
        title: '🤖 AI RISK COPILOT',
        badge: 'INTELLIGENCE',
        desc: '• ขับเคลื่อนด้วย Gemini 3.7 Flash & Llama 3\n• วิเคราะห์เอกสาร TOR และสกัดค่าปรับ LDs อัตโนมัติ\n• แนะนำแผน Action Plan และกลยุทธ์ A/T/M/AC ใน 3 วินาที\n• คำนวณงบสำรองความเสี่ยง EMV Contingency Buffer',
        highlight: '🎯 วิเคราะห์และตอบกลับใน 3 วินาที'
      },
      {
        title: '📑 EXCEL & SQL READY',
        badge: 'ENTERPRISE',
        desc: '• ทำงานรวดเร็วด้วย Excel Grid View (Inline Edit)\n• ส่งออกรายงานแบบฟอร์มทางการ EPM-03-014AT1\n• 1-Click Database Backup ลง PostgreSQL / MySQL\n• ระบบ Chunked Batching ปลอดภัย 100%',
        highlight: '📋 ส่งออกรายงานทางการ 1-Click'
      }
    ];

    cards.forEach((c, i) => {
      const cardX = 0.8 + i * 4.0;
      slide.addShape(pres.ShapeType.roundRect, {
        x: cardX, y: 3.45, w: 3.733, h: 3.25,
        fill: { color: '0F2344' },
        line: { color: '1E3A8A', width: 1.5 }
      });
      // Top accent bar inside card (flat rectangle, no distortion)
      slide.addShape(pres.ShapeType.rect, {
        x: cardX + 0.25, y: 3.60, w: 3.233, h: 0.04,
        fill: { color: THEME.colors.accentCyan },
        line: { color: THEME.colors.accentCyan }
      });
      // Header
      slide.addText(c.title, {
        x: cardX + 0.25, y: 3.78, w: 3.233, h: 0.35,
        fontSize: 12, fontFace: THEME.fonts.title, bold: true,
        color: THEME.colors.accentCyan, valign: 'middle'
      });
      // Content
      slide.addText(c.desc, {
        x: cardX + 0.25, y: 4.22, w: 3.233, h: 1.85,
        fontSize: 9.8, fontFace: THEME.fonts.body,
        color: 'E2E8F0', lineSpacingMultiple: 1.25, valign: 'top'
      });
      // Bottom highlight tag
      slide.addShape(pres.ShapeType.roundRect, {
        x: cardX + 0.22, y: 6.18, w: 3.293, h: 0.38,
        fill: { color: '1E293B' },
        line: { color: '334155', width: 1 }
      });
      slide.addText(c.highlight, {
        x: cardX + 0.22, y: 6.18, w: 3.293, h: 0.38,
        fontSize: 8.5, fontFace: THEME.fonts.title, bold: true,
        color: THEME.colors.accentCyan, align: 'center', valign: 'middle'
      });
    });

    slide.addText('Corporate Project Management Division • E-PO-PM System v0.3.20261005', {
      x: 0.8, y: 6.95, w: 11.733, h: 0.3,
      fontSize: 9, fontFace: THEME.fonts.body, color: '64748B', valign: 'middle'
    });
  }

  // ===========================================================================
  // SLIDE 2: System Architecture (4 Pillars)
  // ===========================================================================
  {
    const slide = createSlide();
    slide.background = { color: THEME.colors.slateLight };
    addHeader(slide, 'SYSTEM ARCHITECTURE', THEME.colors.bluePillBg, THEME.colors.bluePillText,
      'ภาพรวมระบบ: ศูนย์กลางการบริหารความเสี่ยงโครงการครบทั้งวงจร',
      'เชื่อมโยง 4 เสาหลักช่วยให้ทีมบริหารเห็นสถานะความเสี่ยงและตัดสินใจได้อย่างแม่นยำ', 2);

    const pillars = [
      {
        badge: 'MODULE 1', bg: THEME.colors.bluePillBg, col: THEME.colors.bluePillText, accent: THEME.colors.accentBlue,
        title: '📊 Dashboard & Heatmap',
        desc: '• 5x5 Heatmap Matrix: แสดงการกระจายตัวของความเสี่ยง Initial vs Residual\n• Dynamic Project Filter: สลับดูเฉพาะโครงการของตนเอง หรือดูภาพรวมทั้งบริษัท\n• Status & Category Charts: กราฟแท่งจำแนกตามหมวดหมู่งานและสถานะ Open/Closed\n• Risk Severity KPIs: ติดตามจำนวนความเสี่ยงระดับ Very High / High ทันที',
        highlight: '💡 สรุปสถานะวิกฤตได้ใน 3 วินาที'
      },
      {
        badge: 'MODULE 2', bg: THEME.colors.greenPillBg, col: THEME.colors.greenPillText, accent: THEME.colors.accentGreen,
        title: '📑 Excel Register Grid',
        desc: '• Inline Grid Editing: พิมพ์แก้ไขข้อมูลในตารางได้อย่างรวดเร็วเสมือน Excel\n• Hover Header Guides: ชี้เมาส์ดูคำอธิบายและตัวอย่างตามเกณฑ์ EPM-03-014\n• Duplicate & Batch Add: โคลนแถวและเพิ่มความเสี่ยงใหม่อย่างต่อเนื่อง\n• Unsaved Changes Shield: ข้อมูลที่กำลังพิมพ์จะไม่ถูกทับจาก Real-time sync',
        highlight: '⚡ ลดเวลาคีย์ข้อมูลลงกว่า 60%'
      },
      {
        badge: 'MODULE 3', bg: THEME.colors.purplePillBg, col: THEME.colors.purplePillText, accent: THEME.colors.accentPurple,
        title: '🤖 TOR AI Assessment',
        desc: '• Scan TOR Documents: สแกนเอกสารประกวดราคาอัตโนมัติ (PDF/Word .docx)\n• สกัดข้อจำกัด & ค่าปรับ: ตรวจพบบทลงโทษ Liquidated Damages (LDs)\n• จำแนกความเสี่ยง 8 มิติ: Strategic, Financial, Compliance, Schedule ฯลฯ\n• คำนวณงบสำรอง EMV Buffer: กำหนด Contingency ก่อนยื่นซองราคา',
        highlight: '🛡️ ป้องกันขาดทุนก่อนเซ็นสัญญา'
      },
      {
        badge: 'MODULE 4', bg: THEME.colors.amberPillBg, col: THEME.colors.amberPillText, accent: THEME.colors.accentAmber,
        title: '✉️ Alerts & Official Export',
        desc: '• Overdue Email Alert: สรุปความเสี่ยงเกินกำหนดส่งเมลแจ้งเตือน PM ทันที\n• Official Excel Export: ส่งออกลงใน Template ทางการ EPM-03-014AT1\n• Client-Side Fallback: ดาวน์โหลดไฟล์ได้ตลอดเวลาแม้ Server ออฟไลน์\n• 1-Click Database Backup: สำรองฐานข้อมูลลง PostgreSQL / MySQL',
        highlight: '📋 รายงานทางการ 1-Click พร้อมประชุม'
      }
    ];

    pillars.forEach((p, i) => {
      const cardX = 0.8 + i * 2.984;
      slide.addShape(pres.ShapeType.roundRect, {
        x: cardX, y: 1.50, w: 2.78, h: 5.30,
        fill: { color: THEME.colors.cardBg },
        line: { color: THEME.colors.borderSlate, width: 1.2 }
      });
      // Top accent bar (flat rectangle)
      slide.addShape(pres.ShapeType.rect, {
        x: cardX + 0.18, y: 1.62, w: 2.42, h: 0.05,
        fill: { color: p.accent },
        line: { color: p.accent }
      });
      slide.addShape(pres.ShapeType.roundRect, {
        x: cardX + 0.18, y: 1.78, w: 1.1, h: 0.26,
        fill: { color: p.bg },
        line: { color: p.bg }
      });
      slide.addText(p.badge, {
        x: cardX + 0.18, y: 1.78, w: 1.1, h: 0.26,
        fontSize: 7.5, fontFace: THEME.fonts.title, bold: true,
        color: p.col, align: 'center', valign: 'middle'
      });
      slide.addText(p.title, {
        x: cardX + 0.18, y: 2.12, w: 2.42, h: 0.50,
        fontSize: 11.5, fontFace: THEME.fonts.title, bold: true,
        color: THEME.colors.navyPrimary, valign: 'top'
      });
      slide.addText(p.desc, {
        x: cardX + 0.18, y: 2.70, w: 2.42, h: 3.35,
        fontSize: 9.3, fontFace: THEME.fonts.body,
        color: THEME.colors.charcoal, lineSpacingMultiple: 1.22, valign: 'top'
      });
      slide.addShape(pres.ShapeType.roundRect, {
        x: cardX + 0.16, y: 6.18, w: 2.46, h: 0.48,
        fill: { color: THEME.colors.boxBgLight },
        line: { color: THEME.colors.borderSlate, width: 1 }
      });
      slide.addText(p.highlight, {
        x: cardX + 0.16, y: 6.18, w: 2.46, h: 0.48,
        fontSize: 8.5, fontFace: THEME.fonts.title, bold: true,
        color: THEME.colors.navyPrimary, align: 'center', valign: 'middle'
      });
    });
  }

  // ===========================================================================
  // SLIDE 3: Getting Started & Login Roles (Left Instructions + Right UI Mockup)
  // ===========================================================================
  {
    const slide = createSlide();
    slide.background = { color: THEME.colors.slateLight };
    addHeader(slide, 'ACCESS & SECURITY', THEME.colors.bluePillBg, THEME.colors.bluePillText,
      'การเข้าสู่ระบบและระดับสิทธิ์: เข้าถึงง่าย ปลอดภัยระดับองค์กร',
      'รองรับการล็อกอินผ่าน Email บัญชีบริษัท และ Microsoft Single Sign-On (SSO)', 3);

    // Left Card (Instructions)
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.50, w: 5.40, h: 5.30,
      fill: { color: THEME.colors.cardBg },
      line: { color: THEME.colors.borderSlate, width: 1.2 }
    });
    // Top accent bar (flat rectangle)
    slide.addShape(pres.ShapeType.rect, {
      x: 1.00, y: 1.62, w: 5.00, h: 0.05,
      fill: { color: THEME.colors.accentBlue },
      line: { color: THEME.colors.accentBlue }
    });
    slide.addText('🔐 ขั้นตอนการเข้าใช้งาน (Login & Permissions)', {
      x: 1.00, y: 1.76, w: 5.00, h: 0.35,
      fontSize: 13, fontFace: THEME.fonts.title, bold: true, color: THEME.colors.navyPrimary
    });

    const loginText = [
      '1. เปิดเว็บบราวเซอร์ ไปที่ www.gcmeapp.com/epopm\n   (ใช้งานได้สมบูรณ์ทั้งบน PC, โน้ตบุ๊ก, แท็บเล็ต และสมาร์ตโฟน)',
      '2. เลือกช่องทางเข้าสู่ระบบที่สะดวก:\n   • Sign in with Microsoft: คลิกครั้งเดียวล็อกอินด้วยบัญชีองค์กรทันที\n   • Email & Password: กรอกอีเมลบริษัทและรหัสผ่าน',
      '3. รหัสผ่านเริ่มต้นผู้ใช้ใหม่: gcme1234567\n   (ระบบจะบังคับเปลี่ยนรหัสผ่านในการเข้าใช้งานครั้งแรกเพื่อความปลอดภัย)',
      '4. สิทธิ์การใช้งาน (Roles):\n   • Admin: จัดการได้ทุกโครงการ เพิ่มผู้ใช้ และสำรองฐานข้อมูล\n   • PM / User: เข้าถึงและแก้ไขเฉพาะโครงการที่ได้รับมอบหมาย',
      '5. ติดปัญหา Permission Denied? แจ้ง Admin เพื่อขอ Assign สิทธิ์'
    ];
    slide.addText(loginText.join('\n\n'), {
      x: 1.00, y: 2.16, w: 5.00, h: 3.40,
      fontSize: 9.3, fontFace: THEME.fonts.body, color: THEME.colors.charcoal,
      lineSpacingMultiple: 1.15, valign: 'top'
    });

    // Bottom Tip Box
    slide.addShape(pres.ShapeType.roundRect, {
      x: 1.00, y: 5.76, w: 5.00, h: 0.78,
      fill: { color: 'EFF6FF' },
      line: { color: 'BFDBFE', width: 1 }
    });
    slide.addText('💡 Pro-Tip: บุ๊กมาร์ก URL ไว้ในเบราว์เซอร์ และใช้ปุ่ม Microsoft SSO เพื่อล็อกอินรวดเร็วโดยไม่ต้องกรอกรหัสผ่านซ้ำ', {
      x: 1.15, y: 5.76, w: 4.70, h: 0.78,
      fontSize: 8.8, fontFace: THEME.fonts.body, color: '1E40AF', lineSpacingMultiple: 1.15, valign: 'middle'
    });

    // Right Card (Mockup)
    addUiMockupCard(slide, {
      browserTitle: '🌐 GCME ProRisk • Authentication Portal',
      imageFile: 'screen_login.png',
      callout1: '🔑 ปุ่ม "Sign in with Microsoft": เชื่อมต่อระบบ Single Sign-On ของบริษัทได้ทันทีในคลิกเดียว',
      callout2: '🔒 ปลอดภัยสูงสุด: ทุกเซสชันเข้ารหัส TLS 1.3 และมีระบบบังคับเปลี่ยน Default Password'
    });
  }

  // ===========================================================================
  // SLIDE 4: Project Setup - Step 1: Basic Information & ERP Integration
  // ===========================================================================
  {
    const slide = createSlide();
    slide.background = { color: THEME.colors.slateLight };
    addHeader(slide, 'PROJECT SETUP (STEP 1)', THEME.colors.bluePillBg, THEME.colors.bluePillText,
      'เริ่มต้นโครงการใหม่ (Step 1): กำหนดข้อมูลพื้นฐาน & บัญชีโครงการ',
      'สร้างรหัสโครงการให้ตรงกับ ERP ระบุ PM ผู้รับผิดชอบ และคลิก "Next" เข้าสู่การถ่วงน้ำหนัก', 4);

    // Left Card (Instructions)
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.50, w: 5.40, h: 5.30,
      fill: { color: THEME.colors.cardBg },
      line: { color: THEME.colors.borderSlate, width: 1.2 }
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 1.00, y: 1.62, w: 5.00, h: 0.05,
      fill: { color: THEME.colors.accentBlue },
      line: { color: THEME.colors.accentBlue }
    });
    slide.addText('➕ ขั้นตอนการสร้างโครงการใหม่ (Step 1: Basic Info)', {
      x: 1.00, y: 1.76, w: 5.00, h: 0.35,
      fontSize: 13, fontFace: THEME.fonts.title, bold: true, color: THEME.colors.navyPrimary
    });

    const projSteps = [
      '1. คลิกปุ่ม "+ New Project" บนแถบ Navbar ด้านบนเพื่อเปิดหน้าต่างสร้างโครงการ',
      '2. Data Inheritance (Optional): เลือกนำเข้าความเสี่ยงจากโครงการเดิม หรือเลือกสร้าง Blank Project',
      '3. ข้อมูล ERP & ผู้รับผิดชอบ: ระบุ Project No ให้ตรงกับ SAP/ERP, ชื่อโครงการ และชื่อ PM ผู้รับผิดชอบ',
      '4. Industry Type & ISO 31000: เลือกประเภทโรงงาน (Petrochem/Power) และกำหนด Risk Appetite ของโครงการ',
      '5. เข้าสู่ขั้นตอนถัดไป: ตรวจสอบความถูกต้อง แล้วคลิกปุ่ม "Next →" สีน้ำเงิน เพื่อเข้าสู่ Step 2 ถ่วงน้ำหนัก'
    ];
    slide.addText(projSteps.join('\n\n'), {
      x: 1.00, y: 2.16, w: 5.00, h: 3.35,
      fontSize: 9.0, fontFace: THEME.fonts.body, color: THEME.colors.charcoal,
      lineSpacingMultiple: 1.15, valign: 'top'
    });

    // Bottom Tip Box
    slide.addShape(pres.ShapeType.roundRect, {
      x: 1.00, y: 5.76, w: 5.00, h: 0.78,
      fill: { color: 'F0FDF4' },
      line: { color: 'BBF7D0', width: 1 }
    });
    slide.addText('💡 Pro-Tip: กำหนด Project No ให้ตรงกับรหัส ERP ของ GCME เสมอ และสามารถใช้ "Data Inheritance" เพื่อดึงมาตรการควบคุมจากโครงการเดิมมาใช้งานต่อได้ทันที', {
      x: 1.15, y: 5.76, w: 4.70, h: 0.78,
      fontSize: 8.8, fontFace: THEME.fonts.body, color: '166534', lineSpacingMultiple: 1.15, valign: 'middle'
    });

    // Right Card (Mockup)
    addUiMockupCard(slide, {
      browserTitle: '📁 New Project Setup • Step 1: Basic Information',
      imageFile: 'screen_project_form.png',
      callout1: '📋 ข้อมูลโครงการ: กำหนด Project No, ชื่อโครงการ, PM Contact และเลือก Industry Type สำหรับถ่วงน้ำหนักความเสี่ยง',
      callout2: '⚡ ขั้นตอนต่อเนื่อง: กรอกข้อมูลพื้นฐานครบถ้วนแล้วคลิกปุ่ม "Next" สีน้ำเงิน เพื่อเลือก Weighting Factors ใน Step 2'
    });
  }

  // ===========================================================================
  // SLIDE 5: Project Context & Weighting Factors (Step 2)
  // ===========================================================================
  {
    const slide = createSlide();
    slide.background = { color: THEME.colors.slateLight };
    addHeader(slide, 'RISK WEIGHTING (STEP 2)', THEME.colors.purplePillBg, THEME.colors.purplePillText,
      'บริบทโครงการ & การถ่วงน้ำหนัก (Step 2): Selection of Weighting Factors',
      'ปรับจูนคะแนนความเสี่ยงให้ตรงสภาพจริงด้วย 7 หมวดหมู่ แล้วกด Initialize Baseline Risks', 5);

    // Left Card (Instructions)
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.50, w: 5.40, h: 5.30,
      fill: { color: THEME.colors.cardBg },
      line: { color: THEME.colors.borderSlate, width: 1.2 }
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 1.00, y: 1.62, w: 5.00, h: 0.05,
      fill: { color: THEME.colors.accentPurple },
      line: { color: THEME.colors.accentPurple }
    });
    slide.addText('⚙️ หลักการเลือก Weighting Factors (7 หมวดหมู่)', {
      x: 1.00, y: 1.76, w: 5.00, h: 0.35,
      fontSize: 13, fontFace: THEME.fonts.title, bold: true, color: THEME.colors.navyPrimary
    });

    const weightSteps = [
      '1. Project Nature: เลือกความซับซ้อน เช่น Brownfield (ในโรงงานเดิม +2 Both) หรืองานเร่งด่วน Fast-track (+2)',
      '2. Technology & Criticality: เลือกระดับความใหม่ เช่น New Tech (+2) หรือเทคโนโลยีมาตรฐาน Proven Tech (-1)',
      '3. Commercial Pressure: พิจารณาเงื่อนไขสัญญา เช่น Lump Sum, กำหนด COD กระชั้นชิด หรือมีค่าปรับ LD',
      '4. Location & Supply Chain: สภาพพื้นที่ห่างไกล, อากาศรุนแรง หรือมีเครื่องจักร Long Lead Equipment',
      '5. Workforce & Commissioning: ขาดแคลนช่างเฉพาะทาง, ไซต์แออัด หรือลำดับการทดสอบระบบซับซ้อน'
    ];
    slide.addText(weightSteps.join('\n\n'), {
      x: 1.00, y: 2.16, w: 5.00, h: 3.35,
      fontSize: 9.0, fontFace: THEME.fonts.body, color: THEME.colors.charcoal,
      lineSpacingMultiple: 1.15, valign: 'top'
    });

    // Bottom Tip Box
    slide.addShape(pres.ShapeType.roundRect, {
      x: 1.00, y: 5.76, w: 5.00, h: 0.78,
      fill: { color: 'FAF5FF' },
      line: { color: 'E9D5FF', width: 1 }
    });
    slide.addText('💡 เกณฑ์แนะนำ: ติ๊กเลือกเฉพาะปัจจัยที่เป็น "ความท้าทายจริง" ของโครงการ การเลือก Proven Technology หรือ Modular Construction จะช่วยลดระดับความเสี่ยง (Negative Adjustment) ได้ตามมาตรฐานวิศวกรรม', {
      x: 1.15, y: 5.76, w: 4.70, h: 0.78,
      fontSize: 8.6, fontFace: THEME.fonts.body, color: '6B21A8', lineSpacingMultiple: 1.14, valign: 'middle'
    });

    // Right Card (Mockup)
    addUiMockupCard(slide, {
      browserTitle: '⚙️ Project Context • Step 2: Selection of Weighting Factors',
      imageFile: 'screen_weighting_factors.png',
      callout1: '🎯 ปรับตาม Industry Profile: ระบบแสดงค่าน้ำหนัก (+/- Impact & Likelihood) แตกต่างกันตามประเภทโรงงาน',
      callout2: '⚡ ปุ่ม "Initialize Baseline Risks": นำค่าน้ำหนักที่เลือกไปคำนวณและสร้างความเสี่ยงตั้งต้น 31 รายการทันที'
    });
  }

  // ===========================================================================
  // SLIDE 6: Managing Risk Items & 5x5 Matrix (Left Instructions + Right UI Mockup)
  // ===========================================================================
  {
    const slide = createSlide();
    slide.background = { color: THEME.colors.slateLight };
    addHeader(slide, 'RISK EVALUATION', THEME.colors.bluePillBg, THEME.colors.bluePillText,
      'หน้าต่างแดชบอร์ดและการประเมินความเสี่ยง: มาตรฐาน 5x5 Heatmap Matrix',
      'โครงสร้างการประเมินคะแนนก่อน-หลังมาตรการควบคุม พร้อมสรุปสถิติความเสี่ยงแบบเรียลไทม์', 6);

    // Left Card
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.50, w: 5.40, h: 5.30,
      fill: { color: THEME.colors.cardBg },
      line: { color: THEME.colors.borderSlate, width: 1.2 }
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 1.00, y: 1.62, w: 5.00, h: 0.05,
      fill: { color: THEME.colors.accentBlue },
      line: { color: THEME.colors.accentBlue }
    });
    slide.addText('📊 การอ่านค่า Dashboard & เมทริกซ์ 5x5', {
      x: 1.00, y: 1.76, w: 5.00, h: 0.35,
      fontSize: 13, fontFace: THEME.fonts.title, bold: true, color: THEME.colors.navyPrimary
    });

    const evalSteps = [
      '1. 5x5 Heatmap Matrix (เมทริกซ์ความเสี่ยง 25 ช่อง):\n   • Likelihood: โอกาสเกิด Rarely (1) → Most Likely (5)\n   • Impact: ผลกระทบ Insignificant (1) → Severe (5)\n   • Initial Score: คะแนนก่อนมีมาตรการ (Impact × Likelihood)\n   • Residual Score: คะแนนหลังมีมาตรการ (ต้องลดลงสู่โซนปลอดภัย)',
      '2. 4 ระดับสีเกณฑ์มาตรฐานองค์กร:\n   • เขียว: Low (1-3)  • เหลือง: Medium (4-8)\n   • ส้ม: High (9-14)   • แดง: Very High / Critical (≥ 15)',
      '3. KPIs สำคัญบน Dashboard:\n   • Review Due: ความเสี่ยงที่ถึงรอบทบทวนตาม ISO 31000\n   • Exceeds Appetite: รายการที่เกินเพดานความเสี่ยงที่ยอมรับได้\n   • Overdue By Level: สถิติงานค้างจำแนกตามความเร่งด่วน'
    ];
    slide.addText(evalSteps.join('\n\n'), {
      x: 1.00, y: 2.16, w: 5.00, h: 3.40,
      fontSize: 9.3, fontFace: THEME.fonts.body, color: THEME.colors.charcoal,
      lineSpacingMultiple: 1.15, valign: 'top'
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: 1.00, y: 5.76, w: 5.00, h: 0.78,
      fill: { color: 'FEF3C7' },
      line: { color: 'FDE68A', width: 1 }
    });
    slide.addText('🎯 เป้าหมายหลัก: ปฏิบัติตามมาตรการควบคุมเพื่อลดระดับคะแนน Residual ลงสู่โซนสีเขียวหรือสีเหลืองก่อนวันตรวจรับงาน', {
      x: 1.15, y: 5.76, w: 4.70, h: 0.78,
      fontSize: 8.8, fontFace: THEME.fonts.body, color: '92400E', lineSpacingMultiple: 1.15, valign: 'middle'
    });

    // Right Card (Mockup)
    addUiMockupCard(slide, {
      browserTitle: '📊 Executive Risk Dashboard • Real-time Monitoring',
      imageFile: 'screen_dashboard.png',
      callout1: '💡 จุดเด่น: สรุปภาพรวมความเสี่ยงทั้งโครงการ เห็น Heatmap 5x5 และสถิติงานค้างได้ทันที',
      callout2: '⚡ Interactive: คลิกที่ช่องใน Matrix หรือกราฟแท่งเพื่อ Filter รายการความเสี่ยงได้โดยตรง'
    });
  }

  // ===========================================================================
  // SLIDE 7: AI-Powered Risk Suggestion (Left Instructions + Right UI Mockup)
  // ===========================================================================
  {
    const slide = createSlide();
    slide.background = { color: THEME.colors.slateLight };
    addHeader(slide, 'AI ASSISTANT', THEME.colors.purplePillBg, THEME.colors.purplePillText,
      'ตัวช่วย AI อัจฉริยะ: แนะนำกลยุทธ์และแผนจัดการความเสี่ยงใน 3 วินาที',
      'ขับเคลื่อนด้วย Google Gemini 3.7 Flash และ Groq LPU (Llama 3.3 70B)', 7);

    // Left Card (Instructions)
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.50, w: 5.40, h: 5.30,
      fill: { color: THEME.colors.cardBg },
      line: { color: THEME.colors.borderSlate, width: 1.2 }
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 1.00, y: 1.62, w: 5.00, h: 0.05,
      fill: { color: THEME.colors.accentPurple },
      line: { color: THEME.colors.accentPurple }
    });
    slide.addText('✨ วิธีใช้งานฟอร์มและปุ่ม "AI Suggest"', {
      x: 1.00, y: 1.76, w: 5.00, h: 0.35,
      fontSize: 13, fontFace: THEME.fonts.title, bold: true, color: THEME.colors.navyPrimary
    });

    const aiSteps = [
      '1. ระบุ Description ความเสี่ยงตามมาตรฐาน ISO 31000:\n   "เนื่องจาก [สาเหตุ] จึงเสี่ยงต่อ [เหตุการณ์] ส่งผลให้ [ผลกระทบ]"',
      '2. เลือก Possible Effect (Cost, Time, Quality, Health & Safety, Environment)',
      '3. คลิกปุ่ม "AI Suggest" (✨) สีม่วงด้านขวาของฟอร์ม',
      '4. AI ประมวลผลจากคลังความเชี่ยวชาญด้าน EPC Project Management ตอบกลับใน 3 วินาที:\n   • คัดเลือกกลยุทธ์ที่เหมาะสม (Avoid, Transfer, Mitigate, Accept)\n   • ร่างแผนการดำเนินการ (Action to Control) ภาษาไทยอย่างเป็นรูปธรรม\n   • ระบุผู้รับผิดชอบ และประเมินคะแนน Residual ที่ควรตั้งเป้าหมาย',
      '5. กดบันทึกเพื่อจัดเก็บข้อมูลลงระบบ Cloud ทันที'
    ];
    slide.addText(aiSteps.join('\n\n'), {
      x: 1.00, y: 2.16, w: 5.00, h: 3.40,
      fontSize: 9.3, fontFace: THEME.fonts.body, color: THEME.colors.charcoal,
      lineSpacingMultiple: 1.15, valign: 'top'
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: 1.00, y: 5.76, w: 5.00, h: 0.78,
      fill: { color: 'FAF5FF' },
      line: { color: 'E9D5FF', width: 1 }
    });
    slide.addText('💡 ความเร็วสูง: AI ประมวลผลและตอบกลับภายใน 3 วินาที ช่วยให้วิศวกรและ PM ร่างมาตรการควบคุมที่สอดคล้องกับมาตรฐานทางวิศวกรรมสากลได้อย่างแม่นยำ', {
      x: 1.15, y: 5.76, w: 4.70, h: 0.78,
      fontSize: 8.8, fontFace: THEME.fonts.body, color: '6B21A8', lineSpacingMultiple: 1.15, valign: 'middle'
    });

    // Right Card (Mockup)
    addUiMockupCard(slide, {
      browserTitle: '🤖 Risk Assessment Form • Smart AI Copilot',
      imageFile: 'screen_risk_form.png',
      callout1: '🎯 ปุ่ม "✨ AI Suggest" สีม่วง: คลิกเพื่อให้ AI ร่างกลยุทธ์และ Action Plan อัตโนมัติ',
      callout2: '📍 Interactive Heatmap Picker: คลิกเลือก Likelihood (1-5) และ Impact (1-5) ได้บนเมทริกซ์ทันที'
    });
  }

  // ===========================================================================
  // SLIDE 8: Excel Risk Register Grid View (Left Instructions + Right UI Mockup)
  // ===========================================================================
  {
    const slide = createSlide();
    slide.background = { color: THEME.colors.slateLight };
    addHeader(slide, 'PRODUCTIVITY MODE', THEME.colors.greenPillBg, THEME.colors.greenPillText,
      'โหมดตารางด่วน Excel Grid: ทำงานหลายสิบรายการพร้อมกันอย่างรวดเร็ว',
      'แก้ไขข้อมูลทันทีในตาราง (Inline Editing) พร้อมระบบป้องกันข้อมูลสูญหายจากการซิงค์', 8);

    // Left Card (Instructions)
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.50, w: 5.40, h: 5.30,
      fill: { color: THEME.colors.cardBg },
      line: { color: THEME.colors.borderSlate, width: 1.2 }
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 1.00, y: 1.62, w: 5.00, h: 0.05,
      fill: { color: THEME.colors.accentGreen },
      line: { color: THEME.colors.accentGreen }
    });
    slide.addText('⚡ การใช้งานโหมดตารางด่วน Excel Grid', {
      x: 1.00, y: 1.76, w: 5.00, h: 0.35,
      fontSize: 13, fontFace: THEME.fonts.title, bold: true, color: THEME.colors.navyPrimary
    });

    const gridText = [
      '1. สลับเข้าสู่โหมด "Excel Grid" ได้ทันทีจากแถบ Navbar ด้านบน',
      '2. Inline Grid Editing: คลิกพิมพ์แก้ไข Description, Owner หรือปรับคะแนน Impact/Likelihood ในเซลล์ได้เลยโดยไม่ต้องเปิด Modal ทีละรายการ',
      '3. 4 ขั้นตอนกระบวนการมาตรฐาน EPM-03-014AT1:\n   • 1. Identify Risks (สีน้ำเงิน)\n   • 2. Assess Risks Pre-mitigation (สีส้ม)\n   • 3. Treat Risks / Response (สีเขียว)\n   • 4. Control Risks Residual (สีม่วง)',
      '4. Hover Header Guides: นำเมาส์ชี้หัวคอลัมน์เพื่อดูเกณฑ์ตัดสินผลกระทบ',
      '5. Batch Save: ไฮไลต์แถวที่แก้ไขและกดปุ่ม "Save All Changes" บันทึกทีเดียว'
    ];
    slide.addText(gridText.join('\n\n'), {
      x: 1.00, y: 2.16, w: 5.00, h: 3.40,
      fontSize: 9.3, fontFace: THEME.fonts.body, color: THEME.colors.charcoal,
      lineSpacingMultiple: 1.15, valign: 'top'
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: 1.00, y: 5.76, w: 5.00, h: 0.78,
      fill: { color: 'F0FDF4' },
      line: { color: 'BBF7D0', width: 1 }
    });
    slide.addText('🚀 ลดเวลาคีย์ข้อมูลลงกว่า 60% เสมือนทำงานบน Microsoft Excel จริง พร้อมระบบ Unsaved Changes Shield ป้องกันข้อมูลถูกเขียนทับ', {
      x: 1.15, y: 5.76, w: 4.70, h: 0.78,
      fontSize: 8.8, fontFace: THEME.fonts.body, color: '166534', lineSpacingMultiple: 1.15, valign: 'middle'
    });

    // Right Card (Mockup)
    addUiMockupCard(slide, {
      browserTitle: '📑 Excel Risk Register Grid • Doc No: EPM-03-014AT1',
      imageFile: 'screen_excel.png',
      callout1: '📋 4 ขั้นตอนมาตรฐาน: 1. Identify → 2. Assess → 3. Treat / Response → 4. Control',
      callout2: '💾 ปุ่ม "Save All Changes": บันทึกทุกแถวที่แก้ไขลง Cloud พร้อมกันในคลิกเดียว'
    });
  }

  // ===========================================================================
  // SLIDE 9: TOR & Proposal Risk Assessment Module (Left Instructions + Right UI Mockup)
  // ===========================================================================
  {
    const slide = createSlide();
    slide.background = { color: THEME.colors.slateLight };
    addHeader(slide, 'PRE-BID & PROPOSAL', THEME.colors.purplePillBg, THEME.colors.purplePillText,
      'โมดูลวิเคราะห์ TOR: ป้องกันความเสี่ยงขาดทุนตั้งแต่ขั้นตอนยื่นซองราคา',
      'สกัดเงื่อนไขสัญญา บทปรับ LDs และคำนวณงบสำรอง EMV Contingency Buffer', 9);

    // Left Card (Instructions)
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.50, w: 5.40, h: 5.30,
      fill: { color: THEME.colors.cardBg },
      line: { color: THEME.colors.borderSlate, width: 1.2 }
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 1.00, y: 1.62, w: 5.00, h: 0.05,
      fill: { color: THEME.colors.accentPurple },
      line: { color: THEME.colors.accentPurple }
    });
    slide.addText('📑 วิธีวิเคราะห์ TOR และคำนวณงบสำรอง EMV', {
      x: 1.00, y: 1.76, w: 5.00, h: 0.35,
      fontSize: 13, fontFace: THEME.fonts.title, bold: true, color: THEME.colors.navyPrimary
    });

    const torText = [
      '1. อัปโหลดเอกสาร TOR ได้ทั้ง PDF และ Word (.docx) ระบบดึงข้อความอัตโนมัติ',
      '2. คลิกปุ่ม "AI Scan TOR" เพื่อสกัดข้อจำกัดสัญญาและบทปรับส่งมอบล่าช้า\n   (Liquidated Damages: LDs เช่น 0.1%/วัน สูงสุด 10% ของมูลค่างาน)',
      '3. ติดตาม 5 ขั้นตอน Workflow ที่เป็นระบบ:\n   1. ขอบเขตและบริบท → 2. ระบุความเสี่ยง → 3. เมทริกซ์ 5x5 → 4. มาตรการ & Contingency → 5. ติดตาม & ข้อเสนอแนะ',
      '4. คำนวณงบสำรองความเสี่ยง EMV (Expected Monetary Value):\n   EMV = Probability (%) × Estimated Impact (THB) รวมเป็น Contingency Buffer',
      '5. กดพิมพ์รายงานผู้บริหารแบบ 1-Click Executive PDF พร้อมพื้นที่ลงนาม'
    ];
    slide.addText(torText.join('\n\n'), {
      x: 1.00, y: 2.16, w: 5.00, h: 3.40,
      fontSize: 9.3, fontFace: THEME.fonts.body, color: THEME.colors.charcoal,
      lineSpacingMultiple: 1.15, valign: 'top'
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: 1.00, y: 5.76, w: 5.00, h: 0.78,
      fill: { color: 'FAF5FF' },
      line: { color: 'E9D5FF', width: 1 }
    });
    slide.addText('🛡️ Pre-Bid Shield: ป้องกันโครงการขาดทุน ช่วยให้คณะกรรมการประกวดราคามีตัวเลข Contingency Buffer ที่มีหลักฐานรองรับก่อนยื่นซอง', {
      x: 1.15, y: 5.76, w: 4.70, h: 0.78,
      fontSize: 8.8, fontFace: THEME.fonts.body, color: '6B21A8', lineSpacingMultiple: 1.15, valign: 'middle'
    });

    // Right Card (Mockup)
    addUiMockupCard(slide, {
      browserTitle: '🏛️ TOR Risk Assessment Module • Proposal PROP-2026-001',
      imageFile: 'screen_tor.png',
      callout1: '💰 สรุปงบสำรอง EMV: คำนวณยอด Contingency Buffer (2.6M THB / 5.20%) เทียบกับงบเสนอราคา',
      callout2: '🧭 5 Workflow Tabs: ติดตามสถานะการประเมินความเสี่ยงข้อเสนอราคาอย่างเป็นระบบ'
    });
  }

  // ===========================================================================
  // SLIDE 10: Monitoring, Alerts & Official Export (Left Instructions + Right UI Mockup)
  // ===========================================================================
  {
    const slide = createSlide();
    slide.background = { color: THEME.colors.slateLight };
    addHeader(slide, 'MONITORING & EXPORTS', THEME.colors.amberPillBg, THEME.colors.amberPillText,
      'การติดตามและส่งออกรายงาน: ไม่พลาดทุกกำหนดการ พร้อมรายงานทางการ',
      'ระบบคำนวณรอบทบทวนอัตโนมัติ ส่งเมลแจ้งเตือน PM และส่งออก Excel Template ทางการ', 10);

    // Left Card (Instructions)
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.50, w: 5.40, h: 5.30,
      fill: { color: THEME.colors.cardBg },
      line: { color: THEME.colors.borderSlate, width: 1.2 }
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 1.00, y: 1.62, w: 5.00, h: 0.05,
      fill: { color: THEME.colors.accentAmber },
      line: { color: THEME.colors.accentAmber }
    });
    slide.addText('⏰ การติดตามรอบทบทวน & ส่งออกรายงานทางการ', {
      x: 1.00, y: 1.76, w: 5.00, h: 0.35,
      fontSize: 13, fontFace: THEME.fonts.title, bold: true, color: THEME.colors.navyPrimary
    });

    const exportText = [
      '1. ระบบคำนวณ Next Review Date ให้อัตโนมัติตามมาตรฐาน ISO 31000 Cl.6.6\n   (รอบ Monthly 30 วัน หรือ Quarterly 90 วัน)',
      '2. รายการที่เลยกำหนดจะขึ้นแท็กสีแดง "Overdue" ชัดเจนบน Dashboard',
      '3. Email Alert Notification: สรุปความเสี่ยงที่เกินกำหนดส่งเมลหา PM\n   (พร้อมปุ่ม 1-Click Dispatch เปิดโปรแกรม Mail หรือคัดลอกข้อความลง Teams)',
      '4. Official Excel Export: ส่งออกลงใน Template ทางการ EPM-03-014AT1\n   (สี ฟอนต์ รูปแบบเซลล์ตรงตามมาตรฐาน พร้อม Matrix Color Badge)',
      '5. 1-Click SQL Dump: ดาวน์โหลดไฟล์สำรองฐานข้อมูล PostgreSQL / MySQL'
    ];
    slide.addText(exportText.join('\n\n'), {
      x: 1.00, y: 2.16, w: 5.00, h: 3.40,
      fontSize: 9.3, fontFace: THEME.fonts.body, color: THEME.colors.charcoal,
      lineSpacingMultiple: 1.15, valign: 'top'
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: 1.00, y: 5.76, w: 5.00, h: 0.78,
      fill: { color: 'FEF3C7' },
      line: { color: 'FDE68A', width: 1 }
    });
    slide.addText('📋 รายงานพร้อมประชุม: กดปุ่ม Export เพียงคลิกเดียว ได้ไฟล์ Excel ทางการพร้อมเข้าที่ประชุมบอร์ดหรือส่งให้ลูกค้าทันที', {
      x: 1.15, y: 5.76, w: 4.70, h: 0.78,
      fontSize: 8.8, fontFace: THEME.fonts.body, color: '92400E', lineSpacingMultiple: 1.15, valign: 'middle'
    });

    // Right Card (Mockup)
    addUiMockupCard(slide, {
      browserTitle: '📊 Official Export Modal • EPM-03-014AT1 Template',
      imageFile: 'screen_export.png',
      callout1: '📋 Export Excel (.xlsx): ดึงข้อมูลลงในแบบฟอร์มมาตรฐานของ GCME พร้อมสี Matrix ถูกต้อง 100%',
      callout2: '🔍 เลือกขอบเขต Export ได้ทั้งแบบแยกเฉพาะโครงการ หรือรวบรวมทุกโครงการพร้อมกัน'
    });
  }

  // ===========================================================================
  // SLIDE 11: Weekly Routine & Best Practices Checklist (2 Columns)
  // ===========================================================================
  {
    const slide = createSlide();
    slide.background = { color: THEME.colors.slateLight };
    addHeader(slide, 'BEST PRACTICES', THEME.colors.greenPillBg, THEME.colors.greenPillText,
      'สรุป 4 กิจวัตรประจำสัปดาห์สำหรับ PM: ดูแลความเสี่ยงให้ทันสมัยใน 5 นาที',
      'แนวทางปฏิบัติที่ดีที่สุด (Best Practices) เพื่อให้โครงการส่งมอบตรงเวลาและอยู่ในงบประมาณ', 11);

    // Left Card
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.50, w: 5.72, h: 5.30,
      fill: { color: THEME.colors.cardBg },
      line: { color: THEME.colors.borderSlate, width: 1.2 }
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 1.05, y: 1.62, w: 5.22, h: 0.05,
      fill: { color: THEME.colors.accentBlue },
      line: { color: THEME.colors.accentBlue }
    });
    slide.addText('📋 Weekly 4-Step Routine สำหรับ PM (5 นาที/สัปดาห์)', {
      x: 1.05, y: 1.76, w: 5.22, h: 0.35,
      fontSize: 13.5, fontFace: THEME.fonts.title, bold: true, color: THEME.colors.navyPrimary
    });

    const routine = [
      '1. ตรวจสอบ Dashboard:\n   กรองดูเฉพาะโครงการของตนเอง เช็คภาพรวมความเสี่ยงสีส้มและสีแดง (High / Very High)',
      '2. เคลียร์รายการ Overdue:\n   ตรวจสอบมาตรการที่เลยกำหนด อัปเดตผลงาน หรือขยาย Target Date หากมีเหตุผลจำเป็น',
      '3. อัปเดตด่วนใน Excel Grid:\n   ใช้โหมดตารางเพื่อบันทึกความคืบหน้า Action to Control และกดบันทึกแบบ Batch ทีเดียว',
      '4. ปิดความเสี่ยงที่สำเร็จ:\n   เปลี่ยนสถานะเป็น "Closed" เพื่อสะท้อนคะแนน Residual และรักษาประวัติความก้าวหน้าโครงการ'
    ];
    slide.addText(routine.join('\n\n'), {
      x: 1.05, y: 2.16, w: 5.22, h: 3.40,
      fontSize: 9.8, fontFace: THEME.fonts.body, color: THEME.colors.charcoal,
      lineSpacingMultiple: 1.18, valign: 'top'
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: 1.05, y: 5.76, w: 5.22, h: 0.78,
      fill: { color: 'EFF6FF' },
      line: { color: 'BFDBFE', width: 1 }
    });
    slide.addText('⏱️ สรุปคำแนะนำ: สละเวลาเพียง 5 นาทีต่อสัปดาห์ ช่วยให้ผู้บริหารเห็นสถานะจริง และป้องกันปัญหาต้นทุนบานปลายก่อนสายเกินแก้', {
      x: 1.20, y: 5.76, w: 4.92, h: 0.78,
      fontSize: 8.8, fontFace: THEME.fonts.body, color: '1E40AF', lineSpacingMultiple: 1.15, valign: 'middle'
    });

    // Right Card
    slide.addShape(pres.ShapeType.roundRect, {
      x: 6.81, y: 1.50, w: 5.72, h: 5.30,
      fill: { color: THEME.colors.cardBg },
      line: { color: THEME.colors.borderSlate, width: 1.2 }
    });
    slide.addShape(pres.ShapeType.rect, {
      x: 7.06, y: 1.62, w: 5.22, h: 0.05,
      fill: { color: THEME.colors.accentGreen },
      line: { color: THEME.colors.accentGreen }
    });
    slide.addText('📞 ช่องทางสนับสนุนและติดต่อช่วยเหลือ (Help & Support)', {
      x: 7.06, y: 1.76, w: 5.22, h: 0.35,
      fontSize: 13.5, fontFace: THEME.fonts.title, bold: true, color: THEME.colors.navyPrimary
    });

    const contact = [
      '🌐 เว็บแอปพลิเคชันใช้งานจริง:\n• www.gcmeapp.com/epopm (เข้าใช้งานได้ทั้ง PC, Tablet และ Smartphone)',
      '📖 คู่มือการใช้งานออนไลน์:\n• กดปุ่ม "Risk Guide / คู่มือ" บน Navbar เพื่ออ่านคู่มือแบบละเอียดทุกฟังก์ชัน',
      '🛡️ ติดต่อ Admin เพื่อขอสิทธิ์เข้าถึง:\n• หากต้องการ Assign โครงการใหม่ หรือเพิ่มบัญชีผู้ใช้งาน ให้แจ้ง Admin ทีมงาน E-PO-PM',
      '💡 สรุปหัวใจสำคัญ:\n"การบันทึกความเสี่ยงสม่ำเสมอ คือเกราะป้องกันต้นทุนบานปลาย และทำให้โครงการส่งมอบสำเร็จตามเป้าหมาย"'
    ];
    slide.addText(contact.join('\n\n'), {
      x: 7.06, y: 2.16, w: 5.22, h: 3.40,
      fontSize: 9.8, fontFace: THEME.fonts.body, color: THEME.colors.charcoal,
      lineSpacingMultiple: 1.18, valign: 'top'
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: 7.06, y: 5.76, w: 5.22, h: 0.78,
      fill: { color: 'F0FDF4' },
      line: { color: 'BBF7D0', width: 1 }
    });
    slide.addText('🎯 ทีมงานฝ่ายบริหารโครงการกลาง (E-PO-PM) พร้อมให้คำปรึกษา แนะนำการตั้งค่า และสนับสนุนการใช้งานทุกวันทำการผ่าน MS Teams และ Email', {
      x: 7.21, y: 5.76, w: 4.92, h: 0.78,
      fontSize: 8.8, fontFace: THEME.fonts.body, color: '166534', lineSpacingMultiple: 1.15, valign: 'middle'
    });
  }

  // Save presentation buffer
  const pptxBuffer = await pres.write({ outputType: 'nodebuffer' });

  // Ensure type="screen16x9" is explicitly written to ppt/presentation.xml for 100% PowerPoint UI compliance
  const zip = await JSZip.loadAsync(pptxBuffer);
  let presXml = await zip.file('ppt/presentation.xml').async('text');
  presXml = presXml.replace(/<p:sldSz[^>]*\/>/, '<p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>');
  zip.file('ppt/presentation.xml', presXml);
  const finalBuffer = await zip.generateAsync({ type: 'nodebuffer' });

  // Save to BOTH files
  const out1 = path.join(__dirname, 'ProRisk_Manager_AI_User_Guide.pptx');
  const out2 = path.join(__dirname, 'PRORISK_USER_GUIDE.pptx');

  fs.writeFileSync(out1, finalBuffer);
  console.log(`[SUCCESS] Wrote ${out1} (${finalBuffer.length} bytes)`);

  fs.writeFileSync(out2, finalBuffer);
  console.log(`[SUCCESS] Wrote ${out2} (${finalBuffer.length} bytes)`);
}

buildPresentation().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
