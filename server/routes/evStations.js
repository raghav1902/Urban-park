const express = require('express');
const router = express.Router();
const evStationController = require('../controllers/evStationController');

// GET /api/ev-stations/nearby - Query real nearby EV, CNG, and Petrol stations
router.get('/nearby', evStationController.getNearbyEvStations);

// GET /api/ev-stations/reverse-geocode - Resolve human-readable area name from coordinates
router.get('/reverse-geocode', evStationController.reverseGeocode);

module.exports = router;
