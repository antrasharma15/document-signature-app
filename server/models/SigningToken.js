const mongoose = require("mongoose");

const signingTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
    required: true,
  },
  signerEmail: {
    type: String,
    required: true,
  },
  used: {
    type: Boolean,
    default: false, // becomes true after signer submits
  },
  expiresAt: {
    type: Date,
    required: true,   // token dies after 48 hours
  },
}, { timestamps: true });

module.exports = mongoose.model("SigningToken", signingTokenSchema);