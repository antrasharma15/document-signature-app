/**
 * server/utils/sendEmail.js
 * Reusable email sender using Nodemailer + Gmail
 */

const nodemailer = require("nodemailer");

// ── Create reusable transporter ───────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
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

/**
 * sendEmail({ to, subject, html })
 *
 * @param {string} to      - recipient email address
 * @param {string} subject - email subject line
 * @param {string} html    - HTML body of the email
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"DocSign App" <${process.env.EMAIL_USER}>`,
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