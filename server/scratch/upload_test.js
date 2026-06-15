const mongoose = require('mongoose');
const User = require('../models/User');
const Document = require('../models/Document');
require('dotenv').config({ path: '../.env' });

async function run() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://docsignuser:Q1K9SjYAthYYvNm5@cluster0.lipxyex.mongodb.net/?appName=Cluster0';
    console.log('Connecting to MongoDB...', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const user = await User.findOne({ email: 'tester15@example.com' });
    if (!user) {
      console.error('User tester15@example.com not found!');
      process.exit(1);
    }
    console.log('User found:', user._id, user.name);

    // Create a new document in the database
    const doc = new Document({
      uploadedBy: user._id,
      originalName: '1781171218847-test_document.pdf',
      fileName: '1781171218847-test_document.pdf',
      filePath: 'uploads/1781171218847-test_document.pdf',
      fileSize: 325,
      status: 'pending',
      signerEmail: 'signer@example.com'
    });

    await doc.save();
    console.log('Document created:', doc._id);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
