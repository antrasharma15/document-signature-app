const express   = require("express");
const router    = express.Router();
const Signature = require("../models/Signature");
const protect   = require("../middleware/authMiddleware"); // your existing JWT middleware

// ─────────────────────────────────────────────────────────────
// POST /api/signatures
// Save where a signature should be placed on a PDF page
// ─────────────────────────────────────────────────────────────
router.post("/", protect, async (req, res) => {
  try {
    const { fileId, x, y, page, width, height } = req.body;

    if (!fileId || x == null || y == null || !page) {
      return res.status(400).json({
        message: "fileId, x, y, and page are required",
      });
    }

    const signature = await Signature.create({
      fileId,
      signer: req.user.userId,   // injected by your auth middleware (req.user.userId)
      x,
      y,
      page,
      width:  width  || 150,
      height: height || 50,
    });

    // Populate signer name so the frontend can display it immediately
    await signature.populate("signer", "name email");

    res.status(201).json({ success: true, signature });
  } catch (err) {
    console.error("POST /api/signatures error:", err);
    res.status(500).json({ message: "Server error saving signature" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/signatures/:fileId
// Fetch all signature placeholders for a given document
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// DELETE /api/signatures/:id
// Remove a pending signature placeholder (owner only)
// ─────────────────────────────────────────────────────────────
router.delete("/:id", protect, async (req, res) => {
  try {
    const sig = await Signature.findById(req.params.id);

    if (!sig) {
      return res.status(404).json({ message: "Signature not found" });
    }

    // Only the signer who placed it can remove it
    if (sig.signer.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "Not authorised to remove this signature" });
    }

    // Only pending placeholders can be removed
    if (sig.status !== "pending") {
      return res.status(400).json({ message: "Only pending placeholders can be removed" });
    }

    await sig.deleteOne();
    res.json({ success: true, message: "Signature placeholder removed" });
  } catch (err) {
    console.error("DELETE /api/signatures/:id error:", err);
    res.status(500).json({ message: "Server error deleting signature" });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/signatures/:id/sign
// Apply a signature image to the placeholder and update status to signed
// ─────────────────────────────────────────────────────────────
router.put("/:id/sign", protect, async (req, res) => {
  try {
    const { signatureImage } = req.body;

    if (!signatureImage) {
      return res.status(400).json({ message: "Signature image is required" });
    }

    const sig = await Signature.findById(req.params.id);

    if (!sig) {
      return res.status(404).json({ message: "Signature not found" });
    }

    // Only the assigned signer can sign it
    if (sig.signer.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "Not authorised to sign this placeholder" });
    }

    // Can only sign pending placeholders
    if (sig.status !== "pending") {
      return res.status(400).json({ message: "This placeholder has already been signed or rejected" });
    }

    sig.status = "signed";
    sig.signatureImage = signatureImage;
    sig.signedAt = new Date();

    await sig.save();

    // Check if there are any other pending placeholders for this document
    const pendingSigs = await Signature.find({
      fileId: sig.fileId,
      status: "pending"
    });

    if (pendingSigs.length === 0) {
      const Document = require("../models/Document");
      await Document.findByIdAndUpdate(sig.fileId, { status: "signed" });
    }

    // Populate signer details so the frontend has them
    await sig.populate("signer", "name email");

    res.json({ success: true, signature: sig });
  } catch (err) {
    console.error("PUT /api/signatures/:id/sign error:", err);
    res.status(500).json({ message: "Server error signing document" });
  }
});

module.exports = router;
