/**
 * Booking Populator Service
 * Handles safe population of lotId and slotId without CastErrors for OSM strings
 */

const mongoose = require('mongoose');
const ParkingLot = require('../models/ParkingLot');
const ParkingSlot = require('../models/ParkingSlot');

/**
 * Safe Populator for Bookings
 * Prevents CastErrors when slotId or lotId are custom OSM string IDs
 */
const safePopulateBooking = async (booking) => {
  if (!booking) return null;
  const obj = booking.toObject ? booking.toObject() : { ...booking };

  // Handle lotId population
  if (obj.lotId && mongoose.Types.ObjectId.isValid(obj.lotId)) {
    try {
      const lot = await ParkingLot.findById(obj.lotId).select('name location address pricePerHour image');
      if (lot) obj.lotId = lot;
    } catch (e) {}
  } else if (typeof obj.lotId === 'string' && obj.lotId.startsWith('osm-park-')) {
    obj.lotId = {
      _id: obj.lotId,
      name: 'Real Municipal Smart Parking Plaza',
      location: 'City Center Sector',
      address: 'Municipal Parking Zone',
      pricePerHour: 30
    };
  }

  // Handle slotId population
  if (obj.slotId && mongoose.Types.ObjectId.isValid(obj.slotId)) {
    try {
      const slot = await ParkingSlot.findById(obj.slotId);
      if (slot) obj.slotId = slot;
    } catch (e) {}
  } else if (typeof obj.slotId === 'string' && obj.slotId.includes('osm-park-')) {
    const parts = obj.slotId.split('-');
    const num = parts[parts.length - 1] || '1';
    obj.slotId = {
      _id: obj.slotId,
      slotNumber: `A${num}`,
      floor: 1,
      type: 'regular',
      status: 'reserved'
    };
  }

  return obj;
};

module.exports = {
  safePopulateBooking
};
