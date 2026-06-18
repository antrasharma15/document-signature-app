const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const API_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('🚀 Starting Forgot/Reset Password Flow Test...');

  // 1. Connect to DB
  await mongoose.connect(MONGO_URI);
  console.log(' Connected to MongoDB database');

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

  const testEmail = `test_reset_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const newPassword = 'NewPassword123!';

  try {
    // 2. Register a verified user
    console.log(`\n1. Creating a verified test user with email: ${testEmail}`);
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    const user = await User.create({
      name: 'Reset Tester',
      email: testEmail,
      password: hashedPassword,
      isVerified: true
    });
    console.log(' User created and set to isVerified: true');

    // 3. Request password reset
    console.log('\n2. Requesting password reset...');
    const forgotRes = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const forgotData = await forgotRes.json();
    console.log(` Forgot Password response (Status ${forgotRes.status}):`, forgotData);
    if (forgotRes.status !== 200) {
      throw new Error(`Forgot password request failed: ${JSON.stringify(forgotData)}`);
    }

    // 4. Fetch the token from DB
    const dbUser = await User.findOne({ email: testEmail });
    const resetToken = dbUser.get('resetPasswordToken');
    console.log('\n3. Token fetched from DB:');
    console.log(' - resetPasswordToken:', resetToken);
    console.log(' - resetPasswordExpiry:', dbUser.get('resetPasswordExpiry'));
    if (!resetToken) {
      throw new Error('resetPasswordToken was not saved in DB!');
    }

    // 5. Try to reset password with an invalid token (should fail)
    console.log('\n4. Attempting reset with invalid token (should fail)...');
    const invalidRes = await fetch(`${API_URL}/auth/reset-password/invalid-token-123`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: newPassword })
    });
    const invalidData = await invalidRes.json();
    console.log(` Invalid token response status: ${invalidRes.status}`, invalidData);
    if (invalidRes.status !== 400) {
      throw new Error(`Expected status 400 for invalid token, got ${invalidRes.status}`);
    }
    console.log(' Success! Invalid token blocked.');

    // 6. Reset password with valid token
    console.log('\n5. Attempting reset with valid token...');
    const resetRes = await fetch(`${API_URL}/auth/reset-password/${resetToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: newPassword })
    });
    const resetData = await resetRes.json();
    console.log(` Reset Password response (Status ${resetRes.status}):`, resetData);
    if (resetRes.status !== 200) {
      throw new Error(`Reset password failed: ${JSON.stringify(resetData)}`);
    }

    // 7. Verify token was cleared in DB
    const dbUserAfterReset = await User.findOne({ email: testEmail });
    console.log('\n6. Checking user record in DB after reset:');
    console.log(' - resetPasswordToken:', dbUserAfterReset.get('resetPasswordToken'));
    console.log(' - resetPasswordExpiry:', dbUserAfterReset.get('resetPasswordExpiry'));
    if (dbUserAfterReset.get('resetPasswordToken') !== null) {
      throw new Error('resetPasswordToken should be cleared (null) after reset!');
    }

    // 8. Try to login with the OLD password (should fail)
    console.log('\n7. Trying to log in with the OLD password (should be unauthorized)...');
    const loginOldRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    console.log(` Old password login response status: ${loginOldRes.status}`);
    if (loginOldRes.status !== 401) {
      throw new Error(`Expected login fail (401), got ${loginOldRes.status}`);
    }
    console.log(' Success! Old password no longer works.');

    // 9. Try to login with the NEW password (should succeed)
    console.log('\n8. Trying to log in with the NEW password (should succeed)...');
    const loginNewRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: newPassword
      })
    });
    const loginNewData = await loginNewRes.json();
    console.log(` New password login response (Status ${loginNewRes.status}):`, {
      tokenExists: !!loginNewData.token,
      user: loginNewData.user
    });
    if (loginNewRes.status !== 200 || !loginNewData.token) {
      throw new Error(`Login failed with new password: ${JSON.stringify(loginNewData)}`);
    }
    console.log(' Success! Logged in using new password.');

    console.log('\n🎉 ALL PASSWORD RESET TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    // Clean up
    console.log('\nCleaning up test user...');
    await User.deleteOne({ email: testEmail });
    await mongoose.connection.close();
    console.log('Done.');
  }
}

runTest();
