const mongoose = require('mongoose');
require('dotenv').config();

async function cleanup() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const result = await User.deleteMany({ email: /@example\.com$/ });
  console.log(`Successfully deleted ${result.deletedCount} test accounts from MongoDB.`);
  
  await mongoose.connection.close();
}

cleanup();
