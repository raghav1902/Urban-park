/**
 * Admin Routes
 * Architecture: MVC (Route Layer)
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');

// GET /api/admin/stats - System KPIs, revenue, occupancy
router.get('/stats', adminAuth, adminController.getStats);

// GET /api/admin/lots - Admin lots overview with slot availability
router.get('/lots', adminAuth, adminController.getLots);

// POST /api/admin/lots - Create lot with auto-generated slots
router.post('/lots', adminAuth, adminController.createLot);

// GET /api/admin/bookings - View all bookings across the platform
router.get('/bookings', adminAuth, adminController.getAllBookings);

module.exports = router;
