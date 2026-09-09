/**
 * OSM Parking Service
 * Handles live OpenStreetMap parking queries, dynamic slot generation, and in-memory mock parking cache
 */

const https = require('https');
const { calculateDistanceKm, getReverseGeocodeArea } = require('./overpassStationService');
const { VERIFIED_JAIPUR_PARKING_LOTS } = require('../data/verifiedJaipurParking');

const parkingOverpassCache = new Map();
const memoryOsmLots = new Map();

/**
 * Generate realistic interactive slots for any real Overpass or dynamic parking lot
 */
function generateDynamicSlotsForOsmLot(lotId, totalCount = 20) {
  const slotTypes = ['regular', 'regular', 'regular', 'compact', 'ev', 'handicapped'];
  const slots = [];

  for (let i = 1; i <= totalCount; i++) {
    const floor = i <= Math.ceil(totalCount / 2) ? 1 : 2;
    const type = slotTypes[(i - 1) % slotTypes.length];
    const letter = floor === 1 ? 'A' : 'B';
    const num = ((i - 1) % Math.ceil(totalCount / 2)) + 1;
    const slotNumber = `${letter}${num}`;

    let status = 'available';
    if (i % 4 === 0) status = 'occupied';
    if (i === 7) status = 'reserved';

    slots.push({
      _id: `${lotId}-slot-${i}`,
      lotId,
      slotNumber,
      floor,
      type,
      status,
      pricePerHour: type === 'ev' ? 40 : 25
    });
  }
  return slots;
}

function getRealisticParkingName(stLat, stLon, tags, geoResult, idx) {
  if (tags.name && tags.name.trim().length > 3 && !tags.name.toLowerCase().includes('municipal smart parking')) {
    return tags.name.trim();
  }
  if (tags['addr:street']) {
    return `${tags['addr:street']} Smart Parking Facility`;
  }
  if (tags['addr:suburb']) {
    return `${tags['addr:suburb']} Commercial Parking Plaza`;
  }

  // Locality coordinates matching in Jaipur
  if (stLat >= 26.96 && stLat <= 27.02 && stLon >= 75.74 && stLon <= 75.79) {
    const spots = ['Central Spine Commercial Bay', 'Sikar Road Sector 2 Parking', 'Ambabari Circle Transit Lot', 'Vidyadhar Nagar Sector 5 Bay'];
    return spots[idx % spots.length];
  }
  if (stLat >= 26.90 && stLat <= 26.93 && stLon >= 75.79 && stLon <= 75.84) {
    const spots = ['MI Road High-Street Parking', 'Ajmeri Gate Commercial Plaza', 'Panch Batti Smart Bay', 'Statue Circle C-Scheme Parking'];
    return spots[idx % spots.length];
  }
  if (stLat >= 26.88 && stLat <= 26.93 && stLon >= 75.72 && stLon <= 75.78) {
    const spots = ['Vaishali Nagar Amrapali Bay', 'Queens Road Market Parking', 'Chitrakoot Stadium Parking Bay', 'Khatipura Road Transit Lot'];
    return spots[idx % spots.length];
  }
  if (stLat >= 26.83 && stLat <= 26.87 && stLon >= 75.79 && stLon <= 75.84) {
    const spots = ['Malviya Nagar Calgiri Bay', 'JLN Marg Boulevard Parking', 'Apex Mall Transit Bay', 'Pradhan Marg Market Lot'];
    return spots[idx % spots.length];
  }
  if (stLat >= 26.84 && stLat <= 26.89 && stLon >= 75.73 && stLon <= 75.78) {
    const spots = ['Mansarovar Bhrigu Path Parking', 'Madhyam Marg Shopping Bay', 'Mansarovar Metro Park & Ride', 'Varun Path Parking Plaza'];
    return spots[idx % spots.length];
  }

  const baseArea = (geoResult.locationName || 'Urban Sector').split(',')[0];
  return `${baseArea} Public Parking Plaza`;
}

/**
 * Fetch live Overpass real parking spaces merged with verified real facilities
 */
async function fetchLiveOsmParkingLots(userLat, userLng, radiusKm, geoResult) {
  const radiusMeters = Math.min(Math.max(radiusKm * 1000, 3000), 50000);
  const cacheKey = `${userLat.toFixed(2)}_${userLng.toFixed(2)}_${radiusMeters}`;
  const cached = parkingOverpassCache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp < 15 * 60 * 1000)) {
    return cached.data;
  }

  // 1. Enrich verified real Jaipur parking facilities
  const verifiedWithDist = VERIFIED_JAIPUR_PARKING_LOTS.map((lot) => {
    const distanceKm = calculateDistanceKm(userLat, userLng, lot.coordinates.lat, lot.coordinates.lng);
    const enriched = {
      ...lot,
      distanceKm
    };
    memoryOsmLots.set(lot._id, enriched);
    return enriched;
  });

  const query = `[out:json][timeout:10];(node["amenity"="parking"](around:${radiusMeters}, ${userLat}, ${userLng});way["amenity"="parking"](around:${radiusMeters}, ${userLat}, ${userLng}););out center 35;`;
  const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

  let liveOsmLots = [];
  try {
    liveOsmLots = await new Promise((resolve) => {
      const reqOsm = https.get(url, { headers: { 'User-Agent': 'UrbanParkApp/1.0' }, timeout: 5000 }, (resOsm) => {
        let data = '';
        resOsm.on('data', chunk => data += chunk);
        resOsm.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const elements = parsed.elements || [];
            const formatted = elements.map((el, idx) => {
              const stLat = el.lat || el.center?.lat;
              const stLon = el.lon || el.center?.lon;
              const tags = el.tags || {};
              const name = getRealisticParkingName(stLat, stLon, tags, geoResult, idx);
              const isCovered = tags.parking === 'underground' || tags.parking === 'multi-storey';
              const distanceKm = calculateDistanceKm(userLat, userLng, stLat, stLon);
              const totalSlots = tags.capacity ? parseInt(tags.capacity, 10) || 30 : 28;
              const pricePerHour = isCovered ? 35 : 25;
              const lotId = `osm-park-${el.id || idx}`;

              const streetOrRoad = tags['addr:street'] || tags['addr:road'];
              const suburbArea = tags['addr:suburb'] || tags['addr:neighbourhood'];
              const locationStr = streetOrRoad
                ? `${streetOrRoad}, ${suburbArea ? suburbArea + ', ' : ''}${geoResult.city}`
                : `${name}, ${geoResult.city}`;

              const lotObj = {
                _id: lotId,
                name,
                location: locationStr,
                city: geoResult.city,
                landmark: suburbArea ? `Near ${suburbArea} Commercial Hub` : 'Main Commercial Corridor',
                coordinates: { lat: stLat, lng: stLon },
                totalSlots,
                availableSlots: Math.max(6, Math.floor(totalSlots * 0.52)),
                occupiedSlots: Math.floor(totalSlots * 0.42),
                reservedSlots: 2,
                occupancyPercent: 44,
                pricePerHour,
                distanceKm,
                amenities: ['CCTV', isCovered ? 'Covered' : 'Open Parking', '24/7 Security', 'EV Charging'],
                googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${stLat},${stLon}`
              };

              memoryOsmLots.set(lotId, lotObj);
              return lotObj;
            });
            resolve(formatted);
          } catch (e) {
            resolve([]);
          }
        });
      });
      reqOsm.on('error', () => resolve([]));
      reqOsm.on('timeout', () => { reqOsm.destroy(); resolve([]); });
    });
  } catch (e) {
    liveOsmLots = [];
  }

  // Merge verified real lots and live OSM lots
  const mergedLots = [...verifiedWithDist];
  liveOsmLots.forEach((osmLot) => {
    const isDuplicate = mergedLots.some((existing) => {
      const d = calculateDistanceKm(osmLot.coordinates.lat, osmLot.coordinates.lng, existing.coordinates.lat, existing.coordinates.lng);
      return d < 0.25;
    });
    if (!isDuplicate) {
      mergedLots.push(osmLot);
    }
  });

  parkingOverpassCache.set(cacheKey, { timestamp: Date.now(), data: mergedLots });
  return mergedLots;
}

/**
 * Generate fallback smart parking lots if Overpass network is throttled or empty
 */
function generateFallbackLots(userLat, userLng, geoResult) {
  const locTitle = geoResult.locationName.split(',')[0] || 'Local Sector';

  const fallbackLots = [
    {
      _id: 'osm-park-gen-1',
      name: `${locTitle} Central Commercial Smart Parking`,
      location: `${locTitle} Main Commercial Corridor, ${geoResult.city}`,
      city: geoResult.city,
      landmark: `Opposite ${locTitle} Central Market`,
      coordinates: { lat: userLat + 0.003, lng: userLng + 0.002 },
      totalSlots: 45,
      availableSlots: 24,
      occupiedSlots: 19,
      reservedSlots: 2,
      occupancyPercent: 46,
      pricePerHour: 30,
      distanceKm: calculateDistanceKm(userLat, userLng, userLat + 0.003, userLng + 0.002),
      amenities: ['CCTV', 'Covered', '24/7 Security', 'EV Charging'],
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${userLat + 0.003},${userLng + 0.002}`
    },
    {
      _id: 'osm-park-gen-2',
      name: `${locTitle} Station Road & Transit Retail Park`,
      location: `${locTitle} Station Link Road, ${geoResult.city}`,
      city: geoResult.city,
      landmark: 'Near Transit Corridor Intersection',
      coordinates: { lat: userLat - 0.005, lng: userLng + 0.006 },
      totalSlots: 40,
      availableSlots: 22,
      occupiedSlots: 16,
      reservedSlots: 2,
      occupancyPercent: 45,
      pricePerHour: 25,
      distanceKm: calculateDistanceKm(userLat, userLng, userLat - 0.005, userLng + 0.006),
      amenities: ['CCTV', 'Open Parking', '24/7 Security', 'Bike Bay'],
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${userLat - 0.005},${userLng + 0.006}`
    },
    {
      _id: 'osm-park-gen-3',
      name: `${locTitle} Multi-Level Express Parking Hub`,
      location: `${locTitle} High Street Market, ${geoResult.city}`,
      city: geoResult.city,
      landmark: 'Near High Street Shopping Complex',
      coordinates: { lat: userLat + 0.007, lng: userLng - 0.004 },
      totalSlots: 60,
      availableSlots: 32,
      occupiedSlots: 26,
      reservedSlots: 2,
      occupancyPercent: 46,
      pricePerHour: 35,
      distanceKm: calculateDistanceKm(userLat, userLng, userLat + 0.007, userLng - 0.004),
      amenities: ['CCTV', 'Covered Underground', 'Handicapped Access', 'EV Charging'],
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${userLat + 0.007},${userLng - 0.004}`
    }
  ];

  fallbackLots.forEach(l => memoryOsmLots.set(l._id, l));
  return fallbackLots;
}

module.exports = {
  calculateDistanceKm,
  getReverseGeocodeArea,
  generateDynamicSlotsForOsmLot,
  fetchLiveOsmParkingLots,
  generateFallbackLots,
  memoryOsmLots
};

