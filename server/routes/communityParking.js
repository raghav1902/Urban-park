/**
 * Community & P2P Parking Routes
 * Architecture: MVC Route Layer
 */

const express = require('express');
const router = express.Router();
const communityParkingController = require('../controllers/communityParkingController');
const { auth } = require('../middleware/auth');

// POST /api/parking/community/list - Register new private driveway or garage
router.post('/list', auth, communityParkingController.listCommunitySpace);

// GET /api/parking/community/my-listings - Get host's registered parking spaces
router.get('/my-listings', auth, communityParkingController.getMyHostListings);

// PATCH /api/parking/community/:id/toggle - Toggle space active/paused state
router.patch('/:id/toggle', auth, communityParkingController.toggleListingStatus);

// GET /api/parking/community/all - Public listings for drivers
router.get('/all', communityParkingController.getPublicCommunitySpaces);

module.exports = router;
