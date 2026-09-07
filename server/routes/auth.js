/**
 * Auth Routes
 * Architecture: MVC (Route Layer)
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// POST /api/auth/send-otp - Request OTP to phone
router.post('/send-otp', authController.sendOTP);

// POST /api/auth/verify-otp - Verify OTP and login / create account
router.post('/verify-otp', authController.verifyOTP);

// POST /api/auth/register - Update profile after first login
router.post('/register', auth, authController.completeProfile);

// GET /api/auth/me - Retrieve current logged-in user profile
router.get('/me', auth, authController.getMe);

module.exports = router;
