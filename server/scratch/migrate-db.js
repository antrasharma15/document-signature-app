const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const result = await User.updateMany(
    { isVerified: { $exists: false } },
    { $set: { isVerified: true } }
  );
  
  console.log(`Migrated ${result.modifiedCount} users to isVerified: true`);
  await mongoose.connection.close();
}

migrate();
