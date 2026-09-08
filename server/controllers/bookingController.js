/**
 * Booking Controller - Handles reservations, dynamic pricing, QR code generation, payments
 * Architecture: MVC (Controller Layer)
 */

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const redisClient = require('../config/redis');
const { safePopulateBooking } = require('../services/bookingPopulator');
const { processGateQRScan } = require('../services/qrGateService');
const { processNewBooking, processBookingExtension } = require('../services/bookingService');

/**
 * Controller: Create a new parking reservation
 * Route: POST /api/bookings
 */
const createBooking = async (req, res) => {
  try {
    const result = await processNewBooking(req.body, req.user);
    return res.status(result.status).json(result.data);
  } catch (err) {
    console.error('❌ Error in createBooking:', err);
    if (req.body?.slotId && !req.body.slotId.includes('osm-park-')) {
      try {
        await ParkingSlot.findByIdAndUpdate(req.body.slotId, {
          status: 'available',
          $unset: { lockExpiresAt: '', lockedBy: '' }
        });
      } catch (e) {}
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to complete parking reservation.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Controller: Get all bookings for the currently authenticated user
 * Route: GET /api/bookings/my
 */
const getMyBookings = async (req, res) => {
  try {
    const rawBookings = await Booking.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const bookings = await Promise.all(rawBookings.map((b) => safePopulateBooking(b)));
    return res.status(200).json(bookings);
  } catch (err) {
    console.error('❌ Error in getMyBookings:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your booking history.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Controller: Get bookings for a specific user ID
 * Route: GET /api/bookings/user/:userId
 */
const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own bookings.'
      });
    }

    const rawBookings = await Booking.find({ userId }).sort({ createdAt: -1 });
    const bookings = await Promise.all(rawBookings.map((b) => safePopulateBooking(b)));
    return res.status(200).json(bookings);
  } catch (err) {
    console.error('❌ Error in getUserBookings:', err);
    return res.status(500).json({ success: false, message: 'Failed to load user bookings.' });
  }
};

/**
 * Controller: Get single booking details by booking ID
 * Route: GET /api/bookings/:id
 */
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const rawBooking = await Booking.findById(id);
    if (!rawBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (req.user.role !== 'admin' && rawBooking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this booking.' });
    }

    const booking = await safePopulateBooking(rawBooking);
    return res.status(200).json(booking);
  } catch (err) {
    console.error('❌ Error in getBookingById:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch booking details.' });
  }
};

/**
 * Controller: Cancel an active booking and release the slot
 * Route: PUT /api/bookings/:id/cancel
 */
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking record not found.' });
    }

    if (req.user.role !== 'admin' && booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this booking.' });
    }

    if (['cancelled', 'completed', 'active'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking with status '${booking.status}'. Active parked sessions and completed bookings cannot be cancelled.`
      });
    }

    await Booking.findByIdAndUpdate(id, { status: 'cancelled', updatedAt: new Date() });

    if (booking.slotId) {
      const remainingBooking = await Booking.findOne({
        _id: { $ne: booking._id },
        slotId: booking.slotId,
        status: { $in: ['confirmed', 'active'] }
      });

      if (!remainingBooking && mongoose.Types.ObjectId.isValid(booking.slotId)) {
        await ParkingSlot.findByIdAndUpdate(booking.slotId, {
          status: 'available',
          $unset: { lockExpiresAt: '', lockedBy: '' },
          updatedAt: new Date()
        });
        await redisClient.del(`lock:${booking.slotId}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. The reservation was released.'
    });
  } catch (err) {
    console.error('❌ Error in cancelBooking:', err);
    return res.status(500).json({ success: false, message: 'Failed to cancel booking.' });
  }
};

/**
 * Controller: Gate Scanner - Verify and process Entry/Exit QR codes
 * Route: POST /api/bookings/scan-qr
 */
const scanAndVerifyQR = async (req, res) => {
  try {
    const { bookingId, qrPayload } = req.body;
    const result = await processGateQRScan(bookingId, qrPayload);
    return res.status(result.status).json(result.data);
  } catch (err) {
    console.error('❌ Error in scanAndVerifyQR:', err);
    return res.status(500).json({ success: false, message: 'Gate scanner error.' });
  }
};

/**
 * Controller: Extend an active or confirmed booking duration
 * Route: PUT /api/bookings/:id/extend
 */
const extendBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { hours, paymentMethod } = req.body;
    const result = await processBookingExtension(id, hours, paymentMethod, req.user);
    return res.status(result.status).json(result.data);
  } catch (err) {
    console.error('❌ Error in extendBooking:', err);
    return res.status(500).json({ success: false, message: 'Failed to extend booking duration.' });
  }
};

/**
 * Controller: Update Parking Location Notes
 * Route: PATCH /api/bookings/:id/notes
 */
const updateBookingNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    if (req.user.role !== 'admin' && booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this booking.' });
    }
    booking.parkingNotes = notes || '';
    await booking.save();
    return res.status(200).json({
      success: true,
      message: 'Parking location note saved.',
      parkingNotes: booking.parkingNotes
    });
  } catch (err) {
    console.error('❌ Error in updateBookingNotes:', err);
    return res.status(500).json({ success: false, message: 'Failed to save parking note.' });
  }
};

/**
 * Controller: Toggle / Simulate EV Charging Status
 * Route: POST /api/bookings/:id/ev-toggle
 */
const toggleEvCharging = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    if (req.user.role !== 'admin' && booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }
    if (!booking.evCharging || !booking.evCharging.enabled) {
      return res.status(400).json({ success: false, message: 'EV charging session not enabled on this bay.' });
    }

    const currentStatus = booking.evCharging.chargingStatus;
    const nextStatus = currentStatus === 'charging' ? 'paused' : 'charging';
    booking.evCharging.chargingStatus = nextStatus;

    if (nextStatus === 'charging') {
      booking.evCharging.kwhConsumed = Math.min(60, (booking.evCharging.kwhConsumed || 0) + 3.2);
      booking.evCharging.currentBatteryPct = Math.min(100, (booking.evCharging.currentBatteryPct || 45) + 6);
    }

    await booking.save();
    return res.status(200).json({
      success: true,
      message: `EV charging session is now ${nextStatus}.`,
      evCharging: booking.evCharging
    });
  } catch (err) {
    console.error('❌ Error in toggleEvCharging:', err);
    return res.status(500).json({ success: false, message: 'Failed to toggle EV charging session.' });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getUserBookings,
  getBookingById,
  cancelBooking,
  scanAndVerifyQR,
  extendBooking,
  updateBookingNotes,
  toggleEvCharging
};
