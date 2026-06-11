/**
 * server/routes/signatures.js
 * Day 7 update — email notifications added to all routes
 */

const express   = require("express");
const router    = express.Router();
const Signature = require("../models/Signature");
const Document  = require("../models/Document");   // your existing Document model
const User      = require("../models/User");        // your existing User model
const protect   = require("../middleware/authMiddleware");
const sendEmail = require("../utils/SendEmail");
const {
  signatureFieldPlacedEmail,
  documentSignedEmail,
} = require("../utils/EmailTemplates");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

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
    const signUrl        = `${CLIENT_URL}/editor/${fileId}`;

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

    // Fetch document owner and update document status if all signatures are signed
    const document = await Document.findById(sig.fileId).populate("uploadedBy", "name email");
    
    const allSigs = await Signature.find({ fileId: sig.fileId });
    const allSigned = allSigs.every(s => s.status === "signed");
    if (allSigned && document) {
      document.status = "signed";
      await document.save();
    }

    const owner    = document?.uploadedBy;
    const viewUrl  = `${CLIENT_URL}/editor/${sig.fileId}`;

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

module.exports = router;