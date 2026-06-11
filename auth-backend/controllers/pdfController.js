const puppeteer = require('puppeteer');

exports.generateReceiptPDF = async (req, res, next) => {
  try {
    const { tenant, property, transaction } = req.body;

    if (!tenant || !transaction) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Payment Receipt - ${transaction.receipt_number}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        
        :root {
          --primary: #4f46e5;
          --primary-light: #eef2ff;
          --secondary: #0f172a;
          --text-main: #1e293b;
          --text-muted: #64748b;
          --border: #e2e8f0;
          --success: #10b981;
        }

        body {
          font-family: 'Outfit', sans-serif;
          margin: 0;
          padding: 0;
          background-color: #ffffff;
          color: var(--text-main);
          -webkit-print-color-adjust: exact;
        }
        
        .page {
          width: 210mm;
          height: 297mm;
          margin: 0 auto;
          padding: 10mm;
          box-sizing: border-box;
          position: relative;
          background-image: radial-gradient(var(--primary-light) 0.5px, transparent 0.5px);
          background-size: 20px 20px;
          overflow: hidden;
        }
        
        .receipt-card {
          background: white;
          border-radius: 24px;
          border: 1px solid var(--border);
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          padding: 25px;
          height: 100%;
          box-sizing: border-box;
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
 
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }
 
        .brand {
          display: flex;
          align-items: center;
          gap: 15px;
        }
 
        .brand-logo {
          width: 45px;
          height: 45px;
          background: linear-gradient(135deg, var(--primary), #818cf8);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }
 
        .brand-info h1 {
          font-size: 20px;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.02em;
          color: var(--secondary);
        }
 
        .brand-info p {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 2px 0 0 0;
        }
 
        .invoice-meta {
          text-align: right;
        }
 
        .invoice-type {
          font-size: 30px;
          font-weight: 900;
          color: var(--primary);
          margin: 0;
          letter-spacing: -0.04em;
          line-height: 1;
        }
 
        .invoice-number {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-muted);
          margin-top: 6px;
        }
 
        .grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 25px;
          margin-bottom: 20px;
        }
 
        .box {
          background-color: #f8fafc;
          border-radius: 20px;
          padding: 16px 20px;
          border: 1px solid var(--border);
        }
 
        .box-label {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--primary);
          margin-bottom: 8px;
          display: block;
        }
 
        .bill-to-name {
          font-size: 18px;
          font-weight: 800;
          margin: 0 0 6px 0;
          color: var(--secondary);
        }
 
        .bill-to-info {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted);
          line-height: 1.5;
        }
 
        .property-box {
          text-align: right;
        }
 
        .property-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--secondary);
          margin-bottom: 4px;
        }
 
        .payment-status {
          margin-top: 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #dcfce7;
          color: #166534;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
        }
 
        .items-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin-bottom: 20px;
        }
 
        .items-table th {
          text-align: left;
          padding: 12px 20px;
          background: var(--secondary);
          color: white;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
 
        .items-table th:first-child { border-radius: 12px 0 0 12px; }
        .items-table th:last-child { border-radius: 0 12px 12px 0; text-align: right; }
 
        .items-table td {
          padding: 12px 20px;
          border-bottom: 1px solid var(--border);
          font-size: 13px;
        }
 
        .item-desc {
          font-weight: 600;
          color: var(--secondary);
        }
 
        .item-sub {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
        }
 
        .item-amount {
          text-align: right;
          font-weight: 700;
          font-size: 15px;
        }
 
        .summary-container {
          display: flex;
          justify-content: flex-end;
        }
 
        .summary-box {
          width: 260px;
          background: var(--secondary);
          color: white;
          border-radius: 20px;
          padding: 18px 22px;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
        }
 
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 12px;
          font-weight: 500;
          opacity: 0.8;
        }
 
        .summary-total {
          display: flex;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid rgba(255,255,255,0.1);
          margin-top: 5px;
        }
 
        .summary-total span:first-child {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
        }
 
        .summary-total span:last-child {
          font-size: 20px;
          font-weight: 800;
          color: #818cf8;
        }
 
        .paid-stamp {
          position: absolute;
          bottom: 80px;
          left: 60px;
          border: 6px double var(--success);
          color: var(--success);
          padding: 10px 30px;
          border-radius: 12px;
          font-size: 40px;
          font-weight: 900;
          text-transform: uppercase;
          transform: rotate(-12deg);
          opacity: 0.2;
          pointer-events: none;
        }
 
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px dashed var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
 
        .footer-left {
          font-size: 10px;
          color: var(--text-muted);
          max-width: 300px;
          line-height: 1.5;
        }
 
        .footer-left b { color: var(--secondary); }
 
        .auth-sign {
          text-align: center;
        }
 
        .sign-img {
          height: 40px;
          margin-bottom: 5px;
          opacity: 0.6;
        }
 
        .sign-label {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.1em;
        }
 
        .verified-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 9px;
          font-weight: 700;
          color: var(--success);
          margin-bottom: 8px;
          text-transform: uppercase;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="receipt-card">
          <div class="header">
            <div class="brand">
              <div class="brand-logo">PG</div>
              <div class="brand-info">
                <h1>${(property?.name || tenant.property_name || 'Premium PG').toUpperCase()}</h1>
                <p>Advanced Management Hub</p>
              </div>
            </div>
            <div class="invoice-meta">
              <h2 class="invoice-type">RECEIPT</h2>
              <p class="invoice-number">NO: ${transaction.receipt_number}</p>
            </div>
          </div>

          <div class="grid">
            <div class="box">
              <span class="box-label">Tenant Details (Paid By)</span>
              <h3 class="bill-to-name">${tenant.name}</h3>
              <div class="bill-to-info">
                <p style="margin: 4px 0;">Phone: ${tenant.phone}</p>
                <p style="margin: 4px 0;">Email: ${tenant.email}</p>
                <p style="margin: 12px 0 0 0; font-family: monospace;">Aadhar: ${tenant.aadhar_number || 'N/A'}</p>
              </div>
            </div>
            <div class="box property-box">
              <span class="box-label">Property Reference</span>
              <div class="property-title">${property?.name || tenant.property_name}</div>
              <div class="bill-to-info">
                Unit ${tenant.room_number} • Bed ${tenant.bed_number}<br>
                ${property?.address || 'Property Address Reference'}
              </div>
              <div class="payment-status">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Payment Successful
              </div>
            </div>
          </div>

          <div class="box" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
             <div>
                <span class="box-label">Transaction Date</span>
                <div style="font-weight: 700; font-size: 15px;">${new Date(transaction.paid_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
             </div>
             <div style="text-align: center;">
                <span class="box-label">Method</span>
                <div style="font-weight: 700; font-size: 15px;">${transaction.payment_mode}</div>
             </div>
             <div style="text-align: right;">
                <span class="box-label">Currency</span>
                <div style="font-weight: 700; font-size: 15px;">INR (₹)</div>
             </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div class="item-desc">Monthly Rent Payment</div>
                  <div class="item-sub">Service period for the month of ${transaction.month}</div>
                </td>
                <td class="item-amount">₹${transaction.amount.toLocaleString('en-IN')}</td>
              </tr>
              ${tenant.security_deposit ? `
              <tr>
                <td>
                  <div class="item-desc">Security Deposit Reference</div>
                  <div class="item-sub">One-time refundable deposit (Reference)</div>
                </td>
                <td class="item-amount">₹${tenant.security_deposit.toLocaleString('en-IN')}</td>
              </tr>
              ` : ''}
            </tbody>
          </table>

          <div class="summary-container">
            <div class="summary-box">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>₹${transaction.amount.toLocaleString('en-IN')}</span>
              </div>
              <div class="summary-row">
                <span>Taxes & Fees</span>
                <span>₹0.00</span>
              </div>
              <div class="summary-total">
                <span>Total Received</span>
                <span>₹${transaction.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div class="paid-stamp">PAID</div>

          <div class="footer">
            <div class="footer-left">
              <div class="verified-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                Secure Digital Receipt
              </div>
              <p>This is a computer-generated document and does not require a physical signature for validity. <b>Property Manager:</b> ${property?.manager || 'Management Hub'}</p>
            </div>
            <div class="auth-sign">
               <div style="font-size: 20px; font-weight: 900; color: #cbd5e1; margin-bottom: 5px; font-style: italic;">Verified</div>
               <div class="sign-label">Authorized Receipt</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      pageRanges: '1',
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    });

    await browser.close();

    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt_${transaction.receipt_number}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Internal server error during PDF generation' });
  }
};
