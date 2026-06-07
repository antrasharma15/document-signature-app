const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Test route
app.get('/', (req, res) => res.send('Server is running ✅'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected ✅');
    app.listen(5000, () => console.log('Server running on port 5000'));
  })
  .catch(err => console.log(err));