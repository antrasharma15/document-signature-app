/**
 * server/routes/signatures.js
 * Signatures management and finalization routes
 */

const express   = require("express");
const router    = express.Router();
const { PDFDocument } = require("pdf-lib");
const fs        = require("fs");
const path      = require("path");
const Signature = require("../models/Signature");
const Document  = require("../models/Document");
const User      = require("../models/User");
const protect   = require("../middleware/authMiddleware");
const sendEmail = require("../utils/SendEmail");
const {
  signatureFieldPlacedEmail,
  documentSignedEmail,
} = require("../utils/EmailTemplates");
const { v4: uuidv4 } = require("uuid");
const SigningToken = require("../models/SigningToken");
const { sendSigningLink } = require("../utils/mailer");
const { logAudit } = require("../utils/audit");
const AuditLog = require("../models/AuditLog");
const validator = require("validator");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const getClientOrigin = (req) => {
  if (process.env.CLIENT_URL) return process.env.CLIENT_URL;
  const origin = req.get("origin");
  if (origin && origin !== "null") return origin;
  const referer = req.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch (_) {}
  }
  return CLIENT_URL;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/signatures
// Save signature field position + notify signer by email
// ─────────────────────────────────────────────────────────────────────────────
router.post("/", protect, async (req, res) => {
  try {
    const { fileId, x, y, page, width, height, signerEmail } = req.body;

    if (!fileId || x == null || y == null || !page) {
      return res.status(400).json({
        message: "fileId, x, y, and page are required",
      });
    }

    if (signerEmail && !validator.isEmail(signerEmail)) {
      return res.status(400).json({ message: "Invalid signer email address" });
    }

    // Create the signature field
    const signature = await Signature.create({
      fileId,
      signer: req.user._id,
      x,
      y,
      page,
      width:  width  || 150,
      height: height || 50,
    });

    await signature.populate("signer", "name email");

    // Fetch the document for context
    const document = await Document.findById(fileId);

    // ── Send email to signer ──────────────────────────────────────────────────
    // signerEmail can be passed in body, or fall back to the logged-in user
    const recipientEmail = signerEmail || signature.signer.email;
    const recipientName  = signature.signer.name || "User";
    const signUrl        = `${getClientOrigin(req)}/editor/${fileId}`;

    await sendEmail({
      to:      recipientEmail,
      subject: `✍️ Signature required — ${document?.originalName || "Document"}`,
      html:    signatureFieldPlacedEmail({
        signerName:   recipientName,
        documentName: document?.originalName || "Document",
        page,
        signUrl,
      }),
    });

    res.status(201).json({ success: true, signature });
  } catch (err) {
    console.error("POST /api/signatures error:", err);
    res.status(500).json({ message: "Server error saving signature" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/signatures/:fileId
// ─────────────────────────────────────────────────────────────────────────────
router.get("/:fileId", protect, async (req, res) => {
  try {
    const signatures = await Signature.find({ fileId: req.params.fileId })
      .populate("signer", "name email")
      .sort({ createdAt: 1 });

    res.json({ success: true, signatures });
  } catch (err) {
    console.error("GET /api/signatures/:fileId error:", err);
    res.status(500).json({ message: "Server error fetching signatures" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/signatures/:id/sign
// PUT or PATCH /api/signatures/:id/sign
// Mark a signature as signed + save signature image + notify document owner
// ─────────────────────────────────────────────────────────────────────────────
const handleSign = async (req, res) => {
  try {
    const sig = await Signature.findById(req.params.id)
      .populate("signer",  "name email")
      .populate("fileId");

    if (!sig) {
      return res.status(404).json({ message: "Signature not found" });
    }

    if (sig.signer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorised to sign this field" });
    }

    // Update status
    sig.status   = "signed";
    sig.signedAt = new Date();
    sig.signatureImage = req.body.signatureImage; // Save signature image
    await sig.save();

    // Audit the signing event
    await logAudit({
      documentId: sig.fileId._id || sig.fileId,
      action: "DOCUMENT_SIGNED",
      performedBy: req.user.email,
      ipAddress: req.ip,
      metadata: { page: sig.page, x: sig.x, y: sig.y },
    });

    // Fetch document owner and update document status if all signatures are signed
    const document = await Document.findById(sig.fileId).populate("uploadedBy", "name email");
    
    const allSigs = await Signature.find({ fileId: sig.fileId });
    const allSigned = allSigs.every(s => s.status === "signed");
    if (allSigned && document) {
      document.status = "signed";
      await document.save();
    }

    const owner    = document?.uploadedBy;
    const viewUrl  = `${getClientOrigin(req)}/editor/${sig.fileId}`;

    if (owner) {
      await sendEmail({
        to:      owner.email,
        subject: `✅ Document signed — ${document?.originalName || "Document"}`,
        html:    documentSignedEmail({
          ownerName:    owner.name,
          signerName:   sig.signer.name,
          documentName: document?.originalName || "Document",
          viewUrl,
        }),
      });
    }

    res.json({ success: true, signature: sig });
  } catch (err) {
    console.error("Sign route error:", err);
    res.status(500).json({ message: "Server error signing document" });
  }
};

router.put("/:id/sign", protect, handleSign);
router.patch("/:id/sign", protect, handleSign);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/signatures/:id
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/:id", protect, async (req, res) => {
  try {
    const sig = await Signature.findById(req.params.id);

    if (!sig) return res.status(404).json({ message: "Signature not found" });

    if (sig.signer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorised" });
    }

    if (sig.status !== "pending") {
      return res.status(400).json({ message: "Only pending fields can be removed" });
    }

    await sig.deleteOne();

    // Update parent document status based on remaining signatures
    const document = await Document.findById(sig.fileId);
    if (document) {
      const allSigs = await Signature.find({ fileId: sig.fileId });
      if (allSigs.length > 0) {
        const allSigned = allSigs.every(s => s.status === "signed");
        if (allSigned) {
          document.status = "signed";
        } else {
          document.status = "pending";
        }
      } else {
        document.status = "pending";
      }
      await document.save();
    }

    res.json({ success: true, message: "Signature field removed" });
  } catch (err) {
    console.error("DELETE /api/signatures/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/signatures/finalize/:docId
// ─────────────────────────────────────────────────────────────────────────────
router.post("/finalize/:docId", protect, async (req, res) => {
  try {
    // 1. Find the document
    const doc = await Document.findById(req.params.docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    // 2. Find all signatures for this document (database field is fileId)
    const signatures = await Signature.find({ fileId: req.params.docId });
    if (!signatures.length) {
      return res.status(400).json({ message: "No signatures found for this document" });
    }

    // 3. Read the original PDF
    let existingPdfBytes;
    if (doc.fileData) {
      existingPdfBytes = Buffer.from(doc.fileData, "base64");
    } else {
      const pdfPath = path.resolve(doc.filePath);
      if (!fs.existsSync(pdfPath)) {
        return res.status(404).json({ message: "Original PDF file not found on disk" });
      }
      existingPdfBytes = fs.readFileSync(pdfPath);
    }

    // 4. Load it into pdf-lib
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // 5. Loop over each signature and embed it
    for (const sig of signatures) {
      if (!sig.signatureImage) continue; // skip if no image saved

      // sig.signatureImage is like: "data:image/png;base64,iVBORw0..."
      // We need to strip the prefix and get raw base64
      const base64Data = sig.signatureImage.split(",")[1];
      const imageBytes = Buffer.from(base64Data, "base64");

      // Embed the image into the PDF document (support both PNG and JPG)
      const isJpg = sig.signatureImage.startsWith("data:image/jpeg") || sig.signatureImage.startsWith("data:image/jpg");
      let embeddedImage;
      if (isJpg) {
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
      } else {
        embeddedImage = await pdfDoc.embedPng(imageBytes);
      }

      // Get the page (sig.page is 1-indexed, pdf-lib pages array is 0-indexed)
      const pages = pdfDoc.getPages();
      const pageIndex = sig.page - 1;
      if (pageIndex < 0 || pageIndex >= pages.length) continue;

      const page = pages[pageIndex];
      const { width: pageWidth, height: pageHeight } = page.getSize();

      // The frontend editor renders the PDF at a width of 720px.
      // We scale the signature width & height proportionally relative to this base width.
      const refWidth = 720;
      const scale = pageWidth / refWidth;
      const sigWidth = (sig.width || 150) * scale;
      const sigHeight = (sig.height || 50) * scale;

      // Calculate the image's original dimensions and preserve aspect ratio (object-fit: contain)
      const imgWidth = embeddedImage.width;
      const imgHeight = embeddedImage.height;
      const boxRatio = sigWidth / sigHeight;
      const imgRatio = imgWidth / imgHeight;

      let drawWidth = sigWidth;
      let drawHeight = sigHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > boxRatio) {
        // Image is wider than the box
        drawWidth = sigWidth;
        drawHeight = sigWidth / imgRatio;
        offsetY = (sigHeight - drawHeight) / 2;
      } else {
        // Image is taller than the box
        drawHeight = sigHeight;
        drawWidth = sigHeight * imgRatio;
        offsetX = (sigWidth - drawWidth) / 2;
      }

      // Convert percentage coordinates (0-100) to actual PDF points
      const pdfX = ((sig.x / 100) * pageWidth) + offsetX;
      // Flip Y: PDF origin is bottom-left, database coordinates are percentage from top
      const pdfY = pageHeight - ((sig.y / 100) * pageHeight) - sigHeight + offsetY;

      // Draw the image on the page
      page.drawImage(embeddedImage, {
        x: pdfX,
        y: pdfY,
        width: drawWidth,
        height: drawHeight,
      });
    }

    // 6. Serialize the modified PDF to bytes
    const signedPdfBytes = await pdfDoc.save();

    // 7. Save base64 version to document in MongoDB
    doc.signedFileData = Buffer.from(signedPdfBytes).toString("base64");
    doc.status = "signed";
    await doc.save();

    // 8. Also save to disk as a fallback for local development
    const signedFilename = `signed_${doc.filename || doc.fileName}`;
    const signedFilePath = path.join("uploads", signedFilename);
    try {
      fs.writeFileSync(signedFilePath, signedPdfBytes);
    } catch (writeErr) {
      console.warn("Local signed file write skipped/failed:", writeErr.message);
    }

    // 9. Respond with the download URL
    res.status(200).json({
      message: "PDF signed successfully",
      signedFile: signedFilename,
      downloadUrl: `/api/signatures/download/${signedFilename}`,
    });
  } catch (err) {
    console.error("Finalize error:", err);
    res.status(500).json({ message: "Failed to generate signed PDF", error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/signatures/download/:filename
// ─────────────────────────────────────────────────────────────────────────────
router.get("/download/:filename", protect, async (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Security check: path traversal protection
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ message: "Invalid filename" });
    }

    // Setup headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    // Try serving signed PDF from DB first
    const coreFileName = filename.startsWith("signed_") ? filename.replace("signed_", "") : filename;
    const doc = await Document.findOne({ $or: [{ fileName: coreFileName }, { filename: coreFileName }] });

    if (doc && filename.startsWith("signed_") && doc.signedFileData) {
      const fileBytes = Buffer.from(doc.signedFileData, "base64");
      res.send(fileBytes);
    } else {
      // Fallback: stream file from local uploads directory
      const filePath = path.resolve("uploads", filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Signed file not found" });
      }
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }

    // Audit download action
    try {
      if (doc) {
        await logAudit({
          documentId: doc._id,
          action: "SIGNED_PDF_DOWNLOADED",
          performedBy: req.user.email,
          ipAddress: req.ip,
          metadata: { signedFilename: filename },
        });
      }
    } catch (auditErr) {
      console.error("Failed to log download audit:", auditErr.message);
    }
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ message: "Server error during download" });
  }
});

// POST /api/signatures/send/:docId
// Owner sends a signing request to an email
router.post("/send/:docId", protect, async (req, res) => {
  try {
    const { signerEmail } = req.body;
    if (!signerEmail)
      return res.status(400).json({ message: "Signer email is required" });
    if (!validator.isEmail(signerEmail))
      return res.status(400).json({ message: "Invalid signer email address" });

    // Find the document
    const doc = await Document.findById(req.params.docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    // Only the document owner can send signing requests
    const ownerId = doc.uploadedBy || doc.userId;
    if (!ownerId || ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    // Update document status to pending
    doc.status = "pending";
    doc.rejectionReason = null; // Reset rejection reason on resend
    await doc.save();

    // Generate a unique token
    const token = uuidv4(); // e.g. "f47ac10b-58cc-4372-a567-0e02b2c3d479"

    // Set expiry to 48 hours from now
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    // Save token to DB
    await SigningToken.create({
      token,
      documentId: doc._id,
      signerEmail,
      expiresAt,
    });

    // Build the public signing URL (no auth required on this route)
    const signingUrl = `${getClientOrigin(req)}/sign/${token}`;

    // Send the email
    await sendSigningLink(signerEmail, signingUrl, doc.originalName || doc.filename || doc.fileName);

    await logAudit({
      documentId: doc._id,
      action: "SIGNING_LINK_SENT",
      performedBy: req.user.email,
      ipAddress: req.ip,
      metadata: { signerEmail },
    });

    res.status(200).json({ message: `Signing link sent to ${signerEmail}` });
  } catch (err) {
    console.error("Send signing link error:", err);
    res.status(500).json({ message: "Failed to send signing link", error: err.message });
  }
});

// GET /api/signatures/sign/:token
// Validate public signing link and return document details
router.get("/sign/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const signingToken = await SigningToken.findOne({ token });

    if (!signingToken) {
      return res.status(404).json({ message: "Invalid signing link" });
    }

    if (signingToken.used) {
      return res.status(400).json({ message: "This signing link has already been used" });
    }

    if (signingToken.expiresAt < new Date()) {
      return res.status(400).json({ message: "This signing link has expired" });
    }

    const doc = await Document.findById(signingToken.documentId);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    await logAudit({
      documentId: signingToken.documentId._id || signingToken.documentId,
      action: "DOCUMENT_VIEWED",
      performedBy: signingToken.signerEmail,
      ipAddress: req.ip,
      metadata: { token: req.params.token },
    });

    const placeholders = await Signature.find({ fileId: doc._id }).populate("signer", "name email");

    res.json({
      success: true,
      documentId: doc._id,
      filename: doc.originalName || doc.filename,
      fileName: doc.fileName || doc.filename,
      fileUrl: `/uploads/${doc.fileName}`,
      signerEmail: signingToken.signerEmail,
      placeholders,
    });
  } catch (err) {
    console.error("Verify signing token error:", err);
    res.status(500).json({ message: "Verification failed", error: err.message });
  }
});

// POST /api/signatures/sign/:token
// Signer submits a signature using a public token
router.post("/sign/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { signatureImage, x, y, page } = req.body;

    if (!signatureImage) {
      return res.status(400).json({ message: "signatureImage is required" });
    }

    if (!req.body.signatureId && (x == null || y == null || !page)) {
      return res.status(400).json({ message: "signatureImage, x, y, and page are required for new placements" });
    }

    const signingToken = await SigningToken.findOne({ token });
    if (!signingToken) {
      return res.status(404).json({ message: "Invalid signing link" });
    }

    if (signingToken.used) {
      return res.status(400).json({ message: "This signing link has already been used" });
    }

    if (signingToken.expiresAt < new Date()) {
      return res.status(400).json({ message: "This signing link has expired" });
    }

    const doc = await Document.findById(signingToken.documentId);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    let sig;
    if (req.body.signatureId) {
      // Update the existing placeholder signature record
      sig = await Signature.findById(req.body.signatureId);
      if (!sig) {
        return res.status(404).json({ message: "Signature field placeholder not found" });
      }
      sig.status = "signed";
      sig.signatureImage = signatureImage;
      sig.signedAt = new Date();
      await sig.save();
    } else {
      // Fallback: Create a new signature entry in the database
      sig = await Signature.create({
        fileId: doc._id,
        x,
        y,
        page,
        status: "signed",
        signedAt: new Date(),
        signatureImage,
        signerEmail: signingToken.signerEmail,
      });
    }

    // Mark token as used
    signingToken.used = true;
    await signingToken.save();

    await logAudit({
      documentId: signingToken.documentId,
      action: "DOCUMENT_SIGNED",
      performedBy: signingToken.signerEmail,
      ipAddress: req.ip,
      metadata: { page: sig.page, x: sig.x, y: sig.y },
    });

    // Update parent document status to signed
    await Document.findByIdAndUpdate(signingToken.documentId, {
      status: "signed",
    });

    res.status(200).json({ success: true, message: "Signature submitted successfully", signature: sig });
  } catch (err) {
    console.error("Submit signature error:", err);
    res.status(500).json({ message: "Failed to submit signature", error: err.message });
  }
});

// POST /api/signatures/reject/:token
// Signer rejects the document — no auth needed
router.post("/reject/:token", async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: "Rejection reason is required" });

    const signingToken = await SigningToken.findOne({ token: req.params.token });

    if (!signingToken || signingToken.used)
      return res.status(410).json({ message: "Invalid or already used link" });

    if (new Date() > signingToken.expiresAt)
      return res.status(410).json({ message: "Link expired" });

    // Mark token as used
    signingToken.used = true;
    await signingToken.save();

    // Update document status and rejection reason
    await Document.findByIdAndUpdate(signingToken.documentId, {
      status: "rejected",
      rejectionReason: reason,
    });

    // Update signature status and rejection reason in signature placeholders
    await Signature.updateMany(
      { fileId: signingToken.documentId, signerEmail: signingToken.signerEmail },
      { status: "rejected", rejectionReason: reason }
    );

    // Log to audit trail
    await logAudit({
      documentId: signingToken.documentId,
      action: "DOCUMENT_REJECTED",
      performedBy: signingToken.signerEmail,
      ipAddress: req.ip,
      metadata: { reason },
    });

    res.status(200).json({ message: "Document rejected" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject document", error: err.message });
  }
});

module.exports = router;