/**
 * Booking Routes
 * Architecture: MVC (Route Layer)
 */

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { auth, gateAuth } = require('../middleware/auth');

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

// PUT /api/bookings/:id/extend - Extend booking duration
router.put('/:id/extend', auth, bookingController.extendBooking);

// PATCH /api/bookings/:id/notes - Save parking location memo (pillar, landmark)
router.patch('/:id/notes', auth, bookingController.updateBookingNotes);

// POST /api/bookings/:id/ev-toggle - Start/Pause live EV charging simulation
router.post('/:id/ev-toggle', auth, bookingController.toggleEvCharging);

// POST /api/bookings/scan-qr - Gate scanner entry/exit verification (requires Gatekeeper/Admin)
router.post('/scan-qr', gateAuth, bookingController.scanAndVerifyQR);

module.exports = router;
