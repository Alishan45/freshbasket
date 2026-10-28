import nodemailer from 'nodemailer';

// FreshBasket Official Gmail SMTP Transporter
// Configured with user provided credentials
const SMTP_USER = 'muzammilshabbircs01@gmail.com';
const SMTP_PASS = 'wammuovhcuqhawan'; // Google App Password (16 chars without spaces)

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

// Verify connection on startup
transporter.verify((err) => {
  if (err) {
    console.warn('⚠️ SMTP Transporter Warning:', err.message);
  } else {
    console.log('✅ FreshBasket SMTP Email Service Active & Ready (muzammilshabbircs01@gmail.com)');
  }
});

/**
 * Generate FreshBasket Signature Branded HTML Email Template
 */
function wrapInFreshBasketTemplate({ title, preheader, contentHtml, ticketNumber }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f7f6f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #292524; }
    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e7e5e4; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #15803d 0%, #166534 100%); padding: 32px 30px; text-align: center; color: #ffffff; }
    .brand { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
    .brand span { color: #86efac; }
    .tagline { font-size: 12px; color: #dcfce7; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-top: 6px; }
    .content { padding: 36px 32px; }
    .ticket-badge { display: inline-block; background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 9999px; margin-bottom: 20px; font-family: monospace; }
    h1 { font-size: 22px; font-weight: 800; color: #1c1917; margin-top: 0; margin-bottom: 14px; }
    p { font-size: 14px; line-height: 1.6; color: #44403c; margin: 0 0 16px 0; }
    .info-box { background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 14px; padding: 18px 20px; margin: 22px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f5f5f4; font-size: 13px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #78716c; font-weight: 600; }
    .info-val { color: #1c1917; font-weight: 700; text-align: right; }
    .message-quote { background-color: #fefce8; border-left: 4px solid #eab308; padding: 14px 18px; border-radius: 0 12px 12px 0; margin: 20px 0; font-size: 13px; color: #713f12; font-style: italic; }
    .cta-btn { display: inline-block; background-color: #16a34a; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 12px; margin-top: 10px; }
    .footer { background-color: #fafaf9; border-top: 1px solid #f5f5f4; padding: 24px 30px; text-align: center; font-size: 12px; color: #a8a29e; }
    .footer a { color: #16a34a; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader || title}
  </div>
  <div class="container">
    <div class="header">
      <div class="brand">🌱 Fresh<span>Basket</span></div>
      <div class="tagline">Farm-Fresh Quality & Customer Care</div>
    </div>
    <div class="content">
      ${ticketNumber ? `<div class="ticket-badge">Ticket Reference: #${ticketNumber}</div>` : ''}
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin-bottom: 8px;">FreshBasket Online Grocery Marketplace • Farm-to-Fork Quality Guaranteed</p>
      <p style="margin-bottom: 8px;">Supervisor: Muhammad Hassaan (m.hassaan@vu.edu.pk) • Final Project Group F26PROJECT56E94 (BC250206138)</p>
      <p style="margin: 0;">Need immediate help? Reply to this email or write to <a href="mailto:${SMTP_USER}">${SMTP_USER}</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send Customer Complaint Acknowledgment Email
 */
export async function sendComplaintCustomerConfirmation({
  customerName,
  customerEmail,
  ticketNumber,
  orderNumber,
  category,
  subject,
  message
}) {
  const title = `We've Received Your Complaint [#${ticketNumber}] — FreshBasket Support`;
  const preheader = `Your ticket #${ticketNumber} has been logged. Our Quality Assurance team is reviewing it.`;

  const contentHtml = `
    <h1>Thank You for Contacting FreshBasket, ${customerName}</h1>
    <p>
      We are truly sorry to hear that your experience with our fresh produce or delivery did not meet our 100% Quality Assurance standards. Your dispute has been assigned to our Duty Supervisor and Quality Inspection Team.
    </p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Ticket ID:</span>
        <span class="info-val">#${ticketNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Category:</span>
        <span class="info-val">${category || 'Freshness & Quality'}</span>
      </div>
      ${orderNumber ? `
      <div class="info-row">
        <span class="info-label">Order Reference:</span>
        <span class="info-val">${orderNumber}</span>
      </div>` : ''}
      <div class="info-row">
        <span class="info-label">Status:</span>
        <span class="info-val" style="color:#2563eb;">In Review (Quality QA)</span>
      </div>
      <div class="info-row">
        <span class="info-label">Target Resolution:</span>
        <span class="info-val" style="color:#16a34a;">Within 2-4 Hours</span>
      </div>
    </div>

    <p style="font-weight: 700; color: #1c1917; margin-bottom: 6px;">Your Complaint Summary:</p>
    <div class="message-quote">
      <strong>"${subject}"</strong><br/>
      ${message}
    </div>

    <p>
      <strong>Our 100% Doorstep Freshness Guarantee:</strong> If your produce arrived damaged, bruised, or unsatisfactory, our policy covers a free doorstep replacement or instant wallet/COD refund voucher.
    </p>

    <p style="margin-top: 24px;">
      You can reply directly to this email if you have additional photos or batch codes to share.
    </p>
  `;

  const html = wrapInFreshBasketTemplate({
    title,
    preheader,
    contentHtml,
    ticketNumber
  });

  return transporter.sendMail({
    from: `"FreshBasket Quality Care" <${SMTP_USER}>`,
    to: customerEmail,
    replyTo: SMTP_USER,
    subject: `[Ticket #${ticketNumber}] We received your inquiry: ${subject}`,
    html
  });
}

/**
 * Send Notification to Support Team (muzammilshabbircs01@gmail.com)
 */
export async function sendComplaintAdminNotification({
  customerName,
  customerEmail,
  customerPhone,
  ticketNumber,
  orderNumber,
  category,
  subject,
  message,
  attachmentUrl
}) {
  const contentHtml = `
    <h1 style="color:#dc2626;">🚨 New Customer Dispute Logged</h1>
    <p>A customer has filed a quality dispute or inquiry requiring supervisor resolution.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Ticket Reference:</span>
        <span class="info-val" style="color:#dc2626;">#${ticketNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Customer Name:</span>
        <span class="info-val">${customerName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email:</span>
        <span class="info-val">${customerEmail}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Phone:</span>
        <span class="info-val">${customerPhone || 'Not provided'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Order Number:</span>
        <span class="info-val">${orderNumber || 'General produce complaint'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Category:</span>
        <span class="info-val">${category}</span>
      </div>
      ${attachmentUrl ? `
      <div class="info-row">
        <span class="info-label">Evidence / Photo:</span>
        <span class="info-val"><a href="${attachmentUrl}" target="_blank">View Evidence Photo</a></span>
      </div>` : ''}
    </div>

    <p style="font-weight: 700; color: #1c1917;">Customer's Message:</p>
    <div class="message-quote">
      <strong>"${subject}"</strong><br/>
      ${message}
    </div>

    <p>
      <em>Note: You can click "Reply" directly in your email client to reply to <strong>${customerEmail}</strong>, or resolve this ticket in the FreshBasket Admin Portal.</em>
    </p>
  `;

  const html = wrapInFreshBasketTemplate({
    title: `[ALERT] New Complaint #${ticketNumber}: ${subject}`,
    preheader: `Customer ${customerName} filed complaint #${ticketNumber}`,
    contentHtml,
    ticketNumber
  });

  return transporter.sendMail({
    from: `"FreshBasket Alert" <${SMTP_USER}>`,
    to: SMTP_USER, // sends to the provided support email
    replyTo: customerEmail, // so replying replies directly to customer!
    subject: `🚨 [Dispute #${ticketNumber}] ${category}: ${subject} (From: ${customerName})`,
    html
  });
}

/**
 * Send Official Resolution Email to Customer when Admin / Supervisor replies
 */
export async function sendComplaintResolutionEmail({
  customerName,
  customerEmail,
  ticketNumber,
  subject,
  adminReply,
  status = 'Resolved',
  adminName = 'FreshBasket Support Lead'
}) {
  const title = `[Resolution #${ticketNumber}] Update Regarding Your FreshBasket Complaint`;
  const preheader = `Your ticket #${ticketNumber} has been reviewed and updated: ${status}`;

  const contentHtml = `
    <h1>Official Dispute Resolution, ${customerName}</h1>
    <p>
      Our Quality Supervisor and Customer Care team have reviewed your complaint regarding <strong>"${subject}"</strong>. Here is our official resolution:
    </p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Ticket Reference:</span>
        <span class="info-val">#${ticketNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Current Status:</span>
        <span class="info-val" style="color:${status === 'Resolved' ? '#16a34a' : '#2563eb'};">${status}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Reviewed By:</span>
        <span class="info-val">${adminName}</span>
      </div>
    </div>

    <p style="font-weight: 700; color: #1c1917;">Supervisor Decision & Resolution:</p>
    <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 18px 20px; border-radius: 0 12px 12px 0; margin: 18px 0; font-size: 14px; color: #14532d; line-height: 1.6;">
      ${adminReply.replace(/\n/g, '<br/>')}
    </div>

    <p>
      We value your trust and strive to ensure every apple, mango, and leafy bunch delivered to your doorstep meets the highest standards. If you are satisfied with this resolution, no further action is required.
    </p>
    <p>
      If you need further assistance, simply reply directly to this email to continue the conversation with our support manager.
    </p>
  `;

  const html = wrapInFreshBasketTemplate({
    title,
    preheader,
    contentHtml,
    ticketNumber
  });

  return transporter.sendMail({
    from: `"FreshBasket Quality Care" <${SMTP_USER}>`,
    to: customerEmail,
    replyTo: SMTP_USER,
    subject: `[Resolved: Ticket #${ticketNumber}] ${subject} — FreshBasket Response`,
    html
  });
}
