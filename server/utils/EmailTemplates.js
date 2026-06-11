/**
 * server/utils/emailTemplates.js
 * Clean HTML email templates for all notification types
 */

// ── Base wrapper (shared layout for all emails) ───────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>DocSign Notification</title>
</head>
<body style="
  margin: 0; padding: 0;
  background-color: #F3F4F6;
  font-family: 'Segoe UI', Arial, sans-serif;
">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        ">

          <!-- Header -->
          <tr>
            <td style="
              background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
              padding: 28px 36px;
              text-align: center;
            ">
              <div style="font-size: 26px; margin-bottom: 4px;">📄✍️</div>
              <div style="
                font-size: 22px;
                font-weight: 700;
                color: #ffffff;
                letter-spacing: -0.3px;
              ">DocSign</div>
              <div style="font-size: 12px; color: #BFDBFE; margin-top: 2px;">
                Document Signature Platform
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="
              background: #F9FAFB;
              border-top: 1px solid #E5E7EB;
              padding: 18px 36px;
              text-align: center;
            ">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                This is an automated notification from DocSign App.<br/>
                Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ── Helper: CTA button ────────────────────────────────────────────────────────
const ctaButton = (text, url) => `
  <div style="text-align: center; margin: 28px 0 8px;">
    <a href="${url}" style="
      display: inline-block;
      background: #2563EB;
      color: #ffffff;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 13px 32px;
      border-radius: 8px;
      letter-spacing: 0.2px;
    ">${text}</a>
  </div>
`;

// ── Helper: info row ──────────────────────────────────────────────────────────
const infoRow = (label, value) => `
  <tr>
    <td style="
      padding: 8px 0;
      font-size: 13px;
      color: #6B7280;
      border-bottom: 1px solid #F3F4F6;
      width: 140px;
      font-weight: 600;
    ">${label}</td>
    <td style="
      padding: 8px 0;
      font-size: 13px;
      color: #111827;
      border-bottom: 1px solid #F3F4F6;
    ">${value}</td>
  </tr>
`;

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 1 — Document Uploaded (notify signer they need to sign)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @param {string} signerName     - name of the person who needs to sign
 * @param {string} uploaderName   - name of the person who uploaded
 * @param {string} documentName   - name of the PDF file
 * @param {string} signUrl        - direct link to the signing page
 */
const documentUploadedEmail = ({ signerName, uploaderName, documentName, signUrl }) =>
  baseTemplate(`
    <h2 style="margin: 0 0 8px; font-size: 20px; color: #111827; font-weight: 700;">
      You have a document to sign
    </h2>
    <p style="margin: 0 0 24px; font-size: 14px; color: #6B7280; line-height: 1.6;">
      Hi <strong>${signerName}</strong>, <strong>${uploaderName}</strong> has sent you
      a document that requires your signature.
    </p>

    <!-- Document info card -->
    <div style="
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 24px;
    ">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow("📄 Document", documentName)}
        ${infoRow("👤 Sent by",  uploaderName)}
        ${infoRow("📅 Date",     new Date().toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" }))}
        ${infoRow("🔖 Status",   "Awaiting Your Signature")}
      </table>
    </div>

    <!-- Alert box -->
    <div style="
      background: #EFF6FF;
      border-left: 4px solid #2563EB;
      border-radius: 4px;
      padding: 12px 16px;
      margin-bottom: 24px;
      font-size: 13px;
      color: #1D4ED8;
    ">
      ⏳ Please review and sign this document at your earliest convenience.
    </div>

    ${ctaButton("Review & Sign Document", signUrl)}

    <p style="text-align:center; font-size: 12px; color: #9CA3AF; margin-top: 12px;">
      If the button doesn't work, copy this link:<br/>
      <a href="${signUrl}" style="color:#2563EB;">${signUrl}</a>
    </p>
  `);

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 2 — Signature Field Placed (remind signer to complete signing)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @param {string} signerName    - name of the signer
 * @param {string} documentName  - name of the PDF
 * @param {number} page          - page number where field was placed
 * @param {string} signUrl       - direct link to sign
 */
const signatureFieldPlacedEmail = ({ signerName, documentName, page, signUrl }) =>
  baseTemplate(`
    <h2 style="margin: 0 0 8px; font-size: 20px; color: #111827; font-weight: 700;">
      Your signature is needed
    </h2>
    <p style="margin: 0 0 24px; font-size: 14px; color: #6B7280; line-height: 1.6;">
      Hi <strong>${signerName}</strong>, a signature field has been added to a document
      waiting for you. Here are the details:
    </p>

    <div style="
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 24px;
    ">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow("📄 Document", documentName)}
        ${infoRow("📃 Page",     `Page ${page}`)}
        ${infoRow("🔖 Status",   "Pending Signature")}
      </table>
    </div>

    <div style="
      background: #FFF7ED;
      border-left: 4px solid #F59E0B;
      border-radius: 4px;
      padding: 12px 16px;
      margin-bottom: 24px;
      font-size: 13px;
      color: #92400E;
    ">
      ✍️ Open the document and click on the signature field to complete signing.
    </div>

    ${ctaButton("Sign Now", signUrl)}

    <p style="text-align:center; font-size: 12px; color: #9CA3AF; margin-top: 12px;">
      If the button doesn't work, copy this link:<br/>
      <a href="${signUrl}" style="color:#2563EB;">${signUrl}</a>
    </p>
  `);

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 3 — Document Signed (notify the document owner)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @param {string} ownerName     - document owner's name
 * @param {string} signerName    - name of who signed
 * @param {string} documentName  - name of the PDF
 * @param {string} viewUrl       - link to view the signed document
 */
const documentSignedEmail = ({ ownerName, signerName, documentName, viewUrl }) =>
  baseTemplate(`
    <h2 style="margin: 0 0 8px; font-size: 20px; color: #111827; font-weight: 700;">
      Your document has been signed ✅
    </h2>
    <p style="margin: 0 0 24px; font-size: 14px; color: #6B7280; line-height: 1.6;">
      Hi <strong>${ownerName}</strong>, great news!
      <strong>${signerName}</strong> has signed your document.
    </p>

    <div style="
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 24px;
    ">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow("📄 Document", documentName)}
        ${infoRow("✍️ Signed by", signerName)}
        ${infoRow("📅 Signed on", new Date().toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" }))}
        ${infoRow("🔖 Status",    "Signed")}
      </table>
    </div>

    <div style="
      background: #F0FDF4;
      border-left: 4px solid #22C55E;
      border-radius: 4px;
      padding: 12px 16px;
      margin-bottom: 24px;
      font-size: 13px;
      color: #15803D;
    ">
      🎉 The signed document is ready for you to download or share.
    </div>

    ${ctaButton("View Signed Document", viewUrl)}

    <p style="text-align:center; font-size: 12px; color: #9CA3AF; margin-top: 12px;">
      If the button doesn't work, copy this link:<br/>
      <a href="${viewUrl}" style="color:#2563EB;">${viewUrl}</a>
    </p>
  `);

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  documentUploadedEmail,
  signatureFieldPlacedEmail,
  documentSignedEmail,
};