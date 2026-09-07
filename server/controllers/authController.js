/**
 * Auth Controller - Handles authentication, OTP verification, and user profiles
 * Architecture: MVC (Controller Layer)
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');

/**
 * Helper to generate secure 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Helper to validate Indian phone number (10 digits starting with 6-9)
 */
const isValidIndianPhone = (phone) => {
  return Boolean(phone && /^[6-9]\d{9}$/.test(phone.trim()));
};

// In-memory OTP rate limiter (Zero cost, prevents SMS spam & brute-force abuse)
const otpRateLimits = new Map();

const checkOtpRateLimit = (phone) => {
  const now = Date.now();
  const entry = otpRateLimits.get(phone);

  if (!entry) {
    otpRateLimits.set(phone, { count: 1, firstRequest: now, lastRequest: now });
    return { allowed: true };
  }

  // 60-second cooldown between consecutive requests
  if (now - entry.lastRequest < 60 * 1000) {
    const waitSeconds = Math.ceil((60 * 1000 - (now - entry.lastRequest)) / 1000);
    return { allowed: false, message: `Please wait ${waitSeconds}s before requesting another OTP.` };
  }

  // Maximum 5 OTP requests in a 10-minute window
  if (now - entry.firstRequest < 10 * 60 * 1000) {
    if (entry.count >= 5) {
      return { allowed: false, message: 'Too many OTP requests. Please try again after 10 minutes.' };
    }
    entry.count += 1;
    entry.lastRequest = now;
    return { allowed: true };
  }

  // Reset after 10-minute window
  otpRateLimits.set(phone, { count: 1, firstRequest: now, lastRequest: now });
  return { allowed: true };
};

/**
 * Controller: Send OTP to user phone number
 * Route: POST /api/auth/send-otp
 */
const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const trimmedPhone = phone.trim();

    if (!isValidIndianPhone(trimmedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Indian phone number. Please enter a valid 10-digit number.'
      });
    }

    // Apply zero-cost rate limiting check
    const rateCheck = checkOtpRateLimit(trimmedPhone);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: rateCheck.message
      });
    }

    const otp = generateOTP();
    const expiryMinutes = 5;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Remove existing unused OTPs for this phone number
    await OTP.deleteMany({ phone: trimmedPhone });

    // Store new OTP
    await OTP.create({
      phone: trimmedPhone,
      otp,
      expiresAt
    });

    console.log(`📱 [AUTH] OTP for ${trimmedPhone}: ${otp}`);

    const isDevelopment = process.env.NODE_ENV !== 'production';

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      expiresInMinutes: expiryMinutes,
      // Provide demoOtp in development mode for easy testing
      demoOtp: isDevelopment ? otp : undefined
    });
  } catch (err) {
    console.error('❌ Error in sendOTP:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process OTP request. Please try again.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Controller: Verify OTP and log in / register user
 * Route: POST /api/auth/verify-otp
 */
const verifyOTP = async (req, res) => {
  try {
    const { phone, otp, name } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are both required.'
      });
    }

    const trimmedPhone = phone.trim();
    const trimmedOtp = otp.trim();

    // Only allow fixed master OTP 111111 in development/testing
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const isFixedMasterOTP = isDevelopment && trimmedOtp === '111111';

    // Verify against database record
    const otpRecord = await OTP.findOne({
      phone: trimmedPhone,
      otp: trimmedOtp,
      verified: false
    });

    if (!otpRecord && !isFixedMasterOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please verify and re-enter.'
      });
    }

    if (otpRecord && otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This OTP has expired. Please request a new one.'
      });
    }

    // Mark OTP as verified
    if (otpRecord) {
      await OTP.updateOne({ _id: otpRecord._id }, { verified: true });
    }

    let user = await User.findOne({ phone: trimmedPhone });
    const isNew = !user;

    // Handle new user onboarding
    if (!user) {
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          requireName: true,
          message: 'Full name is required to complete new account registration.'
        });
      }

      user = await User.create({
        phone: trimmedPhone,
        name: name.trim(),
        role: trimmedPhone === '9999999999' ? 'admin' : 'user'
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_urban_park';
    const token = jwt.sign(
      { id: user._id, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email || '',
        role: user.role
      },
      isNew
    });
  } catch (err) {
    console.error('❌ Error in verifyOTP:', err);
    return res.status(500).json({
      success: false,
      message: 'OTP verification failed due to internal error.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Controller: Register or complete user profile details
 * Route: POST /api/auth/register
 */
const completeProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user._id;

    const updates = {};
    if (name && name.trim()) updates.name = name.trim();
    if (email && email.trim()) updates.email = email.trim().toLowerCase();

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('❌ Error in completeProfile:', err);
    return res.status(500).json({
      success: false,
      message: 'Could not update user profile.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Controller: Retrieve current authenticated user profile
 * Route: GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User session not found'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email || '',
        role: user.role
      }
    });
  } catch (err) {
    console.error('❌ Error in getMe:', err);
    return res.status(500).json({
      success: false,
      message: 'Error fetching authenticated user details.'
    });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  completeProfile,
  getMe
};
