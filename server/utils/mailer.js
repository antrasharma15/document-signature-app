const nodemailer = require("nodemailer");

// For development, we use Gmail.
// In production, swap this for SendGrid / Resend / AWS SES.
const transporter = nodemailer.createTransport({
  service: "gmail",
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

module.exports = { sendSigningLink };