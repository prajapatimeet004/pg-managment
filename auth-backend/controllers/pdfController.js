const PDFDocument = require('pdfkit');

/**
 * Generates a rent payment receipt PDF using pdfkit.
 * Replaces the previous puppeteer/Chromium implementation to stay within
 * Render's 512 MB free-tier RAM limit (puppeteer used ~300 MB at runtime).
 */
exports.generateReceiptPDF = async (req, res, next) => {
  try {
    const { tenant, property, transaction } = req.body;

    if (!tenant || !transaction) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // ── Helpers ────────────────────────────────────────────────────────────
    const fmt = (n) =>
      `\u20B9${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    const fmtDate = (d) => {
      try {
        return new Date(d).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric',
        });
      } catch {
        return String(d);
      }
    };

    // ── Colours & constants ────────────────────────────────────────────────
    const PRIMARY   = '#4f46e5';
    const SECONDARY = '#0f172a';
    const MUTED     = '#64748b';
    const BORDER    = '#e2e8f0';
    const SUCCESS   = '#10b981';
    const WHITE     = '#ffffff';
    const PAGE_W    = 595.28;  // A4 pt
    const PAGE_H    = 841.89;
    const PAD       = 40;

    const doc = new PDFDocument({ size: 'A4', margin: 0, info: {
      Title: `Payment Receipt – ${transaction.receipt_number}`,
      Author: property?.name || tenant.property_name || 'PG Management',
    }});

    // ── Stream to response ─────────────────────────────────────────────────
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Receipt_${transaction.receipt_number}.pdf`,
    );
    doc.pipe(res);

    // ── Background dot pattern ─────────────────────────────────────────────
    doc.save();
    doc.rect(0, 0, PAGE_W, PAGE_H).fill('#f8fafc');
    doc.restore();

    // ── Outer card (white rounded rect) ────────────────────────────────────
    const CARD_X = PAD;
    const CARD_Y = PAD;
    const CARD_W = PAGE_W - PAD * 2;
    const CARD_H = PAGE_H - PAD * 2;
    doc.roundedRect(CARD_X, CARD_Y, CARD_W, CARD_H, 20)
       .fillAndStroke(WHITE, BORDER);

    let y = CARD_Y + 28;

    // ── Header ─────────────────────────────────────────────────────────────
    // Brand logo box
    doc.roundedRect(CARD_X + 24, y, 44, 44, 10)
       .fill(PRIMARY);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(14)
       .text('PG', CARD_X + 24, y + 14, { width: 44, align: 'center' });

    // Brand name
    const propertyName = (property?.name || tenant.property_name || 'PREMIUM PG').toUpperCase();
    doc.fillColor(SECONDARY).font('Helvetica-Bold').fontSize(13)
       .text(propertyName, CARD_X + 76, y + 2, { width: CARD_W - 200 });
    doc.fillColor(MUTED).font('Helvetica').fontSize(8)
       .text('ADVANCED MANAGEMENT HUB', CARD_X + 76, y + 20, { width: CARD_W - 200, characterSpacing: 1.5 });

    // Receipt title (right-aligned)
    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(28)
       .text('RECEIPT', CARD_X + CARD_W - 170, y, { width: 145, align: 'right' });
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(9)
       .text(`NO: ${transaction.receipt_number}`, CARD_X + CARD_W - 170, y + 34, { width: 145, align: 'right' });

    y += 60;

    // Divider
    doc.moveTo(CARD_X + 24, y).lineTo(CARD_X + CARD_W - 24, y)
       .strokeColor(BORDER).lineWidth(1).stroke();
    y += 16;

    // ── Info grid (Tenant | Property) ──────────────────────────────────────
    const COL_W = (CARD_W - 48 - 16) / 2;
    const COL1_X = CARD_X + 24;
    const COL2_X = COL1_X + COL_W + 16;
    const BOX_H  = 100;

    // Tenant box
    doc.roundedRect(COL1_X, y, COL_W, BOX_H, 10).fillAndStroke('#f8fafc', BORDER);
    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(7.5)
       .text('TENANT DETAILS (PAID BY)', COL1_X + 12, y + 12, { characterSpacing: 1.5 });
    doc.fillColor(SECONDARY).font('Helvetica-Bold').fontSize(13)
       .text(tenant.name, COL1_X + 12, y + 26, { width: COL_W - 24 });
    doc.fillColor(MUTED).font('Helvetica').fontSize(9)
       .text(`Phone: ${tenant.phone}`, COL1_X + 12, y + 46)
       .text(`Email: ${tenant.email}`, COL1_X + 12, y + 59)
       .text(`Aadhar: ${tenant.aadhar_number || 'N/A'}`, COL1_X + 12, y + 72);

    // Property box
    doc.roundedRect(COL2_X, y, COL_W, BOX_H, 10).fillAndStroke('#f8fafc', BORDER);
    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(7.5)
       .text('PROPERTY REFERENCE', COL2_X + 12, y + 12, { characterSpacing: 1.5 });
    doc.fillColor(SECONDARY).font('Helvetica-Bold').fontSize(12)
       .text(property?.name || tenant.property_name || 'N/A', COL2_X + 12, y + 26, { width: COL_W - 24 });
    doc.fillColor(MUTED).font('Helvetica').fontSize(9)
       .text(`Unit ${tenant.room_number} • Bed ${tenant.bed_number}`, COL2_X + 12, y + 46)
       .text(property?.address || 'Property Address Reference', COL2_X + 12, y + 59, { width: COL_W - 24 });
    // Payment Successful badge
    doc.roundedRect(COL2_X + 12, y + 76, 120, 16, 8).fill('#dcfce7');
    doc.fillColor('#166534').font('Helvetica-Bold').fontSize(7.5)
       .text('✓  PAYMENT SUCCESSFUL', COL2_X + 18, y + 80, { characterSpacing: 0.5 });

    y += BOX_H + 14;

    // ── Transaction meta row ────────────────────────────────────────────────
    const META_H = 50;
    doc.roundedRect(COL1_X, y, CARD_W - 48, META_H, 10).fillAndStroke('#f8fafc', BORDER);
    const thirdW = (CARD_W - 48) / 3;

    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(7.5)
       .text('TRANSACTION DATE', COL1_X + 14, y + 10, { characterSpacing: 1 });
    doc.fillColor(SECONDARY).font('Helvetica-Bold').fontSize(11)
       .text(fmtDate(transaction.paid_date), COL1_X + 14, y + 24);

    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(7.5)
       .text('METHOD', COL1_X + thirdW + 14, y + 10, { characterSpacing: 1 });
    doc.fillColor(SECONDARY).font('Helvetica-Bold').fontSize(11)
       .text(transaction.payment_mode, COL1_X + thirdW + 14, y + 24);

    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(7.5)
       .text('CURRENCY', COL1_X + thirdW * 2 + 14, y + 10, { characterSpacing: 1 });
    doc.fillColor(SECONDARY).font('Helvetica-Bold').fontSize(11)
       .text('INR (\u20B9)', COL1_X + thirdW * 2 + 14, y + 24);

    y += META_H + 16;

    // ── Items table ────────────────────────────────────────────────────────
    const TABLE_W = CARD_W - 48;
    const TH_H    = 30;
    const ROW_H   = 44;

    // Table header
    doc.roundedRect(COL1_X, y, TABLE_W, TH_H, 6).fill(SECONDARY);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8.5)
       .text('DESCRIPTION', COL1_X + 14, y + 10, { characterSpacing: 1 });
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8.5)
       .text('AMOUNT', COL1_X + TABLE_W - 80, y + 10, { width: 66, align: 'right', characterSpacing: 1 });

    y += TH_H;

    // Row 1 – Monthly Rent
    doc.rect(COL1_X, y, TABLE_W, ROW_H).fillAndStroke(WHITE, BORDER);
    doc.fillColor(SECONDARY).font('Helvetica-Bold').fontSize(10)
       .text('Monthly Rent Payment', COL1_X + 14, y + 8);
    doc.fillColor(MUTED).font('Helvetica').fontSize(8.5)
       .text(`Service period for the month of ${transaction.month}`, COL1_X + 14, y + 24);
    doc.fillColor(SECONDARY).font('Helvetica-Bold').fontSize(12)
       .text(fmt(transaction.amount), COL1_X + TABLE_W - 90, y + 14, { width: 76, align: 'right' });

    y += ROW_H;

    // Row 2 – Security Deposit (optional)
    if (tenant.security_deposit) {
      doc.rect(COL1_X, y, TABLE_W, ROW_H).fillAndStroke('#fafafa', BORDER);
      doc.fillColor(SECONDARY).font('Helvetica-Bold').fontSize(10)
         .text('Security Deposit Reference', COL1_X + 14, y + 8);
      doc.fillColor(MUTED).font('Helvetica').fontSize(8.5)
         .text('One-time refundable deposit (Reference)', COL1_X + 14, y + 24);
      doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(12)
         .text(fmt(tenant.security_deposit), COL1_X + TABLE_W - 90, y + 14, { width: 76, align: 'right' });
      y += ROW_H;
    }

    y += 14;

    // ── Summary box (right-aligned dark card) ──────────────────────────────
    const SUM_W = 230;
    const SUM_X = COL1_X + TABLE_W - SUM_W;
    const SUM_H = 90;

    doc.roundedRect(SUM_X, y, SUM_W, SUM_H, 12).fill(SECONDARY);
    doc.fillColor(WHITE).font('Helvetica').fontSize(10)
       .text('Subtotal', SUM_X + 18, y + 14)
       .text(fmt(transaction.amount), SUM_X + SUM_W - 90, y + 14, { width: 72, align: 'right' });
    doc.fillColor(WHITE).font('Helvetica').fontSize(10)
       .text('Taxes & Fees', SUM_X + 18, y + 32)
       .text('\u20B90.00', SUM_X + SUM_W - 90, y + 32, { width: 72, align: 'right' });

    // Separator
    doc.moveTo(SUM_X + 18, y + 52).lineTo(SUM_X + SUM_W - 18, y + 52)
       .strokeColor('rgba(255,255,255,0.15)').lineWidth(0.5).stroke();

    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
       .text('Total Received', SUM_X + 18, y + 62);
    doc.fillColor('#818cf8').font('Helvetica-Bold').fontSize(16)
       .text(fmt(transaction.amount), SUM_X + SUM_W - 110, y + 56, { width: 92, align: 'right' });

    y += SUM_H + 16;

    // ── PAID stamp (diagonal watermark) ────────────────────────────────────
    doc.save();
    doc.translate(CARD_X + 130, PAGE_H - 160);
    doc.rotate(-12);
    doc.roundedRect(-4, -4, 148, 52, 6)
       .strokeColor(SUCCESS).lineWidth(4).stroke();
    doc.fillColor(SUCCESS).font('Helvetica-Bold').fontSize(38)
       .text('PAID', 0, 4, { width: 140, align: 'center', opacity: 0.15 });
    doc.restore();

    // ── Footer ─────────────────────────────────────────────────────────────
    const FOOTER_Y = CARD_Y + CARD_H - 56;
    doc.moveTo(CARD_X + 24, FOOTER_Y).lineTo(CARD_X + CARD_W - 24, FOOTER_Y)
       .strokeColor(BORDER).dash(4, { space: 4 }).lineWidth(1).stroke();
    doc.undash();

    doc.fillColor(SUCCESS).font('Helvetica-Bold').fontSize(8)
       .text('\u2611  SECURE DIGITAL RECEIPT', CARD_X + 24, FOOTER_Y + 10, { characterSpacing: 0.5 });
    doc.fillColor(MUTED).font('Helvetica').fontSize(8)
       .text(
         `This is a computer-generated document and does not require a physical signature for validity.  Property Manager: ${property?.manager || 'Management Hub'}`,
         CARD_X + 24, FOOTER_Y + 24, { width: CARD_W - 220 },
       );

    doc.fillColor('#cbd5e1').font('Helvetica-BoldOblique').fontSize(16)
       .text('Verified', CARD_X + CARD_W - 130, FOOTER_Y + 10, { width: 106, align: 'center' });
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(7.5)
       .text('AUTHORIZED RECEIPT', CARD_X + CARD_W - 130, FOOTER_Y + 32, { width: 106, align: 'center', characterSpacing: 0.8 });

    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error during PDF generation' });
    }
  }
};
