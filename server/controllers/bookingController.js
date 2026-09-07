/**
 * Booking Controller - Handles reservations, dynamic pricing, QR code generation, payments
 * Architecture: MVC (Controller Layer)
 */

const QRCode = require('qrcode');
const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const ParkingLot = require('../models/ParkingLot');
const Payment = require('../models/Payment');
const redisClient = require('../config/redis');

/**
 * Dynamic Pricing Algorithm:
 * - Peak hours: 9-11 AM, 6-9 PM (1.5x multiplier)
 * - Off-peak: 12 AM - 6 AM, 11 PM (0.8x multiplier)
 * - Standard: 1.0x
 */
const computeDynamicPrice = (basePrice, hour) => {
  const peakHours = [9, 10, 18, 19, 20];
  const offPeakHours = [0, 1, 2, 3, 4, 5, 23];

  if (peakHours.includes(hour)) {
    return Math.round(basePrice * 1.5);
  }
  if (offPeakHours.includes(hour)) {
    return Math.round(basePrice * 0.8);
  }
  return basePrice;
};

/**
 * Controller: Create a new parking reservation
 * Route: POST /api/bookings
 */
const createBooking = async (req, res) => {
  try {
    const {
      slotId,
      lotId,
      startTime,
      endTime,
      vehicleNumber,
      paymentMethod
    } = req.body;

    if (!slotId || !lotId || !startTime || !endTime || !vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: 'All fields (slotId, lotId, startTime, endTime, vehicleNumber) are required.'
      });
    }

    const lot = await ParkingLot.findById(lotId);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Selected parking lot not found.' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    // Check invalid date format or inverted range
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking duration. End time must be after start time.'
      });
    }

    // Loophole Fix #5: Reject past bookings (5 min buffer for clock differences)
    const clockBufferMs = 5 * 60 * 1000;
    if (start.getTime() < now.getTime() - clockBufferMs) {
      return res.status(400).json({
        success: false,
        message: 'Booking start time cannot be in the past. Please select a valid current or future time.'
      });
    }

    // Compute duration in hours (minimum 1 hour, max 72 hours)
    const durationHours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
    if (durationHours > 72) {
      return res.status(400).json({
        success: false,
        message: 'Maximum reservation duration is 72 hours per booking.'
      });
    }

    // Loophole Fix #6: Check for overlapping bookings on this slot
    const conflictingBooking = await Booking.findOne({
      slotId,
      status: { $in: ['confirmed', 'active'] },
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } }
      ]
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        message: 'Slot is already booked by another vehicle during this timeframe.'
      });
    }

    // Loophole Fix #2: Atomic reservation lock preventing double-booking race condition
    const slot = await ParkingSlot.findOneAndUpdate(
      {
        _id: slotId,
        $or: [
          { status: 'available' },
          { status: 'locked', lockExpiresAt: { $lt: now } },
          { status: 'locked', lockedBy: req.user._id }
        ]
      },
      {
        $set: { status: 'reserved', updatedAt: now },
        $unset: { lockExpiresAt: '', lockedBy: '' }
      },
      { new: true }
    );

    if (!slot) {
      return res.status(409).json({
        success: false,
        message: 'Slot was just secured by another customer. Please choose another slot.'
      });
    }

    // Dynamic pricing calculation
    const dynamicRate = computeDynamicPrice(lot.pricePerHour, start.getHours());
    const totalCost = dynamicRate * durationHours;

    // Clean up Redis lock key
    await redisClient.del(`lock:${slotId}`);

    // Create booking record first to obtain booking ID for QR code
    const booking = await Booking.create({
      userId: req.user._id,
      slotId,
      lotId,
      startTime: start,
      endTime: end,
      duration: durationHours,
      totalCost,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      status: 'confirmed'
    });

    // Generate Entry/Exit QR code with embedded booking details
    const qrPayload = {
      bookingId: booking._id,
      bookingRef: `PRK-${Date.now().toString().slice(-6)}`,
      userId: req.user._id,
      slotId,
      slotNumber: slot.slotNumber,
      lotId,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      startTime: start.toISOString(),
      endTime: end.toISOString()
    };

    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrPayload), {
      errorCorrectionLevel: 'M',
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' }
    });

    // Update booking with QR code
    booking.qrCode = qrCodeImage;
    await booking.save();

    // Loophole Fix #4: Free / Zero-cost mock payment record
    const selectedMethod = paymentMethod || 'free_demo';
    const txnId = `FREE_TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    await Payment.create({
      bookingId: booking._id,
      userId: req.user._id,
      amount: totalCost,
      method: selectedMethod,
      status: 'success',
      transactionId: txnId
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('slotId')
      .populate('lotId', 'name location address pricePerHour');

    return res.status(201).json(populatedBooking);
  } catch (err) {
    console.error('❌ Error in createBooking:', err);
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
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('slotId')
      .populate('lotId', 'name location address image')
      .sort({ createdAt: -1 });

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

    const bookings = await Booking.find({ userId })
      .populate('slotId')
      .populate('lotId', 'name location')
      .sort({ createdAt: -1 });

    return res.status(200).json(bookings);
  } catch (err) {
    console.error('❌ Error in getUserBookings:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load user bookings.'
    });
  }
};

/**
 * Controller: Get single booking details by booking ID
 * Route: GET /api/bookings/:id
 */
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate('slotId')
      .populate('lotId', 'name location address pricePerHour');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (req.user.role !== 'admin' && booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this booking.' });
    }

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

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This booking is already cancelled.' });
    }

    await Booking.findByIdAndUpdate(id, { status: 'cancelled', updatedAt: new Date() });

    if (booking.slotId) {
      await ParkingSlot.findByIdAndUpdate(booking.slotId, {
        status: 'available',
        $unset: { lockExpiresAt: '', lockedBy: '' },
        updatedAt: new Date()
      });
      await redisClient.del(`lock:${booking.slotId}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. The slot is now available.'
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
    let targetId = bookingId;

    if (!targetId && qrPayload) {
      try {
        const parsed = typeof qrPayload === 'string' ? JSON.parse(qrPayload) : qrPayload;
        targetId = parsed.bookingId || parsed._id;
      } catch (e) {
        targetId = qrPayload;
      }
    }

    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: 'Valid bookingId or qrPayload is required for gate scanning.'
      });
    }

    const booking = await Booking.findById(targetId)
      .populate('slotId')
      .populate('lotId', 'name location');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'QR Code is invalid or booking not found.' });
    }

    const now = new Date();
    let scanAction = '';
    let resultMessage = '';

    if (booking.status === 'confirmed') {
      // Check-in (Vehicle Entry)
      booking.status = 'active';
      await booking.save();
      await ParkingSlot.findByIdAndUpdate(booking.slotId._id, { status: 'occupied', updatedAt: now });
      scanAction = 'CHECK_IN_SUCCESS';
      resultMessage = `✅ Entry verified for ${booking.vehicleNumber}. Vehicle parked at Slot ${booking.slotId.slotNumber}.`;
    } else if (booking.status === 'active') {
      // Check-out (Vehicle Exit)
      booking.status = 'completed';
      await booking.save();
      await ParkingSlot.findByIdAndUpdate(booking.slotId._id, { status: 'available', updatedAt: now });
      scanAction = 'CHECK_OUT_SUCCESS';
      resultMessage = `🚗 Exit verified for ${booking.vehicleNumber}. Slot released. Have a safe journey!`;
    } else {
      return res.status(400).json({
        success: false,
        message: `This QR code has already been ${booking.status}.`
      });
    }

    return res.status(200).json({
      success: true,
      scanAction,
      message: resultMessage,
      booking
    });
  } catch (err) {
    console.error('❌ Error in scanAndVerifyQR:', err);
    return res.status(500).json({ success: false, message: 'Gate scanner error.' });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getUserBookings,
  getBookingById,
  cancelBooking,
  scanAndVerifyQR
};
