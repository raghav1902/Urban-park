/**
 * Admin Controller - Handles administrator analytics, lot management, and global bookings
 * Architecture: MVC (Controller Layer)
 */

const ParkingLot = require('../models/ParkingLot');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');

/**
 * Controller: Get comprehensive system dashboard analytics
 * Route: GET /api/admin/stats
 */
const getStats = async (req, res) => {
  try {
    const [
      totalLots,
      totalSlots,
      availableSlots,
      occupiedSlots,
      reservedSlots,
      totalUsers,
      totalBookings,
      activeBookings
    ] = await Promise.all([
      ParkingLot.countDocuments(),
      ParkingSlot.countDocuments(),
      ParkingSlot.countDocuments({ status: 'available' }),
      ParkingSlot.countDocuments({ status: 'occupied' }),
      ParkingSlot.countDocuments({ status: 'reserved' }),
      User.countDocuments({ role: 'user' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: { $in: ['confirmed', 'active'] } })
    ]);

    // Aggregate lifetime total successful revenue
    const revenueResult = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Aggregate today's successful revenue
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayRevenueResult = await Payment.aggregate([
      { $match: { status: 'success', createdAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const todayRevenue = todayRevenueResult.length > 0 ? todayRevenueResult[0].total : 0;

    // Overall occupancy percentage calculation
    const occupancyPercent = totalSlots > 0
      ? Math.min(100, Math.round(((occupiedSlots + reservedSlots) / totalSlots) * 100))
      : 0;

    // Fetch the 10 most recent bookings with user & lot relations
    const recentBookings = await Booking.find()
      .populate('userId', 'name phone')
      .populate('lotId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      totalLots,
      totalSlots,
      availableSlots,
      occupiedSlots,
      reservedSlots,
      totalUsers,
      totalBookings,
      activeBookings,
      totalRevenue,
      todayRevenue,
      occupancyPercent,
      recentBookings
    });
  } catch (err) {
    console.error('❌ Error in getStats:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to aggregate administrative metrics.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Controller: Get all parking lots with detailed slot analytics for admin
 * Route: GET /api/admin/lots
 */
const getLots = async (req, res) => {
  try {
    const lots = await ParkingLot.find().sort({ createdAt: -1 });

    const lotsWithStats = await Promise.all(
      lots.map(async (lot) => {
        const [available, occupied, reserved] = await Promise.all([
          ParkingSlot.countDocuments({ lotId: lot._id, status: 'available' }),
          ParkingSlot.countDocuments({ lotId: lot._id, status: 'occupied' }),
          ParkingSlot.countDocuments({ lotId: lot._id, status: 'reserved' })
        ]);

        return {
          ...lot.toObject(),
          available,
          occupied,
          reserved,
          occupancyPercent: lot.totalSlots > 0
            ? Math.round(((occupied + reserved) / lot.totalSlots) * 100)
            : 0
        };
      })
    );

    return res.status(200).json(lotsWithStats);
  } catch (err) {
    console.error('❌ Error in admin getLots:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve administrative parking lot list.'
    });
  }
};

/**
 * Controller: Create new parking lot with auto-generated slots
 * Route: POST /api/admin/lots
 */
const createLot = async (req, res) => {
  try {
    const { name, location, address, totalSlots, pricePerHour, lat, lng, image } = req.body;

    if (!name || !location || !totalSlots || !pricePerHour) {
      return res.status(400).json({
        success: false,
        message: 'Name, location, totalSlots, and pricePerHour are mandatory.'
      });
    }

    const slotCount = parseInt(totalSlots, 10);
    if (isNaN(slotCount) || slotCount < 1) {
      return res.status(400).json({
        success: false,
        message: 'totalSlots must be a positive integer.'
      });
    }

    const lot = await ParkingLot.create({
      name,
      location,
      address: address || `${name}, ${location}`,
      city: req.body.city || 'Jaipur',
      totalSlots: slotCount,
      pricePerHour: parseFloat(pricePerHour),
      lat: lat ? parseFloat(lat) : 26.9124,
      lng: lng ? parseFloat(lng) : 75.7873,
      image: image || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600'
    });

    // Auto-generate slot records for the new lot
    const slots = [];
    const slotsPerFloor = 10;

    for (let i = 1; i <= slotCount; i++) {
      const floor = Math.ceil(i / slotsPerFloor);
      const slotNumber = `S${String(i).padStart(3, '0')}`;
      const type = i <= 2 ? 'handicapped' : i <= 4 ? 'ev' : i <= 8 ? 'compact' : 'regular';

      slots.push({
        lotId: lot._id,
        slotNumber,
        floor,
        type,
        status: 'available'
      });
    }

    await ParkingSlot.insertMany(slots);

    return res.status(201).json({
      success: true,
      message: `Parking lot created with ${slotCount} slots generated successfully.`,
      lot
    });
  } catch (err) {
    console.error('❌ Error in createLot:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create new parking lot facility.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Controller: Get all bookings across the platform for administration
 * Route: GET /api/admin/bookings
 */
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name phone email')
      .populate('lotId', 'name location')
      .populate('slotId', 'slotNumber floor type')
      .sort({ createdAt: -1 });

    return res.status(200).json(bookings);
  } catch (err) {
    console.error('❌ Error in getAllBookings:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch global booking records.'
    });
  }
};

module.exports = {
  getStats,
  getLots,
  createLot,
  getAllBookings
};
