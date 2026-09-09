/**
 * Booking Service - Core domain logic for parking reservations & extensions
 * Architecture: Clean Domain Service Layer
 */

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const ParkingLot = require('../models/ParkingLot');
const Payment = require('../models/Payment');
const redisClient = require('../config/redis');
const { computeIntervalDynamicPrice } = require('./pricingService');
const { safePopulateBooking } = require('./bookingPopulator');
const { generateBookingQRCode } = require('./qrGateService');

/**
 * Handle new booking reservation
 */
const processNewBooking = async (payload, user) => {
  const {
    slotId,
    lotId,
    startTime,
    endTime,
    vehicleNumber,
    paymentMethod,
    addOnServices,
    evCharging,
    parkingNotes
  } = payload;

  if (!slotId || !lotId || !startTime || !endTime || !vehicleNumber) {
    return {
      status: 400,
      data: { success: false, message: 'All fields (slotId, lotId, startTime, endTime, vehicleNumber) are required.' }
    };
  }

  // Disallow automated barrier reservations on public unmanaged OSM street lots
  if (typeof lotId === 'string' && lotId.startsWith('osm-park-')) {
    return {
      status: 400,
      data: {
        success: false,
        message: 'Municipal public street spaces operate on drive-in toll collection. Automated QR boom barrier reservation is only supported at UrbanPark Verified Smart Facilities.'
      }
    };
  }

  const lot = await ParkingLot.findById(lotId);
  if (!lot) {
    return { status: 404, data: { success: false, message: 'Selected parking lot not found.' } };
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();

  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return {
      status: 400,
      data: { success: false, message: 'Invalid booking duration. End time must be after start time.' }
    };
  }

  // Reject past bookings (5 min buffer)
  const clockBufferMs = 5 * 60 * 1000;
  if (start.getTime() < now.getTime() - clockBufferMs) {
    return {
      status: 400,
      data: { success: false, message: 'Booking start time cannot be in the past. Please select a valid current or future time.' }
    };
  }

  const durationHours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
  if (durationHours > 72) {
    return {
      status: 400,
      data: { success: false, message: 'Maximum reservation duration is 72 hours per booking.' }
    };
  }

  // Check for conflicting overlap [start, end)
  const conflictingBooking = await Booking.findOne({
    slotId,
    status: { $in: ['confirmed', 'active'] },
    startTime: { $lt: end },
    endTime: { $gt: start }
  });

  if (conflictingBooking) {
    return {
      status: 409,
      data: { success: false, message: 'Slot is already booked by another vehicle during this timeframe.' }
    };
  }

  // Atomic reservation lock
  const slot = await ParkingSlot.findOneAndUpdate(
    {
      _id: slotId,
      $or: [
        { status: 'available' },
        { status: 'locked', lockExpiresAt: { $lt: now } },
        { status: 'locked', lockedBy: user._id }
      ]
    },
    {
      $set: { status: 'reserved', updatedAt: now },
      $unset: { lockExpiresAt: '', lockedBy: '' }
    },
    { new: true }
  );

  if (!slot) {
    return {
      status: 409,
      data: { success: false, message: 'Slot was just secured by another customer. Please choose another slot.' }
    };
  }

  // Calculate pricing securely on backend
  const { totalCost: parkingTariff } = computeIntervalDynamicPrice(lot.pricePerHour, start, end);

  // Authoritative server-side price catalog for concierge add-ons (prevents client price manipulation)
  const OFFICIAL_ADDON_RATES = {
    'wash': { name: 'Eco Waterless Car Wash', price: 199 },
    'nitrogen': { name: 'Digital Tyre Nitrogen Fill', price: 49 },
    'vacuum': { name: 'Interior Deep Vacuuming', price: 149 }
  };

  let addOnTotal = 0;
  const validatedAddOns = Array.isArray(addOnServices)
    ? addOnServices
        .map((svc) => {
          const official = OFFICIAL_ADDON_RATES[svc.id];
          if (!official) return null;
          addOnTotal += official.price;
          return { id: svc.id, name: official.name, price: official.price, status: 'pending' };
        })
        .filter(Boolean)
    : [];

  // Authoritative server-side tariff for EV charging sessions
  let evCost = 0;
  let evPayload = { enabled: false };
  if (evCharging?.enabled) {
    evCost = 225; // Flat standard EV fast charging session rate
    evPayload = {
      enabled: true,
      chargerType: 'Type-2 22kW Fast AC',
      kwhConsumed: 0,
      chargingCost: evCost,
      currentBatteryPct: Number(evCharging.currentBatteryPct) || 45,
      chargingStatus: 'charging'
    };
  }

  const calculatedTotalCost = parkingTariff + addOnTotal + evCost;
  await redisClient.del(`lock:${slotId}`);

  const booking = await Booking.create({
    userId: user._id,
    slotId,
    lotId,
    startTime: start,
    endTime: end,
    duration: durationHours,
    originalDuration: durationHours,
    extendedHours: 0,
    totalCost: calculatedTotalCost,
    originalCost: calculatedTotalCost,
    extendedCost: 0,
    vehicleNumber: vehicleNumber.trim().toUpperCase(),
    status: 'confirmed',
    addOnServices: validatedAddOns,
    evCharging: evPayload,
    parkingNotes: parkingNotes || ''
  });

  const qrCodeImage = await generateBookingQRCode(booking, slot, user);
  booking.qrCode = qrCodeImage;
  await booking.save();

  const selectedMethod = paymentMethod || 'free_demo';
  const txnId = `FREE_TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  await Payment.create({
    bookingId: booking._id,
    userId: user._id,
    amount: calculatedTotalCost,
    method: selectedMethod,
    status: 'success',
    transactionId: txnId
  });

  const rawBooking = await Booking.findById(booking._id);
  const populated = await safePopulateBooking(rawBooking);

  return { status: 201, data: populated };
};

/**
 * Handle booking extension
 */
const processBookingExtension = async (id, hours, paymentMethod, user) => {
  const extendHours = parseInt(hours, 10) || 1;
  if (extendHours < 1 || extendHours > 24) {
    return {
      status: 400,
      data: { success: false, message: 'Extension hours must be between 1 and 24 hours.' }
    };
  }

  const rawBooking = await Booking.findById(id);
  if (!rawBooking) {
    return { status: 404, data: { success: false, message: 'Booking not found.' } };
  }
  const booking = await safePopulateBooking(rawBooking);

  if (user.role !== 'admin' && booking.userId.toString() !== user._id.toString()) {
    return { status: 403, data: { success: false, message: 'Unauthorized to extend this booking.' } };
  }

  if (!['confirmed', 'active'].includes(booking.status)) {
    return {
      status: 400,
      data: { success: false, message: `Cannot extend booking with status '${booking.status}'.` }
    };
  }

  const currentEndTime = new Date(booking.endTime);
  const newEndTime = new Date(currentEndTime.getTime() + extendHours * 3600000);

  const conflictingBooking = await Booking.findOne({
    _id: { $ne: booking._id },
    slotId: booking.slotId,
    status: { $in: ['confirmed', 'active'] },
    startTime: { $lt: newEndTime },
    endTime: { $gt: currentEndTime }
  });

  if (conflictingBooking) {
    return {
      status: 409,
      data: { success: false, message: 'Unable to extend: Another customer has an upcoming reservation for this bay.' }
    };
  }

  const lotPricePerHour = booking.lotId?.pricePerHour || 40;
  const { totalCost: additionalCost } = computeIntervalDynamicPrice(lotPricePerHour, currentEndTime, newEndTime);

  if (booking.originalDuration == null) {
    booking.originalDuration = Math.max(1, (booking.duration || extendHours) - (booking.extendedHours || 0));
  }
  if (booking.originalCost == null) {
    booking.originalCost = Math.max(0, (booking.totalCost || 0) - (booking.extendedCost || 0));
  }

  booking.endTime = newEndTime;
  booking.extendedHours = (booking.extendedHours || 0) + extendHours;
  booking.duration = booking.originalDuration + booking.extendedHours;
  booking.extendedCost = (booking.extendedCost || 0) + additionalCost;
  booking.totalCost = booking.originalCost + booking.extendedCost;
  booking.extensionCount = (booking.extensionCount || 0) + 1;
  booking.reminderSent = false;
  await booking.save();

  const selectedMethod = paymentMethod || 'free_demo';
  const txnId = `EXT_TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  await Payment.create({
    bookingId: booking._id,
    userId: user._id,
    amount: additionalCost,
    method: selectedMethod,
    status: 'success',
    transactionId: txnId
  });

  const rawUpdated = await Booking.findById(booking._id);
  const updatedBooking = await safePopulateBooking(rawUpdated);

  return {
    status: 200,
    data: {
      success: true,
      message: `Reservation extended by ${extendHours} hour(s) successfully! Departure time updated.`,
      additionalCost,
      booking: updatedBooking
    }
  };
};

module.exports = {
  processNewBooking,
  processBookingExtension
};
