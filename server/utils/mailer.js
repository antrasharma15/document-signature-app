const nodemailer = require("nodemailer");

// For development, we use Gmail.
// In production, swap this for SendGrid / Resend / AWS SES.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: process.env.SMTP_SECURE === "true" || (!process.env.SMTP_SECURE && (process.env.SMTP_PORT === "465" || !process.env.SMTP_PORT)),
  family: parseInt(process.env.SMTP_FAMILY || "4", 10),
  auth: {
    user: process.env.EMAIL_USER,   // your gmail address
    pass: process.env.EMAIL_PASS,   // gmail app password (not your login password)
  },
});

const sendSigningLink = async (toEmail, signingUrl, documentName) => {
  const mailOptions = {
    from: `"DocSign App" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `You have a document to sign: ${documentName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px;">
        <h2>Document Signature Request</h2>
        <p>You've been requested to sign <strong>${documentName}</strong>.</p>
        <p>Click the button below to review and sign the document:</p>
        <a href="${signingUrl}" 
           style="display:inline-block; padding:12px 24px; background:#4F46E5;
                  color:white; border-radius:6px; text-decoration:none;">
          Review & Sign
        </a>
        <p style="color:#888; font-size:12px; margin-top:20px;">
          This link expires in 48 hours.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendVerificationEmail = async (toEmail, verifyUrl, name) => {
  const mailOptions = {
    from: `"EASYsign" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Verify your EASYsign account",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
        <div style="background: #3D4127; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h2 style="color: white; margin: 0; font-size: 20px;">Verify your email</h2>
        </div>
        <div style="background: #f9f9f7; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e5e0;">
          <p style="color: #3D4127; font-size: 15px;">Hi ${name},</p>
          <p style="color: #555; font-size: 14px; line-height: 1.6;">
            Thanks for creating an EASYsign account. Click the button below to verify
            your email address. This link expires in <strong>24 hours</strong>.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}"
               style="display: inline-block; background: #3D4127; color: white;
                      padding: 14px 32px; border-radius: 8px; text-decoration: none;
                      font-weight: 600; font-size: 15px;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">
            If you didn't create an account, you can safely ignore this email.
            This link will expire after 24 hours.
          </p>
        </div>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (toEmail, resetUrl, name) => {
  const mailOptions = {
    from: `"EASYsign" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Reset your EASYsign password",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
        <div style="background: #3D4127; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h2 style="color: white; margin: 0; font-size: 20px;">Reset your password</h2>
        </div>
        <div style="background: #f9f9f7; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e5e0;">
          <p style="color: #3D4127; font-size: 15px;">Hi ${name},</p>
          <p style="color: #555; font-size: 14px; line-height: 1.6;">
            We received a request to reset your password. Click the button below
            to choose a new one. This link expires in <strong>15 minutes</strong>.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}"
               style="display: inline-block; background: #3D4127; color: white;
                      padding: 14px 32px; border-radius: 8px; text-decoration: none;
                      font-weight: 600; font-size: 15px;">
              Reset Password
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">
            If you didn't request a password reset, you can safely ignore this email.
            Your password will not change. This link expires in 15 minutes.
          </p>
        </div>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { sendSigningLink, sendVerificationEmail, sendPasswordResetEmail };