const express = require("express");
const router = express.Router();
const AuditLog = require("../models/AuditLogs");
const Document = require("../models/Document");
const protect = require("../middleware/authMiddleware");

// GET /api/audit/:docId
// Returns full audit trail for a document — owner only
router.get("/:docId", protect, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    // Only the document owner can view the audit trail
    const ownerId = doc.uploadedBy || doc.userId;
    if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const logs = await AuditLog.find({ documentId: req.params.docId })
      .sort({ createdAt: 1 }); // oldest first — reads like a timeline

    res.status(200).json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch audit trail", error: err.message });
  }
});

module.exports = router;
