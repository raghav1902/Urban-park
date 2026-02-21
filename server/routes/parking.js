const express = require('express');
const router = express.Router();
const ParkingLot = require('../models/ParkingLot');
const ParkingSlot = require('../models/ParkingSlot');
const { auth } = require('../middleware/auth');

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
router.post('/lock-slot', auth, async (req, res) => {
  try {
    const { slotId } = req.body;
    const lockDuration = 5 * 60 * 1000; // 5 minutes
    const lockExpiresAt = new Date(Date.now() + lockDuration);

    const slot = await ParkingSlot.findOneAndUpdate(
      { _id: slotId, $or: [{ status: 'available' }, { status: 'locked', lockExpiresAt: { $lte: new Date() } }] },
      { status: 'locked', lockExpiresAt, updatedAt: new Date() },
      { new: true }
    );

    if (!slot) return res.status(400).json({ message: 'Slot is already booked or locked by someone else' });

    res.json({ slotId: slot._id, lockStartTime: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/parking/release-lock
router.post('/release-lock', auth, async (req, res) => {
  try {
    const { slotId } = req.body;

    // Only release if it's currently marked as locked
    const slot = await ParkingSlot.findOneAndUpdate(
      { _id: slotId, status: 'locked' },
      { status: 'available', $unset: { lockExpiresAt: "" }, updatedAt: new Date() },
      { new: true }
    );

    res.json({ success: true, message: 'Slot lock released' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
