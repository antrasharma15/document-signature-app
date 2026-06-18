const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

async function checkDb() {
  await mongoose.connect(MONGO_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const users = await User.find({});
  console.log('\n--- Database Users ---');
  users.forEach(user => {
    console.log({
      id: user._id,
      name: user.get('name'),
      email: user.get('email'),
      isVerified: user.get('isVerified'),
      verificationToken: user.get('verificationToken'),
      verificationTokenExpiry: user.get('verificationTokenExpiry')
    });
  });
  console.log('----------------------\n');
  
  await mongoose.connection.close();
}

checkDb();
