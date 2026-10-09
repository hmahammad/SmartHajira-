import QRCode from 'qrcode';

/**
 * Dedicated Safe Print Utility for Iframe and Standalone Environments
 * Bypasses iframe restrictions and dark-mode CSS clipping by generating a clean, dedicated printable document.
 */

export async function getQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 250,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (err) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(text)}`;
  }
}

export function printHtmlContent(html: string, documentTitle: string = 'স্মার্ট প্রিন্ট'): void {
  try {
    // 1. First attempt: Dedicated window.open for desktop browsers & new tab
    const printWindow = window.open('', '_blank', 'width=950,height=850,menubar=no,toolbar=no,location=no,status=no');
    if (printWindow && !printWindow.closed) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      const triggerPrint = () => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (e) {
          console.warn('Popup print exception, falling back to window.print():', e);
        }
      };

      if (printWindow.document.readyState === 'complete') {
        setTimeout(triggerPrint, 350);
      } else {
        printWindow.onload = () => setTimeout(triggerPrint, 350);
      }
      return;
    }

    // 2. Fallback: Sandboxed iframe approach inside the current DOM (for embedded iframes)
    const iframe = document.createElement('iframe');
    iframe.name = 'print_frame_' + Date.now();
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '100px';
    iframe.style.height = '100px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0.01';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      // Give time for images and fonts to render
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.error('Error during iframe printing, triggering fallback:', err);
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 5000);
        }
      }, 500);
    } else {
      window.print();
    }
  } catch (error) {
    console.error('Failed to trigger print:', error);
    window.print();
  }
}

/**
 * Generate Printable Smart ID Card HTML
 */
export function generateSingleIdCardHtml(
  student: {
    id: string;
    nameBangla: string;
    nameEnglish?: string;
    roll: string;
    className: string;
    designation?: string;
    guardianPhone?: string;
    parentPhone?: string;
    nidNumber?: string;
    bloodGroup?: string;
    photoUrl?: string;
    faceImage?: string;
  },
  companyName: string = 'স্মার্ট প্রতিষ্ঠান',
  categoryName: string = 'প্রতিষ্ঠান'
): string {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(student.id || student.roll)}`;
  const photo = student.photoUrl || student.faceImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
  const phone = student.guardianPhone || student.parentPhone || '01700-000000';

  return `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>${student.nameBangla} - স্মার্ট আইডি কার্ড</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700;800&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      font-family: 'Hind Siliguri', sans-serif, -apple-system;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }

    .print-sheet {
      display: flex;
      flex-wrap: wrap;
      gap: 25px;
      justify-content: center;
      align-items: center;
    }

    /* Standard CR80 PVC Card Proportion (54mm x 86mm portrait) */
    .id-card {
      width: 250px;
      height: 390px;
      background: #ffffff;
      border-radius: 16px;
      border: 1.5px solid #cbd5e1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      page-break-inside: avoid;
    }

    .card-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 12px 10px 10px;
      text-align: center;
      position: relative;
      border-bottom: 3px solid #10b981;
    }

    .card-header h2 {
      font-size: 13px;
      font-weight: 800;
      margin: 0;
      color: #ffffff;
      line-height: 1.2;
    }

    .card-header span {
      font-size: 9px;
      color: #34d399;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: block;
      margin-top: 2px;
    }

    .card-body {
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      background: radial-gradient(circle at center, #ffffff 0%, #f8fafc 100%);
    }

    .photo-frame {
      width: 78px;
      height: 78px;
      border-radius: 50%;
      border: 3px solid #10b981;
      overflow: hidden;
      margin-bottom: 8px;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
      background: #e2e8f0;
    }

    .photo-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .member-name {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      text-align: center;
      line-height: 1.2;
      margin-bottom: 2px;
    }

    .member-designation {
      font-size: 11px;
      font-weight: 700;
      color: #059669;
      text-align: center;
      margin-bottom: 8px;
    }

    .info-table {
      width: 100%;
      font-size: 10.5px;
      border-collapse: collapse;
      margin-bottom: 10px;
    }

    .info-table td {
      padding: 2.5px 0;
      color: #334155;
    }

    .info-table td.label {
      font-weight: 700;
      color: #64748b;
      width: 45%;
    }

    .info-table td.val {
      font-weight: 700;
      color: #0f172a;
      text-align: right;
    }

    .qr-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      background: #f1f5f9;
      padding: 6px 10px;
      border-radius: 10px;
      border: 1px dashed #cbd5e1;
      margin-top: auto;
    }

    .qr-image {
      width: 45px;
      height: 45px;
      border-radius: 6px;
      background: #ffffff;
      padding: 2px;
      border: 1px solid #e2e8f0;
    }

    .qr-text {
      text-align: right;
      font-size: 8.5px;
      color: #64748b;
      line-height: 1.3;
    }

    .qr-text strong {
      color: #0f172a;
      display: block;
      font-size: 9.5px;
    }

    .card-footer {
      background: #0f172a;
      color: #94a3b8;
      text-align: center;
      padding: 5px;
      font-size: 8px;
      font-weight: 600;
      border-top: 1px solid #1e293b;
    }

    /* Back of the Card */
    .id-card-back {
      width: 250px;
      height: 390px;
      background: #ffffff;
      border-radius: 16px;
      border: 1.5px solid #cbd5e1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding: 16px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      page-break-inside: avoid;
    }

    .back-title {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2px solid #10b981;
      padding-bottom: 4px;
      margin-bottom: 10px;
      text-align: center;
    }

    .rules-list {
      font-size: 9.5px;
      color: #475569;
      line-height: 1.5;
      padding-left: 14px;
      margin-bottom: 12px;
      flex: 1;
    }

    .sign-box {
      border-top: 1px dashed #94a3b8;
      margin-top: auto;
      padding-top: 5px;
      text-align: center;
      font-size: 9px;
      font-weight: 700;
      color: #0f172a;
    }
  </style>
</head>
<body>

  <div class="print-sheet">
    
    <!-- FRONT OF CARD -->
    <div class="id-card">
      <div class="card-header">
        <h2>${companyName}</h2>
        <span>${categoryName} ডিজিটাল পরিচয়পত্র</span>
      </div>

      <div class="card-body">
        <div class="photo-frame">
          <img src="${photo}" alt="${student.nameBangla}" />
        </div>

        <div class="member-name">${student.nameBangla}</div>
        <div class="member-designation">${student.designation || student.className || 'সদস্য'}</div>

        <table class="info-table">
          <tr>
            <td class="label">আইডি / রোল নং:</td>
            <td class="val" style="color: #059669; font-family: monospace; font-size: 12px;">${student.roll}</td>
          </tr>
          <tr>
            <td class="label">বিভাগ / পদবী:</td>
            <td class="val">${student.className || student.designation || 'জেনারেল'}</td>
          </tr>
          <tr>
            <td class="label">জরুরী মোবাইল:</td>
            <td class="val" style="font-family: monospace;">${phone}</td>
          </tr>
          ${student.bloodGroup ? `
          <tr>
            <td class="label">রক্তের গ্রুপ:</td>
            <td class="val" style="color: #e11d48;">${student.bloodGroup}</td>
          </tr>` : ''}
        </table>

        <div class="qr-container">
          <img class="qr-image" src="${qrUrl}" alt="QR" />
          <div class="qr-text">
            <strong>স্মার্ট ফেস ও কিউআর আইডি</strong>
            হাজিরা স্ক্যানারে স্ক্যানযোগ্য
          </div>
        </div>
      </div>

      <div class="card-footer">
        স্মার্ট এআই হাজিরা সিস্টেম • সার্বক্ষণিক বৈধ
      </div>
    </div>

    <!-- BACK OF CARD -->
    <div class="id-card-back">
      <div class="back-title">জরুরী নির্দেশনা ও নিয়মাবলী</div>
      
      <ol class="rules-list">
        <li>এই পরিচিতি কার্ডটি সংশ্লিষ্ট প্রতিষ্ঠানের নিজস্ব সম্পত্তি।</li>
        <li>প্রতিষ্ঠান প্রাঙ্গণে অবস্থানকালীন কার্ডটি প্রদর্শন করা বাধ্যতামূলক।</li>
        <li>কার্ডটি হস্তান্তরযোগ্য নয় এবং অপব্যবহার সম্পূর্ণ নিষিদ্ধ।</li>
        <li>কার্ড হারিয়ে গেলে অবিলম্বে কর্তৃপক্ষকে অবগত করুন।</li>
        <li>কার্ড পাওয়া গেলে নিকটস্থ কর্তৃপক্ষের কাছে জমা দিন।</li>
      </ol>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; font-size: 9px; margin-bottom: 12px;">
        <strong style="color: #0f172a; display: block; margin-bottom: 2px;">প্রতিষ্ঠান যোগাযোগ:</strong>
        মোবাইল: 01700-000000<br/>
        ইমেইল: info@smartenterprise.bd
      </div>

      <div class="sign-box">
        কর্তৃপক্ষের অনুমোদন ও স্বাক্ষর
      </div>
    </div>

  </div>

</body>
</html>
`;
}

/**
 * Generate Batch Printable HTML for ALL Members (A4 Multiple Cards Sheet)
 */
export function generateBatchIdCardsHtml(
  students: Array<{
    id: string;
    nameBangla: string;
    roll: string;
    className: string;
    designation?: string;
    guardianPhone?: string;
    bloodGroup?: string;
    photoUrl?: string;
    faceImage?: string;
  }>,
  companyName: string = 'স্মার্ট প্রতিষ্ঠান',
  categoryName: string = 'প্রতিষ্ঠান'
): string {
  const cardsHtml = students.map((student) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(student.id || student.roll)}`;
    const photo = student.photoUrl || student.faceImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

    return `
    <div class="id-card">
      <div class="card-header">
        <h2>${companyName}</h2>
        <span>${categoryName} পরিচয়পত্র</span>
      </div>

      <div class="card-body">
        <div class="photo-frame">
          <img src="${photo}" alt="${student.nameBangla}" />
        </div>

        <div class="member-name">${student.nameBangla}</div>
        <div class="member-designation">${student.designation || student.className || 'সদস্য'}</div>

        <table class="info-table">
          <tr>
            <td class="label">আইডি / রোল:</td>
            <td class="val" style="color: #059669; font-family: monospace; font-size: 11px;">${student.roll}</td>
          </tr>
          <tr>
            <td class="label">মোবাইল:</td>
            <td class="val" style="font-family: monospace;">${student.guardianPhone || '01700-000000'}</td>
          </tr>
        </table>

        <div class="qr-container">
          <img class="qr-image" src="${qrUrl}" alt="QR" />
          <div class="qr-text">
            <strong>স্মার্ট কিউআর আইডি</strong>
            হাজিরা স্ক্যানারে বৈধ
          </div>
        </div>
      </div>

      <div class="card-footer">
        স্মার্ট এআই হাজিরা সিস্টেম
      </div>
    </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>সকল আইডি কার্ড প্রিন্ট (${students.length} জন)</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700;800&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      font-family: 'Hind Siliguri', sans-serif;
      background: #ffffff;
      padding: 10px;
    }

    .grid-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      justify-items: center;
    }

    .id-card {
      width: 240px;
      height: 360px;
      background: #ffffff;
      border-radius: 14px;
      border: 1.5px solid #cbd5e1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      page-break-inside: avoid;
      break-inside: avoid;
      margin-bottom: 10px;
    }

    .card-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 10px 8px;
      text-align: center;
      border-bottom: 2.5px solid #10b981;
    }

    .card-header h2 {
      font-size: 12px;
      font-weight: 800;
      color: #ffffff;
    }

    .card-header span {
      font-size: 8px;
      color: #34d399;
      font-weight: 700;
      text-transform: uppercase;
      display: block;
    }

    .card-body {
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
    }

    .photo-frame {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      border: 2.5px solid #10b981;
      overflow: hidden;
      margin-bottom: 6px;
      background: #e2e8f0;
    }

    .photo-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .member-name {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      text-align: center;
    }

    .member-designation {
      font-size: 10px;
      font-weight: 700;
      color: #059669;
      text-align: center;
      margin-bottom: 6px;
    }

    .info-table {
      width: 100%;
      font-size: 9.5px;
      border-collapse: collapse;
      margin-bottom: 6px;
    }

    .info-table td {
      padding: 1.5px 0;
    }

    .info-table td.label {
      font-weight: 700;
      color: #64748b;
    }

    .info-table td.val {
      font-weight: 700;
      color: #0f172a;
      text-align: right;
    }

    .qr-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      background: #f8fafc;
      padding: 4px 8px;
      border-radius: 8px;
      border: 1px dashed #cbd5e1;
      margin-top: auto;
    }

    .qr-image {
      width: 38px;
      height: 38px;
      background: #ffffff;
      padding: 2px;
    }

    .qr-text {
      text-align: right;
      font-size: 7.5px;
      color: #64748b;
    }

    .qr-text strong {
      color: #0f172a;
      display: block;
      font-size: 8.5px;
    }

    .card-footer {
      background: #0f172a;
      color: #94a3b8;
      text-align: center;
      padding: 4px;
      font-size: 7.5px;
    }
  </style>
</head>
<body>
  <div class="grid-container">
    ${cardsHtml}
  </div>
</body>
</html>
`;
}

/**
 * Generate Printable Noticeboard Attendance QR Poster HTML
 */
export function generateAttendanceQrPosterHtml(
  companyName: string = 'স্মার্ট প্রতিষ্ঠান',
  categoryName: string = 'প্রতিষ্ঠান',
  attendanceLink: string
): string {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(attendanceLink)}`;

  return `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>${companyName} - ডিজিটাল হাজিরা কিউআর কোড পোস্টার</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700;800;900&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      font-family: 'Hind Siliguri', sans-serif, -apple-system;
      background: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 10px;
    }

    .poster-card {
      width: 100%;
      max-width: 580px;
      border: 3px solid #0f172a;
      border-radius: 28px;
      padding: 32px 28px;
      text-align: center;
      background: #ffffff;
      position: relative;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
    }

    .header-badge {
      display: inline-block;
      background: #10b981;
      color: #ffffff;
      font-weight: 800;
      font-size: 13px;
      padding: 4px 16px;
      border-radius: 50px;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }

    .company-title {
      font-size: 26px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.2;
      margin-bottom: 4px;
    }

    .sub-title {
      font-size: 16px;
      font-weight: 700;
      color: #475569;
      margin-bottom: 22px;
    }

    .qr-frame {
      background: #f8fafc;
      border: 3px dashed #10b981;
      border-radius: 24px;
      padding: 20px;
      display: inline-block;
      margin-bottom: 22px;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.15);
    }

    .qr-image {
      width: 240px;
      height: 240px;
      display: block;
      border-radius: 12px;
    }

    .scan-guide {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      margin-bottom: 8px;
    }

    .instructions {
      background: #f1f5f9;
      border-radius: 16px;
      padding: 14px 18px;
      text-align: left;
      font-size: 13px;
      color: #334155;
      margin-bottom: 20px;
      line-height: 1.6;
    }

    .instructions ol {
      padding-left: 20px;
    }

    .instructions li {
      margin-bottom: 4px;
      font-weight: 600;
    }

    .link-box {
      font-family: monospace;
      font-size: 11px;
      background: #e2e8f0;
      color: #0f172a;
      padding: 8px 12px;
      border-radius: 10px;
      word-break: break-all;
      font-weight: 700;
    }

    .footer-note {
      font-size: 11px;
      color: #64748b;
      font-weight: 700;
      margin-top: 15px;
    }
  </style>
</head>
<body>

  <div class="poster-card">
    <div class="header-badge">${categoryName} ডিজিটাল উপস্থিতি সিস্টেম</div>
    <h1 class="company-title">${companyName}</h1>
    <p class="sub-title">স্মার্ট ফেস ও বায়োমেট্রিক হাজিরা কিউআর কোড</p>

    <div class="qr-frame">
      <img class="qr-image" src="${qrUrl}" alt="হাজিরা কিউআর কোড" />
    </div>

    <div class="scan-guide">
      📱 আপনার স্মার্টফোনের ক্যামেরা দিয়ে স্ক্যান করুন
    </div>

    <div class="instructions">
      <ol>
        <li>মোবাইলের ক্যামেরা ওপেন করে সরাসরি এই QR কোডটি স্ক্যান করুন।</li>
        <li>স্ক্রিনে প্রদর্শিত লিংকে ট্যাপ করুন।</li>
        <li>ক্যামেরায় আপনার মুখ দেখালেই স্বয়ংক্রিয়ভাবে প্রবেশ/বাহির হাজিরা সাবমিট হয়ে যাবে।</li>
      </ol>
    </div>

    <div class="link-box">
      সরাসরি ওয়েব লিংক: ${attendanceLink}
    </div>

    <div class="footer-note">
      * ক্লাউড সিঙ্ক ও এআই ফেস ভেরিফিকেশন সক্রিয় • প্রক্সি বা ভূয়া হাজিরা গ্রহণযোগ্য নয়
    </div>
  </div>

</body>
</html>
`;
}

/**
 * Generate Printable Member Attendance History Statement HTML
 */
export function generateAttendanceStatementHtml(
  student: {
    nameBangla: string;
    roll: string;
    className: string;
    designation?: string;
  },
  companyName: string = 'স্মার্ট প্রতিষ্ঠান',
  records: Array<{
    date: string;
    entryTime?: string;
    exitTime?: string;
    time?: string;
    status: string;
    method?: string;
    notes?: string;
  }>
): string {
  const rows = records.map((r, i) => `
    <tr>
      <td style="text-align: center; font-mono;">${i + 1}</td>
      <td style="font-weight: bold; font-mono;">${r.date}</td>
      <td style="font-mono; color: #059669;">${r.entryTime || r.time || '-'}</td>
      <td style="font-mono; color: #2563eb;">${r.exitTime || '-'}</td>
      <td style="font-weight: bold;">${r.status === 'Present' ? 'উপস্থিত' : r.status === 'Late' ? 'বিলম্ব' : 'অনুপস্থিত'}</td>
      <td>${r.method || 'Face AI'}</td>
      <td>${r.notes || '-'}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>${student.nameBangla} - উপস্থিতি বিবরণী রিপোর্ট</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700;800&display=swap');
    @page { size: A4 portrait; margin: 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Hind Siliguri', sans-serif; padding: 20px; color: #0f172a; }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
    .header h1 { font-size: 20px; font-weight: 800; }
    .header p { font-size: 13px; color: #475569; }
    .meta-box { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
    th { background: #0f172a; color: white; padding: 8px 6px; text-align: left; }
    td { padding: 6px 6px; border-bottom: 1px solid #e2e8f0; }
    .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${companyName}</h1>
    <p>সদস্য ডিজিটাল উপস্থিতি ইতিহাস বিবরণী</p>
  </div>
  <div class="meta-box">
    <div><strong>নাম:</strong> ${student.nameBangla}</div>
    <div><strong>আইডি:</strong> ${student.roll}</div>
    <div><strong>পদবী/বিভাগ:</strong> ${student.designation || student.className}</div>
    <div><strong>তারিখ:</strong> ${new Date().toLocaleDateString('bn-BD')}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 30px; text-align: center;">#</th>
        <th>তারিখ</th>
        <th>প্রবেশ সময়</th>
        <th>প্রস্থান সময়</th>
        <th>স্ট্যাটাস</th>
        <th>পদ্ধতি</th>
        <th>মন্তব্য</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <div class="footer">
    <div>স্মার্ট বায়োমেট্রিক হাজিরা সিস্টেম দ্বারা স্বয়ংক্রিয়ভাবে মুদ্রিত</div>
    <div>কর্তৃপক্ষের স্বাক্ষর ____________________</div>
  </div>
</body>
</html>
  `;
}
