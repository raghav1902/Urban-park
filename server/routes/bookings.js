/**
 * Booking Routes
 * Architecture: MVC (Route Layer)
 */

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { auth } = require('../middleware/auth');

// POST /api/bookings - Create new reservation with QR and payment
router.post('/', auth, bookingController.createBooking);

// GET /api/bookings/my - Get current user's bookings
router.get('/my', auth, bookingController.getMyBookings);

// GET /api/bookings/user/:userId - Get bookings by user ID
router.get('/user/:userId', auth, bookingController.getUserBookings);

// GET /api/bookings/:id - Get single booking details
router.get('/:id', auth, bookingController.getBookingById);

// PUT /api/bookings/:id/cancel - Cancel booking and release slot
router.put('/:id/cancel', auth, bookingController.cancelBooking);

// POST /api/bookings/scan-qr - Gate scanner entry/exit verification
router.post('/scan-qr', auth, bookingController.scanAndVerifyQR);

module.exports = router;
