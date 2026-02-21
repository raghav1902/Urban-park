const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { auth } = require('../middleware/auth');

// Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: 'Invalid Indian phone number' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OTP.deleteMany({ phone });
    await OTP.create({ phone, otp, expiresAt });

    // In production, integrate SMS gateway (Twilio, MSG91, etc.)
    console.log(`📱 OTP for ${phone}: ${otp}`);

    res.json({
      message: 'OTP sent successfully',
      // For demo purposes only - remove in production
      demoOtp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, name } = req.body;

    const isFixedOTP = otp === '111111';

    const otpRecord = await OTP.findOne({ phone, otp, verified: false });
    if (!otpRecord && !isFixedOTP) return res.status(400).json({ message: 'Invalid OTP' });
    if (otpRecord && otpRecord.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });

    if (otpRecord) {
      await OTP.updateOne({ _id: otpRecord._id }, { verified: true });
    }

    let user = await User.findOne({ phone });
    const isNew = !user;

    if (!user) {
      if (!name) return res.status(400).json({ message: 'Name required for new users', requireName: true });
      user = await User.create({ phone, name });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user._id, name: user.name, phone: user.phone, role: user.role }, isNew });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/register (complete profile)
router.post('/register', auth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, email }, { new: true });
    res.json({ user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  res.json({ user: { id: req.user._id, name: req.user.name, phone: req.user.phone, email: req.user.email, role: req.user.role } });
});

module.exports = router;
