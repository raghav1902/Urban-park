/**
 * QR Code & Gate Verification Service
 * Handles Entry/Exit barcode generation and boom barrier check-in/check-out processing
 */

const mongoose = require('mongoose');
const QRCode = require('qrcode');
const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const Payment = require('../models/Payment');
const { safePopulateBooking } = require('./bookingPopulator');

/**
 * Generate QR code data URL for a confirmed booking
 */
const generateBookingQRCode = async (booking, slot, reqUser) => {
  const qrPayload = {
    bookingId: booking._id,
    bookingRef: `PRK-${Date.now().toString().slice(-6)}`,
    userId: reqUser._id,
    slotId: booking.slotId,
    slotNumber: slot.slotNumber,
    lotId: booking.lotId,
    vehicleNumber: booking.vehicleNumber,
    startTime: booking.startTime.toISOString(),
    endTime: booking.endTime.toISOString()
  };

  return await QRCode.toDataURL(JSON.stringify(qrPayload), {
    errorCorrectionLevel: 'M',
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' }
  });
};

/**
 * Verify and process QR code at gate scanner (Check-In / Check-Out)
 */
const processGateQRScan = async (bookingId, qrPayload) => {
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
    return {
      status: 400,
      data: { success: false, message: 'Valid bookingId or qrPayload is required for gate scanning.' }
    };
  }

  const rawBooking = await Booking.findById(targetId);
  if (!rawBooking) {
    return {
      status: 404,
      data: { success: false, message: 'QR Code is invalid or booking not found.' }
    };
  }

  const booking = await safePopulateBooking(rawBooking);
  const now = new Date();
  let scanAction = '';
  let resultMessage = '';
  const slotObjId = booking.slotId?._id || booking.slotId;

  if (rawBooking.status === 'confirmed') {
    // Check-in (Vehicle Entry)
    rawBooking.status = 'active';
    rawBooking.checkInTime = now;
    await rawBooking.save();

    if (slotObjId && mongoose.Types.ObjectId.isValid(slotObjId)) {
      await ParkingSlot.findByIdAndUpdate(slotObjId, { status: 'occupied', updatedAt: now });
    }

    scanAction = 'CHECK_IN_SUCCESS';
    const slotNumDisplay = booking.slotId?.slotNumber || 'Assigned Bay';
    resultMessage = `✅ Entry verified for ${booking.vehicleNumber}. Vehicle parked at Slot ${slotNumDisplay}.`;
  } else if (rawBooking.status === 'active') {
    // Check-out (Vehicle Exit)
    rawBooking.status = 'completed';
    rawBooking.checkOutTime = now;

    let overstayMsg = '';
    if (now > rawBooking.endTime) {
      const overstayMs = now.getTime() - rawBooking.endTime.getTime();
      const overstayHours = Math.max(1, Math.ceil(overstayMs / (1000 * 60 * 60)));
      const lotRate = booking.lotId?.pricePerHour || 40;
      // 1.5x penalty rate for overstay
      const overstayFee = Math.round(overstayHours * lotRate * 1.5);

      rawBooking.overstayHours = overstayHours;
      rawBooking.overstayFee = overstayFee;
      overstayMsg = ` ⚠️ Overstay: ${overstayHours} hr(s) past schedule. Penalty charged: ₹${overstayFee}.`;

      // Record overstay fine payment
      await Payment.create({
        bookingId: rawBooking._id,
        userId: rawBooking.userId,
        amount: overstayFee,
        method: 'overstay_fine',
        status: 'success',
        transactionId: `FINE_TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`
      }).catch(() => {});
    }

    await rawBooking.save();

    if (slotObjId && mongoose.Types.ObjectId.isValid(slotObjId)) {
      await ParkingSlot.findByIdAndUpdate(slotObjId, { status: 'available', updatedAt: now });
    }

    scanAction = 'CHECK_OUT_SUCCESS';
    resultMessage = `🚗 Exit verified for ${booking.vehicleNumber}. Slot released.${overstayMsg} Have a safe journey!`;
  } else {
    return {
      status: 400,
      data: { success: false, message: `This QR code has already been ${rawBooking.status}.` }
    };
  }

  const updatedBooking = await safePopulateBooking(rawBooking);
  return {
    status: 200,
    data: {
      success: true,
      scanAction,
      message: resultMessage,
      booking: updatedBooking
    }
  };
};

module.exports = {
  generateBookingQRCode,
  processGateQRScan
};
