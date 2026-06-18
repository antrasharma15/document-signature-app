const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const API_URL = 'http://localhost:5000/api';

async function getLink() {
  await mongoose.connect(MONGO_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

  const testEmail = 'test_browser_verify@example.com';
  await User.deleteMany({ email: testEmail });

  const regRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Browser Tester',
      email: testEmail,
      password: 'Password123!'
    })
  });
  
  if (regRes.status !== 201) {
    console.error('Registration failed:', await regRes.text());
    await mongoose.connection.close();
    return;
  }

  const dbUser = await User.findOne({ email: testEmail });
  const token = dbUser.get('verificationToken');
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const verifyUrl = `${clientUrl}/verify-email/${token}`;
  
  console.log(`\n========================================`);
  console.log(`SUCCESSFULLY REGISTERED: ${testEmail}`);
  console.log(`VERIFICATION LINK: ${verifyUrl}`);
  console.log(`========================================\n`);
  
  await mongoose.connection.close();
}

getLink();
