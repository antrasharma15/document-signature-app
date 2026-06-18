const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false,        // all new accounts start unverified
  },
  verificationToken: {
    type: String,
    default: null,         // the UUID token emailed to the user
  },
  verificationTokenExpiry: {
    type: Date,
    default: null,         // token expires after 24 hours
  },
  // ── Forgot Password ──────────────────────────────────────────────
  resetPasswordToken: {
    type: String,
    default: null,        // UUID token sent in the reset email
  },
  resetPasswordExpiry: {
    type: Date,
    default: null,        // token dies after 15 minutes
  },
  // ─────────────────────────────────────────────────────────────────
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

