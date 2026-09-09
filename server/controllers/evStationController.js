/**
 * EV & Fuel Station Controller
 * Architecture: Clean Controller Layer
 */

const {
  VERIFIED_JAIPUR_EV_STATIONS,
  VERIFIED_JAIPUR_CNG_STATIONS,
  VERIFIED_JAIPUR_PETROL_STATIONS
} = require('../data/verifiedJaipurStations');

const {
  getFuelRatesForState,
  calculateDistanceKm,
  getReverseGeocodeArea,
  fetchLiveOverpassStations
} = require('../services/overpassStationService');

/**
 * Controller: Get nearby fuel and EV charging stations
 * Route: GET /api/ev-stations/nearby
 * Query Params: lat, lng, radiusKm, category
 */
const getNearbyEvStations = async (req, res) => {
  try {
    const userLat = parseFloat(req.query.lat) || 26.9751;
    const userLng = parseFloat(req.query.lng) || 75.7566;
    const radiusKm = parseFloat(req.query.radiusKm) || 5;
    const requestedCategory = req.query.category || 'all';

    const geoResult = await getReverseGeocodeArea(userLat, userLng);
    const fuelRates = getFuelRatesForState(geoResult.state);

    let allStations = [
      ...VERIFIED_JAIPUR_EV_STATIONS,
      ...VERIFIED_JAIPUR_CNG_STATIONS,
      ...VERIFIED_JAIPUR_PETROL_STATIONS
    ];

    allStations = allStations.map((station) => {
      const distance = calculateDistanceKm(
        userLat,
        userLng,
        station.coordinates.lat,
        station.coordinates.lng
      );
      return {
        ...station,
        distanceKm: distance,
        googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${station.coordinates.lat},${station.coordinates.lng}`
      };
    });

    const radiusMeters = Math.min(Math.max(radiusKm * 1000, 3000), 50000);
    const liveOsmStations = await fetchLiveOverpassStations(userLat, userLng, radiusMeters, fuelRates);

    liveOsmStations.forEach((osmSt) => {
      const isDuplicate = allStations.some((existing) => {
        const d = calculateDistanceKm(
          osmSt.coordinates.lat,
          osmSt.coordinates.lng,
          existing.coordinates.lat,
          existing.coordinates.lng
        );
        return d < 0.25;
      });

      if (!isDuplicate) {
        allStations.push(osmSt);
      }
    });

    let filteredStations = allStations;
    if (requestedCategory && requestedCategory !== 'all') {
      filteredStations = filteredStations.filter((s) => s.category === requestedCategory);
    }

    if (radiusKm && radiusKm > 0) {
      filteredStations = filteredStations.filter((s) => s.distanceKm <= radiusKm);
    }

    filteredStations.sort((a, b) => a.distanceKm - b.distanceKm);

    return res.status(200).json({
      success: true,
      center: { lat: userLat, lng: userLng },
      locationName: geoResult.locationName,
      state: geoResult.state,
      currentFuelRates: fuelRates,
      totalFound: filteredStations.length,
      stations: filteredStations
    });
  } catch (err) {
    console.error('❌ Error in getNearbyEvStations:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch fuel and charging stations.'
    });
  }
};

/**
 * Controller: Get station by ID
 * Route: GET /api/ev-stations/:id
 */
const getStationById = (req, res) => {
  const { id } = req.params;
  const all = [
    ...VERIFIED_JAIPUR_EV_STATIONS,
    ...VERIFIED_JAIPUR_CNG_STATIONS,
    ...VERIFIED_JAIPUR_PETROL_STATIONS
  ];
  const found = all.find((s) => s.id === id);

  if (!found) {
    return res.status(404).json({ success: false, message: 'Station record not found.' });
  }

  return res.status(200).json({ success: true, station: found });
};

/**
 * Controller: Get state official fuel rates
 * Route: GET /api/ev-stations/fuel-rates
 */
const getFuelRates = async (req, res) => {
  try {
    const userLat = parseFloat(req.query.lat) || 26.9751;
    const userLng = parseFloat(req.query.lng) || 75.7566;
    const geo = await getReverseGeocodeArea(userLat, userLng);
    const rates = getFuelRatesForState(geo.state);

    return res.status(200).json({
      success: true,
      state: geo.state,
      locationName: geo.locationName,
      rates
    });
  } catch (err) {
    console.error('❌ Error in getFuelRates:', err);
    return res.status(500).json({ success: false, message: 'Failed to load fuel rates.' });
  }
};

/**
 * Controller: Reverse geocode GPS coordinates
 * Route: GET /api/ev-stations/reverse-geocode
 */
const getReverseGeocode = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || 26.9751;
    const lng = parseFloat(req.query.lng) || 75.7566;
    const geo = await getReverseGeocodeArea(lat, lng);
    return res.status(200).json({ success: true, ...geo });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Geocoding error.' });
  }
};

module.exports = {
  getNearbyEvStations,
  getStationById,
  getFuelRates,
  getReverseGeocode,
  reverseGeocode: getReverseGeocode
};
