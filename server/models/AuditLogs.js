const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
    required: true,
  },
  action: {
    type: String,
    enum: [
      "DOCUMENT_UPLOADED",
      "SIGNING_LINK_SENT",
      "DOCUMENT_VIEWED",       // signer opened the link
      "DOCUMENT_SIGNED",
      "DOCUMENT_REJECTED",
      "SIGNED_PDF_DOWNLOADED",
    ],
    required: true,
  },
  performedBy: {
    type: String,              // email or user ID — works for both auth users and external signers
    required: true,
  },
  ipAddress: {
    type: String,
    default: "unknown",
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,  // any extra info — e.g. signerEmail, page number
    default: {},
  },
}, { timestamps: true });   // createdAt is your timestamp — no need for a separate field

module.exports = mongoose.model("AuditLog", auditLogSchema);