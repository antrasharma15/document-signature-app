const mongoose = require("mongoose");

const signatureSchema = new mongoose.Schema(
  {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    signer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Coordinates stored as percentages (0–100) so they scale across screen sizes
    x: { type: Number, required: true }, // % from left of page
    y: { type: Number, required: true }, // % from top of page
    page: { type: Number, required: true, default: 1 }, // which PDF page
    width: { type: Number, default: 150 },  // px width of signature box
    height: { type: Number, default: 50 },  // px height of signature box
    status: {
      type: String,
      enum: ["pending", "signed", "rejected"],
      default: "pending",
    },
    signedAt: { type: Date },
    signatureImage: { type: String }, // base64 or URL of drawn signature (Day 8)
  },
  { timestamps: true }
);

module.exports = mongoose.model("Signature", signatureSchema);
