const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true,
    alias: 'filename'
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  status: {
    type: String,
    enum: ['pending', 'signed', 'rejected', 'waiting'],
    default: 'pending'
  },
  signerEmail: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);