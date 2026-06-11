/**
 * server/routes/docs.js
 * Day 7 update — send email to signer when document is uploaded
 *
 * Only the upload (POST) route is shown below.
 * Merge this logic into your existing docs route file.
 */

const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const path     = require("path");
const Document = require("../models/Document");
const User     = require("../models/User");
const protect  = require("../middleware/authMiddleware");
const sendEmail = require("../utils/SendEmail");
const { documentUploadedEmail } = require("../utils/EmailTemplates");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ── Multer config (same as your existing setup) ───────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename:    (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/docs/upload
// Upload a PDF and notify the signer by email
// Body (multipart/form-data):
//   file        — the PDF file
//   signerEmail — email of the person who needs to sign
// ─────────────────────────────────────────────────────────────────────────────
router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { signerEmail } = req.body;

    // Save document record
    const document = await Document.create({
      originalName: req.file.originalname,
      filename:     req.file.filename,
      filePath:     req.file.path,
      uploadedBy:   req.user._id,
      fileSize:     req.file.size,
      signerEmail:  signerEmail || null,
    });

    // ── Send email to signer if provided ─────────────────────────────────────
    if (signerEmail) {
      // Try to find signer in DB for their name, else use email
      const signer    = await User.findOne({ email: signerEmail });
      const signUrl   = `${CLIENT_URL}/editor/${document._id}`;

      await sendEmail({
        to:      signerEmail,
        subject: `📄 New document for your signature — ${req.file.originalname}`,
        html:    documentUploadedEmail({
          signerName:   signer?.name || signerEmail,
          uploaderName: req.user.name,
          documentName: req.file.originalname,
          signUrl,
        }),
      });
    }

    res.status(201).json({
      success:  true,
      document: {
        _id:          document._id,
        originalName: document.originalName,
        filename:     document.filename,
        uploadedBy:   req.user.name,
        createdAt:    document.createdAt,
      },
    });
  } catch (err) {
    console.error("POST /api/docs/upload error:", err);
    res.status(500).json({ message: "Server error uploading document" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/docs  — fetch all docs for logged-in user (unchanged)
// GET /api/docs/:id — fetch single doc (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const docs = await Document.find({ uploadedBy: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, documents: docs });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", protect, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    res.json({ success: true, document: doc });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;