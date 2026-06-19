const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.set("trust proxy", 1);
app.use(cors({
  origin: '*',
  exposedHeaders: ['Accept-Ranges', 'Content-Encoding', 'Content-Length', 'Content-Range']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const fs = require('fs');

// Serve uploaded files dynamically from MongoDB, falling back to disk static folder
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.get('/uploads/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;

    // Security check: path traversal protection
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).send("Invalid filename");
    }

    const DocumentModel = require('./models/Document');
    const doc = await DocumentModel.findOne({ $or: [{ fileName: filename }, { filename: filename }] });
    
    if (doc) {
      // If it's a signed request and we have signedFileData in DB
      if (filename.startsWith("signed_") && doc.signedFileData) {
        const fileBytes = Buffer.from(doc.signedFileData, "base64");
        res.setHeader("Content-Type", "application/pdf");
        return res.send(fileBytes);
      }
      // Otherwise serve the original fileData from DB
      if (doc.fileData) {
        const fileBytes = Buffer.from(doc.fileData, "base64");
        res.setHeader("Content-Type", "application/pdf");
        return res.send(fileBytes);
      }
    }

    // Fallback: send static file from disk
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    
    res.status(404).send('File not found');
  } catch (err) {
    console.error("Dynamic uploads retrieval error:", err.message);
    res.status(500).send('Server error');
  }
});

app.use('/uploads', express.static(uploadsDir));


// Routes
const authRoutes = require('./routes/auth');
const docRoutes = require('./routes/docs');
const signatureRoutes = require('./routes/signatures');
const auditRoutes = require('./routes/audit');

app.use('/api/auth', authRoutes);
app.use('/api/docs', docRoutes);
app.use('/api/signatures', signatureRoutes);
app.use('/api/audit', auditRoutes);

app.get('/', (req, res) => res.send('Server status: OK'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(5000, () => console.log('Server running on port 5000'));
  })
  .catch(err => console.log(err));