/**
 * Parking Controller - Handles parking lot queries, slot states, real-time locks
 * Architecture: MVC (Controller Layer)
 */

const mongoose = require('mongoose');
const ParkingLot = require('../models/ParkingLot');
const ParkingSlot = require('../models/ParkingSlot');
const redisClient = require('../config/redis');

/**
 * Controller: Get all parking lots with dynamic occupancy and availability
 * Route: GET /api/parking/lots
 */
const getAllLots = async (req, res) => {
  try {
    const { city, search } = req.query;
    const query = {};

    if (city && city.trim()) {
      query.city = { $regex: new RegExp(`^${city.trim()}$`, 'i') };
    }

    if (search && search.trim()) {
      const sanitizedSearch = search.trim();
      query.$or = [
        { name: { $regex: sanitizedSearch, $options: 'i' } },
        { location: { $regex: sanitizedSearch, $options: 'i' } },
        { city: { $regex: sanitizedSearch, $options: 'i' } }
      ];
    }

    const lots = await ParkingLot.find(query).sort({ createdAt: -1 });

    // Enrich each lot with accurate slot metrics
    const lotsWithAvailability = await Promise.all(
      lots.map(async (lot) => {
        const [availableSlots, occupiedSlots, reservedSlots] = await Promise.all([
          ParkingSlot.countDocuments({ lotId: lot._id, status: 'available' }),
          ParkingSlot.countDocuments({ lotId: lot._id, status: 'occupied' }),
          ParkingSlot.countDocuments({ lotId: lot._id, status: 'reserved' })
        ]);

        const effectiveOccupied = occupiedSlots + reservedSlots;
        const total = lot.totalSlots || 1;
        const occupancyPercent = Math.min(100, Math.round((effectiveOccupied / total) * 100));

        return {
          ...lot.toObject(),
          availableSlots,
          occupiedSlots,
          reservedSlots,
          occupancyPercent
        };
      })
    );

    return res.status(200).json(lotsWithAvailability);
  } catch (err) {
    console.error('❌ Error in getAllLots:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch parking lots list.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Controller: Get single parking lot details by ID
 * Route: GET /api/parking/lots/:id
 */
const getLotById = async (req, res) => {
  try {
    const { id } = req.params;
    const lot = await ParkingLot.findById(id);

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Parking lot not found.'
      });
    }

    const [availableSlots, occupiedSlots, reservedSlots] = await Promise.all([
      ParkingSlot.countDocuments({ lotId: lot._id, status: 'available' }),
      ParkingSlot.countDocuments({ lotId: lot._id, status: 'occupied' }),
      ParkingSlot.countDocuments({ lotId: lot._id, status: 'reserved' })
    ]);

    const effectiveOccupied = occupiedSlots + reservedSlots;
    const total = lot.totalSlots || 1;
    const occupancyPercent = Math.min(100, Math.round((effectiveOccupied / total) * 100));

    return res.status(200).json({
      ...lot.toObject(),
      availableSlots,
      occupiedSlots,
      reservedSlots,
      occupancyPercent
    });
  } catch (err) {
    console.error('❌ Error in getLotById:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve parking lot information.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Controller: Get all slots within a parking lot
 * Route: GET /api/parking/lots/:id/slots
 */
const getLotSlots = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if lot exists
    const lotExists = await ParkingLot.exists({ _id: id });
    if (!lotExists) {
      return res.status(404).json({
        success: false,
        message: 'Parking lot does not exist.'
      });
    }

    const slots = await ParkingSlot.find({ lotId: id })
      .sort({ floor: 1, slotNumber: 1 });

    return res.status(200).json(slots);
  } catch (err) {
    console.error('❌ Error in getLotSlots:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch slots for this parking lot.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Controller: Update status of an individual parking slot
 * Route: PUT /api/parking/slots/:id/status
 */
const updateSlotStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['available', 'occupied', 'reserved', 'locked'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid slot status. Valid options are: ${validStatuses.join(', ')}`
      });
    }

    const updatedSlot = await ParkingSlot.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedSlot) {
      return res.status(404).json({
        success: false,
        message: 'Parking slot not found.'
      });
    }

    return res.status(200).json(updatedSlot);
  } catch (err) {
    console.error('❌ Error in updateSlotStatus:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update slot status.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Controller: Temporarily lock slot during checkout (5 minutes TTL)
 * Route: POST /api/parking/lock-slot
 */
const lockSlot = async (req, res) => {
  try {
    const { slotId, userId } = req.body;

    if (!slotId) {
      return res.status(400).json({
        success: false,
        message: 'slotId is required to lock a slot.'
      });
    }

    const lockKey = `lock:${slotId}`;
    const ttlSeconds = 300; // 5 minutes

    const isLocked = await redisClient.set(
      lockKey,
      userId || 'guest-session',
      {
        NX: true,
        EX: ttlSeconds
      }
    );

    if (!isLocked) {
      return res.status(400).json({
        success: false,
        message: 'This slot is already locked by another user. Please choose another slot.'
      });
    }

    // Also update slot document in MongoDB if user is known and is valid ObjectId
    const isValidUser = userId && mongoose.Types.ObjectId.isValid(userId);
    await ParkingSlot.findByIdAndUpdate(slotId, {
      status: 'locked',
      ...(isValidUser ? { lockedBy: userId } : {}),
      lockExpiresAt: new Date(Date.now() + ttlSeconds * 1000),
      updatedAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'Slot locked successfully for checkout',
      expiresIn: ttlSeconds
    });
  } catch (err) {
    console.error('❌ Error in lockSlot:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while attempting to lock slot.'
    });
  }
};

/**
 * Controller: Get remaining lock TTL for a slot
 * Route: GET /api/parking/lock-status/:slotId
 */
const getLockStatus = async (req, res) => {
  try {
    const { slotId } = req.params;
    const ttl = await redisClient.ttl(`lock:${slotId}`);

    if (ttl > 0) {
      return res.status(200).json({
        locked: true,
        timeLeft: ttl
      });
    }

    return res.status(200).json({
      locked: false,
      timeLeft: 0
    });
  } catch (err) {
    console.error('❌ Error in getLockStatus:', err);
    return res.status(500).json({
      message: 'Error inspecting lock status'
    });
  }
};

/**
 * Controller: Unlock slot in Redis/memory cache
 * Route: POST /api/parking/unlock-slot
 */
const unlockSlot = async (req, res) => {
  try {
    const { slotId } = req.body;
    if (!slotId) {
      return res.status(400).json({ success: false, message: 'slotId required' });
    }

    await redisClient.del(`lock:${slotId}`);

    return res.status(200).json({
      success: true,
      message: 'Slot unlocked'
    });
  } catch (err) {
    console.error('❌ Error in unlockSlot:', err);
    return res.status(500).json({ message: 'Server error unlocking slot' });
  }
};

/**
 * Controller: Release locked slot in MongoDB for current user
 * Route: POST /api/parking/release-lock
 */
const releaseLock = async (req, res) => {
  try {
    const { slotId } = req.body;
    const userId = req.user._id;

    await redisClient.del(`lock:${slotId}`);

    await ParkingSlot.findOneAndUpdate(
      { _id: slotId, status: 'locked', lockedBy: userId },
      {
        status: 'available',
        $unset: { lockExpiresAt: '', lockedBy: '' },
        updatedAt: new Date()
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Slot lock released successfully'
    });
  } catch (err) {
    console.error('❌ Error in releaseLock:', err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllLots,
  getLotById,
  getLotSlots,
  updateSlotStatus,
  lockSlot,
  getLockStatus,
  unlockSlot,
  releaseLock
};
