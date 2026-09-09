/**
 * Community & Peer-to-Peer (P2P) Parking Controller
 * Architecture: Clean Controller Layer for "Airbnb for Parking"
 * Adheres strictly to 200-300 lines limit
 */

const ParkingLot = require('../models/ParkingLot');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');

/**
 * Controller: Register new private parking space / driveway
 * Route: POST /api/parking/community/list
 */
const listCommunitySpace = async (req, res) => {
  try {
    const {
      name,
      location,
      city = 'Jaipur',
      lat,
      lng,
      pricePerHour,
      dailyPrice,
      totalSlots = 1,
      spotType = 'driveway',
      amenities = [],
      securityFeatures = [],
      description = '',
      phone,
      upiId
    } = req.body;

    if (!name || !location || !lat || !lng || !pricePerHour) {
      return res.status(400).json({
        success: false,
        message: 'Name, address, coordinates, and hourly rate are required.'
      });
    }

    const userId = req.user.id || req.user._id;
    const hostName = req.user.name || 'Resident Host';
    const parsedSlots = Math.min(Math.max(parseInt(totalSlots, 10) || 1, 1), 10);
    const parsedPrice = Math.max(parseFloat(pricePerHour) || 20, 5);
    const parsedDailyPrice = dailyPrice ? parseFloat(dailyPrice) : parsedPrice * 8;

    const newLot = new ParkingLot({
      name: name.trim(),
      location: location.trim(),
      city: city.trim(),
      totalSlots: parsedSlots,
      availableSlots: parsedSlots,
      pricePerHour: parsedPrice,
      coordinates: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      amenities: Array.isArray(amenities) ? amenities : ['24/7 Gated Access'],
      image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=60',
      isCommunityHost: true,
      hostDetails: {
        userId,
        hostName,
        phone: phone || req.user.phone || '',
        upiId: upiId || '',
        spotType,
        dailyPrice: parsedDailyPrice,
        securityFeatures: Array.isArray(securityFeatures) ? securityFeatures : ['CCTV Monitored'],
        description: description.trim(),
        isActive: true
      }
    });

    const savedLot = await newLot.save();

    // Auto-generate slots for this private community space
    const slotDocs = [];
    for (let i = 1; i <= parsedSlots; i++) {
      const slotNum = `P2P-${String(i).padStart(2, '0')}`;
      const isEv = amenities.some(a => a.toLowerCase().includes('ev'));
      slotDocs.push({
        lotId: savedLot._id,
        slotNumber: slotNum,
        floor: 1,
        status: 'available',
        type: isEv ? 'ev' : 'regular'
      });
    }

    const createdSlots = await ParkingSlot.insertMany(slotDocs);

    return res.status(201).json({
      success: true,
      message: 'Private driveway successfully listed on UrbanPark Community!',
      space: savedLot,
      slots: createdSlots
    });
  } catch (err) {
    console.error('❌ Error listing community space:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create community parking space.'
    });
  }
};

/**
 * Controller: Get host's listed spaces with live earnings and booking requests
 * Route: GET /api/parking/community/my-listings
 */
const getMyHostListings = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    // Find all community lots owned by this host
    const lots = await ParkingLot.find({
      'hostDetails.userId': userId
    }).sort({ createdAt: -1 });

    const lotIds = lots.map(l => l._id);

    // Fetch related bookings across host spaces
    const bookings = await Booking.find({
      lotId: { $in: lotIds }
    }).populate('userId', 'name phone').sort({ createdAt: -1 });

    // Compute live metrics
    let totalRevenue = 0;
    let activeReservations = 0;
    let completedReservations = 0;

    bookings.forEach(b => {
      if (['active', 'completed', 'confirmed'].includes(b.status)) {
        totalRevenue += (b.totalCost || 0);
      }
      if (b.status === 'active' || b.status === 'confirmed') {
        activeReservations += 1;
      }
      if (b.status === 'completed') {
        completedReservations += 1;
      }
    });

    const populatedLots = await Promise.all(
      lots.map(async (lot) => {
        const slots = await ParkingSlot.find({ lotId: lot._id });
        const lotBookings = bookings.filter(b => b.lotId.toString() === lot._id.toString());
        const availableSlots = slots.filter(s => s.status === 'available').length;
        const occupiedSlots = slots.filter(s => s.status === 'occupied' || s.status === 'reserved').length;

        return {
          ...lot.toObject(),
          slots,
          availableSlots,
          occupiedSlots,
          recentBookings: lotBookings.slice(0, 5)
        };
      })
    );

    return res.status(200).json({
      success: true,
      metrics: {
        totalSpaces: lots.length,
        totalRevenue,
        activeReservations,
        completedReservations
      },
      listings: populatedLots
    });
  } catch (err) {
    console.error('❌ Error fetching host listings:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your host listings.'
    });
  }
};

/**
 * Controller: Toggle listing availability (Active / Paused)
 * Route: PATCH /api/parking/community/:id/toggle
 */
const toggleListingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const lot = await ParkingLot.findOne({ _id: id, 'hostDetails.userId': userId });
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Community listing not found or unauthorized.'
      });
    }

    const currentStatus = lot.hostDetails?.isActive ?? true;
    lot.hostDetails.isActive = !currentStatus;
    await lot.save();

    return res.status(200).json({
      success: true,
      message: `Space is now ${lot.hostDetails.isActive ? 'Active' : 'Paused'}.`,
      isActive: lot.hostDetails.isActive
    });
  } catch (err) {
    console.error('❌ Error toggling space status:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle space status.'
    });
  }
};

/**
 * Controller: Get all active community parking spaces for drivers
 * Route: GET /api/parking/community/all
 */
const getPublicCommunitySpaces = async (req, res) => {
  try {
    const communityLots = await ParkingLot.find({
      isCommunityHost: true,
      'hostDetails.isActive': true
    }).sort({ createdAt: -1 });

    const enrichedLots = await Promise.all(
      communityLots.map(async (lot) => {
        const slots = await ParkingSlot.find({ lotId: lot._id });
        const availableSlots = slots.filter(s => s.status === 'available').length;
        return {
          ...lot.toObject(),
          availableSlots,
          totalSlots: slots.length || lot.totalSlots
        };
      })
    );

    return res.status(200).json({
      success: true,
      total: enrichedLots.length,
      spaces: enrichedLots
    });
  } catch (err) {
    console.error('❌ Error fetching public community spaces:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve community parking spaces.'
    });
  }
};

module.exports = {
  listCommunitySpace,
  getMyHostListings,
  toggleListingStatus,
  getPublicCommunitySpaces
};
