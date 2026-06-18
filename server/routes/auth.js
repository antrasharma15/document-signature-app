const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const validator = require('validator');
const { v4: uuidv4 } = require('uuid');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');

// ─────────────────────────────────────────────────────────────────────────────
//  REGISTER
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = uuidv4();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationToken,
      verificationTokenExpiry,
    });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    console.log(`[DEV] Verification link: ${verifyUrl}`);
    sendVerificationEmail(user.email, verifyUrl, user.name).catch((err) => {
      console.error(`[DEV] Failed to send verification email:`, err.message);
    });

    res.status(201).json({
      message: 'Account created. Please check your email to verify your account.',
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in. Check your inbox.',
        unverified: true,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.verificationToken) {
      user.verificationToken = null;
      user.verificationTokenExpiry = null;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  VERIFY EMAIL
// ─────────────────────────────────────────────────────────────────────────────
router.get('/verify/:token', async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid verification link' });
    }

    if (user.isVerified) {
      return res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
    }

    if (new Date() > user.verificationTokenExpiry) {
      return res.status(410).json({
        message: 'This verification link has expired. Please request a new one.',
        expired: true,
      });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Verification failed', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  RESEND VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ message: 'If that email exists, a new link has been sent.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'This account is already verified.' });
    }

    user.verificationToken = uuidv4();
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${user.verificationToken}`;
    sendVerificationEmail(user.email, verifyUrl, user.name).catch((err) => {
      console.error(`[DEV] Failed to resend verification email:`, err.message);
    });

    res.status(200).json({ message: 'Verification email resent. Check your inbox.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to resend verification email' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  FORGOT PASSWORD — sends reset link to email
//  POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const user = await User.findOne({ email });

    // IMPORTANT: always return the same response whether user exists or not
    // This prevents attackers from figuring out which emails are registered
    if (!user || !user.isVerified) {
      return res.status(200).json({
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    // Generate a short-lived reset token — 15 minutes only
    const resetToken = uuidv4();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    console.log(`[DEV] Password reset link: ${resetUrl}`);

    sendPasswordResetEmail(user.email, resetUrl, user.name).catch((err) => {
      console.error(`[DEV] Failed to send reset email:`, err.message);
    });

    res.status(200).json({
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  RESET PASSWORD — validates token and sets new password
//  POST /api/auth/reset-password/:token
// ─────────────────────────────────────────────────────────────────────────────
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Find user with this token
    const user = await User.findOne({ resetPasswordToken: req.params.token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid reset link' });
    }

    // Check token hasn't expired
    if (new Date() > user.resetPasswordExpiry) {
      return res.status(410).json({
        message: 'This reset link has expired. Please request a new one.',
        expired: true,
      });
    }

    // Hash the new password
    user.password = await bcrypt.hash(newPassword, 12);

    // Clear the reset token — one-time use only
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  PROTECTED ROUTES (require JWT)
// ─────────────────────────────────────────────────────────────────────────────
const authMiddleware = require('../middleware/authMiddleware');

router.get('/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.userId).select('-password');
  res.json(user);
});

// Update Profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email && email !== user.email) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email address' });
      }
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }
    if (name) user.name = name;

    await user.save();
    res.json({
      message: 'Profile updated successfully',
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Change Password (authenticated — requires current password)
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    // Prevent setting the same password
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({ message: 'New password must be different from your current password' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;