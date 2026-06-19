const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    alias: 'userId'
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
    enum: ['draft', 'pending', 'signed', 'rejected'],
    default: 'draft'
  },
  signerEmail: {
    type: String,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  fileData: {
    type: String,
    default: null
  },
  signedFileData: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);