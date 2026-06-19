/**
 * server/utils/sendEmail.js
 * Reusable email sender using Nodemailer + Gmail
 */

const nodemailer = require("nodemailer");

// ── Create reusable transporter (only if Resend is not configured) ─────────────
let transporter = null;
if (!process.env.RESEND_API_KEY) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "465", 10),
    secure: process.env.SMTP_SECURE === "true" || (!process.env.SMTP_SECURE && (process.env.SMTP_PORT === "465" || !process.env.SMTP_PORT)),
    family: parseInt(process.env.SMTP_FAMILY || "4", 10),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password (16 chars)
    },
  });

  // ── Verify connection on server start ─────────────────────────────────────────
  transporter.verify((error) => {
    if (error) {
      console.error(" Email transporter error:", error.message);
    } else {
      console.log(" Email transporter ready");
    }
  });
} else {
  console.log(" Email service: Resend HTTP API ready");
}

/**
 * sendEmail({ to, subject, html })
 *
 * @param {string} to      - recipient email address
 * @param {string} subject - email subject line
 * @param {string} html    - HTML body of the email
 */
const sendEmail = async ({ to, subject, html }) => {
  // 1. Try Resend HTTP API if configured
  if (process.env.RESEND_API_KEY) {
    try {
      const from = process.env.EMAIL_FROM || "onboarding@resend.dev";
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          html,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      console.log(` Email sent to ${to} via Resend — MessageId: ${data.id}`);
      return { success: true };
    } catch (error) {
      console.error(" Failed to send email via Resend:", error.message);
      return { success: false, error: error.message };
    }
  }

  // 2. Fallback to Nodemailer SMTP
  try {
    if (!transporter) {
      throw new Error("Transporter not initialized");
    }
    const from = process.env.EMAIL_FROM || `"DocSign App" <${process.env.EMAIL_USER}>`;
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log(` Email sent to ${to} — MessageId: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error(" Failed to send email:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;