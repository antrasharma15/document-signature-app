const express = require('express');
const router = express.Router();
const path = require('path');
const Document = require('../models/Document');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// ─── UPLOAD PDF ─────────────────────────────────────
// POST /api/docs/upload
// Protected — must be logged in
router.post('/upload', authMiddleware, upload.single('pdf'), async (req, res) => {
  try {
    // If no file was attached
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    // Save document metadata to MongoDB
    const doc = new Document({
      owner: req.user.userId,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size
    });

    await doc.save();

    res.status(201).json({
      message: 'File uploaded successfully',
      document: {
        id: doc._id,
        originalName: doc.originalName,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        status: doc.status,
        createdAt: doc.createdAt
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

// ─── GET ALL DOCS FOR LOGGED IN USER ─────────────────
// GET /api/docs/
router.get('/', authMiddleware, async (req, res) => {
  try {
    const documents = await Document.find({ owner: req.user.userId })
      .sort({ createdAt: -1 }); // newest first

    res.status(200).json({ documents });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET SINGLE DOCUMENT BY ID ───────────────────────
// GET /api/docs/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, owner: req.user.userId });
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.status(200).json({ document: doc });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;