/**
 * Parking Routes
 * Architecture: MVC (Route Layer)
 */

const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');
const { auth, adminAuth } = require('../middleware/auth');

// GET /api/parking/nearby - Global Real-Time Nearby Parking Fetcher
router.get('/nearby', parkingController.getNearbyParkingLots);

// GET /api/parking/lots - List all lots with availability and filters
router.get('/lots', parkingController.getAllLots);

// GET /api/parking/lots/:id - Single lot details
router.get('/lots/:id', parkingController.getLotById);

// GET /api/parking/lots/:id/slots - All slots for a specific lot
router.get('/lots/:id/slots', parkingController.getLotSlots);

// PUT /api/parking/slots/:id/status - Update slot status (requires admin authorization)
router.put('/slots/:id/status', adminAuth, parkingController.updateSlotStatus);

// POST /api/parking/lock-slot - Temporarily lock slot during booking flow (requires authentication)
router.post('/lock-slot', auth, parkingController.lockSlot);

// GET /api/parking/lock-status/:slotId - Check remaining TTL of locked slot
router.get('/lock-status/:slotId', parkingController.getLockStatus);

// POST /api/parking/unlock-slot - Release temporary slot lock (requires authentication)
router.post('/unlock-slot', auth, parkingController.unlockSlot);

// POST /api/parking/release-lock - Release slot lock in database for current user
router.post('/release-lock', auth, parkingController.releaseLock);

module.exports = router;
