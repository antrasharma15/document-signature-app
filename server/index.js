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

// ✅ Serve uploaded files as static
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));


// Routes
const authRoutes = require('./routes/auth');
const docRoutes = require('./routes/docs');        // ✅ Add this
const signatureRoutes = require('./routes/signatures');
const auditRoutes = require('./routes/audit');

app.use('/api/auth', authRoutes);
app.use('/api/docs', docRoutes);                   // ✅ Add this
app.use('/api/signatures', signatureRoutes);
app.use('/api/audit', auditRoutes);

app.get('/', (req, res) => res.send('Server is running ✅'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected ✅');
    app.listen(5000, () => console.log('Server running on port 5000'));
  })
  .catch(err => console.log(err));
// Trigger nodemon reload