/**
 * Auth Controller - Handles authentication, OTP verification, and user profiles
 * Architecture: MVC (Controller Layer)
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const redisClient = require('../config/redis');

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

/**
 * Distributed OTP rate limiter using Redis with memoryStore fallback
 * - Cooldown between consecutive OTP requests (3s in dev, 60s in production)
 * - Maximum 10 OTP requests in a 10-minute window
 */
const checkOtpRateLimit = async (phone) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const cooldownDuration = isDevelopment ? 3 : 60;
  const maxRequests = isDevelopment ? 20 : 5;

  const cooldownKey = `ratelimit:otp:cooldown:${phone}`;
  const countKey = `ratelimit:otp:count:${phone}`;

  const cooldownTtl = await redisClient.ttl(cooldownKey);
  if (cooldownTtl > 0) {
    return {
      allowed: false,
      message: `Please wait ${cooldownTtl}s before requesting another OTP.`
    };
  }

  const currentCount = await redisClient.get(countKey);
  if (currentCount && parseInt(currentCount, 10) >= maxRequests) {
    const windowTtl = await redisClient.ttl(countKey);
    const waitMins = Math.max(1, Math.ceil(windowTtl / 60));
    return {
      allowed: false,
      message: `Too many OTP requests. Please try again after ${waitMins} minute(s).`
    };
  }

  // Set cooldown
  await redisClient.set(cooldownKey, '1', { EX: cooldownDuration });

  // Increment or initialize 10-minute request counter
  if (currentCount) {
    const existingTtl = await redisClient.ttl(countKey);
    const ttl = existingTtl > 0 ? existingTtl : 600;
    const newCount = parseInt(currentCount, 10) + 1;
    await redisClient.set(countKey, String(newCount), { EX: ttl });
  } else {
    await redisClient.set(countKey, '1', { EX: 600 });
  }

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

    // Apply distributed rate limiting check
    const rateCheck = await checkOtpRateLimit(trimmedPhone);
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

    const isDemoAllowed = process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEMO_OTP === 'true';

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      expiresInMinutes: expiryMinutes,
      // Provide demoOtp only if explicitly allowed in development environment
      demoOtp: isDemoAllowed ? otp : undefined
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

    // Only allow fixed master OTP 111111 if explicitly enabled in non-production environments
    const isDemoAllowed = process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEMO_OTP === 'true';
    const isFixedMasterOTP = isDemoAllowed && trimmedOtp === '111111';

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

    // Handle new user onboarding (All new registrations get 'user' role)
    if (!user) {
      const userName = (name && name.trim()) ? name.trim() : `User ${trimmedPhone.slice(-4)}`;
      user = await User.create({
        phone: trimmedPhone,
        name: userName,
        role: 'user'
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
