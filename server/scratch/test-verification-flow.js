const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const API_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('🚀 Starting Verification Flow Test...');

  // 1. Connect to DB
  await mongoose.connect(MONGO_URI);
  console.log(' Connected to MongoDB database');

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

  const testEmail = `test_verify_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const testName = 'Test Verification User';

  try {
    // 2. Clean up any leftover test user (optional)
    await User.deleteMany({ email: testEmail });

    // 3. Register User
    console.log(`\n1. Registering test user with email: ${testEmail}`);
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword
      })
    });
    const regData = await regRes.json();
    console.log(` Registration response (Status ${regRes.status}):`, regData);
    if (regRes.status !== 201) {
      throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    }

    // 4. Retrieve user from DB to check verification status and token
    const dbUser = await User.findOne({ email: testEmail });
    if (!dbUser) {
      throw new Error('User was not saved in DB!');
    }
    const initialToken = dbUser.get('verificationToken');
    console.log('\n2. User fetched from Database:');
    console.log(' - isVerified:', dbUser.get('isVerified'));
    console.log(' - verificationToken:', initialToken);
    console.log(' - verificationTokenExpiry:', dbUser.get('verificationTokenExpiry'));

    if (dbUser.get('isVerified') !== false) {
      throw new Error('User should start with isVerified = false!');
    }
    if (!initialToken) {
      throw new Error('User must have a verificationToken!');
    }

    // 5. Try to login (should fail)
    console.log('\n3. Attempting login before verification (should be blocked)...');
    const loginRes1 = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    const loginData1 = await loginRes1.json();
    console.log(` Login response status: ${loginRes1.status}`, loginData1);
    if (loginRes1.status !== 403 || !loginData1.message.includes('verify')) {
      throw new Error(`Expected login block with status 403, got ${loginRes1.status} and message: ${loginData1.message}`);
    }
    console.log(' Success! Login blocked correctly.');

    // 5.5. Resend verification email
    console.log('\n3.5. Requesting a verification email resend...');
    const resendRes = await fetch(`${API_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const resendData = await resendRes.json();
    console.log(` Resend response (Status ${resendRes.status}):`, resendData);
    if (resendRes.status !== 200) {
      throw new Error(`Resend verification failed: ${JSON.stringify(resendData)}`);
    }

    // Retrieve user again to get the NEW token
    const dbUserAfterResend = await User.findOne({ email: testEmail });
    const newToken = dbUserAfterResend.get('verificationToken');
    console.log(' - Old Token:', initialToken);
    console.log(' - New Token:', newToken);
    if (!newToken || newToken === initialToken) {
      throw new Error('New token was not generated or is identical to the old token!');
    }

    // 6. Verify Email using the new token
    console.log(`\n4. Verifying email with token: ${newToken}`);
    const verifyRes = await fetch(`${API_URL}/auth/verify/${newToken}`);
    const verifyData = await verifyRes.json();
    console.log(` Verification response (Status ${verifyRes.status}):`, verifyData);
    if (verifyRes.status !== 200) {
      throw new Error(`Verification failed: ${JSON.stringify(verifyData)}`);
    }

    // 7. Re-fetch user to check DB update
    const dbUserVerified = await User.findOne({ email: testEmail });
    console.log('\n5. User fetched from DB after verification:');
    console.log(' - isVerified:', dbUserVerified.get('isVerified'));
    console.log(' - verificationToken:', dbUserVerified.get('verificationToken'));
    console.log(' - verificationTokenExpiry:', dbUserVerified.get('verificationTokenExpiry'));

    if (dbUserVerified.get('isVerified') !== true) {
      throw new Error('User isVerified should be true!');
    }

    // In our new design, token is kept until login to survive React StrictMode concurrent remounts/refreshes.
    // So verificationToken is NOT null yet. Let's test a duplicate verification request (should succeed).
    console.log('\n5.5. Testing duplicate verification request (should succeed)...');
    const verifyRes2 = await fetch(`${API_URL}/auth/verify/${newToken}`);
    console.log(` Duplicate verification response status: ${verifyRes2.status}`);
    if (verifyRes2.status !== 200) {
      throw new Error(`Duplicate verification failed, expected 200 but got ${verifyRes2.status}`);
    }
    console.log(' Success! Duplicate verification handled correctly.');

    // 8. Attempt login again (should succeed)
    console.log('\n6. Attempting login after verification (should succeed)...');
    const loginRes2 = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    const loginData2 = await loginRes2.json();
    console.log(` Login response (Status ${loginRes2.status}):`, {
      tokenExists: !!loginData2.token,
      user: loginData2.user
    });
    if (loginRes2.status !== 200 || !loginData2.token) {
      throw new Error(`Login failed after verification: ${JSON.stringify(loginData2)}`);
    }

    // Check that login successfully cleared the token
    const dbUserAfterLogin = await User.findOne({ email: testEmail });
    console.log('\n6.5. User fetched from DB after login:');
    console.log(' - verificationToken:', dbUserAfterLogin.get('verificationToken'));
    if (dbUserAfterLogin.get('verificationToken') !== null) {
      throw new Error('verificationToken should be cleared (null) after successful login!');
    }

    // 9. Re-use verification token after login (should fail now)
    console.log('\n7. Attempting to reuse the verification token after login (should fail)...');
    const reuseRes = await fetch(`${API_URL}/auth/verify/${newToken}`);
    const reuseData = await reuseRes.json();
    console.log(` Token reuse response status: ${reuseRes.status}`, reuseData);
    if (reuseRes.status !== 400) {
      throw new Error(`Expected failure with status 400, got ${reuseRes.status}`);
    }
    console.log(' Success! Token reuse blocked correctly after login.');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
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
