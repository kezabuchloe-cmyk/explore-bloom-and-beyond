const nodemailer = require('nodemailer');

let transporter;

function emailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (transporter) return transporter;
  if (!emailConfigured()) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const client = getTransporter();
  if (!client) {
    console.warn(`Email not configured. Skipped email to ${to}: ${subject}`);
    return { skipped: true };
  }
  return client.sendMail({
    from: process.env.EMAIL_FROM || 'Explore Bloom & Beyond <no-reply@example.com>',
    to,
    subject,
    text,
    html
  });
}

async function sendPasswordReset(to, fullName, resetUrl) {
  return sendMail({
    to,
    subject: 'Reset your Explore Bloom & Beyond password',
    text: `Hello ${fullName},\n\nUse this link within one hour to reset your password:\n${resetUrl}\n\nIf you did not request this, you can ignore the message.`,
    html: `<p>Hello ${escapeHtml(fullName)},</p><p>Use the button below within one hour to reset your password.</p><p><a href="${escapeAttribute(resetUrl)}" style="display:inline-block;padding:12px 18px;background:#166534;color:#fff;text-decoration:none;border-radius:8px">Reset Password</a></p><p>If you did not request this, you can ignore the message.</p>`
  });
}

async function sendBookingNotice(booking) {
  const ownerEmail = process.env.BOOKINGS_EMAIL;
  if (!ownerEmail) return { skipped: true };
  return sendMail({
    to: ownerEmail,
    subject: `New booking request ${booking.reference}`,
    text: `${booking.fullName} submitted ${booking.reference} for ${booking.tripTitle || booking.destination}. Phone: ${booking.phone}. Email: ${booking.email}.`,
    html: `<h2>New request ${escapeHtml(booking.reference)}</h2><p><strong>Traveler:</strong> ${escapeHtml(booking.fullName)}</p><p><strong>Trip:</strong> ${escapeHtml(booking.tripTitle || booking.destination)}</p><p><strong>Phone:</strong> ${escapeHtml(booking.phone)}</p><p><strong>Email:</strong> ${escapeHtml(booking.email)}</p>`
  });
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}
function escapeAttribute(value = '') {
  return escapeHtml(value);
}

module.exports = { emailConfigured, sendMail, sendPasswordReset, sendBookingNotice };
