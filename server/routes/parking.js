const express = require('express');
const router = express.Router();
const ParkingLot = require('../models/ParkingLot');
const ParkingSlot = require('../models/ParkingSlot');
const { auth } = require('../middleware/auth');
const redisClient = require('../config/redis');

// GET /api/parking/lots
router.get('/lots', async (req, res) => {
  try {
    const { city, search } = req.query;
    let query = {};
    if (city) query.city = city;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } }
    ];

    const lots = await ParkingLot.find(query);

    // Calculate available slots for each lot
    const lotsWithAvailability = await Promise.all(lots.map(async (lot) => {
      const availableSlots = await ParkingSlot.countDocuments({ lotId: lot._id, status: 'available' });
      const occupiedSlots = await ParkingSlot.countDocuments({ lotId: lot._id, status: 'occupied' });
      return {
        ...lot.toObject(),
        availableSlots,
        occupiedSlots,
        occupancyPercent: Math.round((occupiedSlots / lot.totalSlots) * 100)
      };
    }));

    res.json(lotsWithAvailability);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/parking/lots/:id
router.get('/lots/:id', async (req, res) => {
  try {
    const lot = await ParkingLot.findById(req.params.id);
    if (!lot) return res.status(404).json({ message: 'Lot not found' });

    const availableSlots = await ParkingSlot.countDocuments({ lotId: lot._id, status: 'available' });
    const occupiedSlots = await ParkingSlot.countDocuments({ lotId: lot._id, status: 'occupied' });

    res.json({
      ...lot.toObject(),
      availableSlots,
      occupiedSlots,
      occupancyPercent: Math.round((occupiedSlots / lot.totalSlots) * 100)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/parking/lots/:id/slots
router.get('/lots/:id/slots', async (req, res) => {
  try {
    const slots = await ParkingSlot.find({ lotId: req.params.id }).sort({ floor: 1, slotNumber: 1 });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/parking/slots/:id/status
router.put('/slots/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const slot = await ParkingSlot.findByIdAndUpdate(req.params.id, { status, updatedAt: new Date() }, { new: true });
    res.json(slot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/parking/lock-slot
router.post('/lock-slot', async (req, res) => {
  try {
    const { slotId, userId } = req.body;
    const lockKey = `lock:${slotId}`;

    const isLocked = await redisClient.set(
      lockKey,
      userId || 'anonymous',
      {
        NX: true,
        EX: 300, // 5 minutes
      }
    );

    if (!isLocked) {
      return res.status(400).json({
        success: false,
        message: "Slot already locked",
      });
    }

    return res.json({
      success: true,
      message: "Slot locked successfully",
      expiresIn: 300
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/parking/lock-status/:slotId
router.get("/lock-status/:slotId", async (req, res) => {
  try {
    const { slotId } = req.params;
    const ttl = await redisClient.ttl(`lock:${slotId}`);

    if (ttl > 0) {
      return res.json({
        locked: true,
        timeLeft: ttl
      });
    }

    return res.json({
      locked: false,
      timeLeft: 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/parking/unlock-slot
router.post("/unlock-slot", async (req, res) => {
  try {
    const { slotId } = req.body;
    await redisClient.del(`lock:${slotId}`);
    res.json({
      success: true,
      message: "Slot unlocked"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/parking/release-lock
router.post('/release-lock', auth, async (req, res) => {
  try {
    const { slotId } = req.body;
    const userId = req.user._id;

    // Only release if it's currently marked as locked and by the same user
    const slot = await ParkingSlot.findOneAndUpdate(
      { _id: slotId, status: 'locked', lockedBy: userId },
      { status: 'available', $unset: { lockExpiresAt: "", lockedBy: "" }, updatedAt: new Date() },
      { new: true }
    );

    res.json({ success: true, message: 'Slot lock released' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
