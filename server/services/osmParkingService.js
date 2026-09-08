/**
 * OSM Parking Service
 * Handles live OpenStreetMap parking queries, dynamic slot generation, and in-memory mock parking cache
 */

const https = require('https');
const { calculateDistanceKm, getReverseGeocodeArea } = require('./overpassStationService');

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

/**
 * Fetch live Overpass real parking spaces
 */
async function fetchLiveOsmParkingLots(userLat, userLng, radiusKm, geoResult) {
  const radiusMeters = Math.min(Math.max(radiusKm * 1000, 3000), 50000);
  const cacheKey = `${userLat.toFixed(2)}_${userLng.toFixed(2)}_${radiusMeters}`;
  const cached = parkingOverpassCache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp < 15 * 60 * 1000)) {
    return cached.data;
  }

  const query = `[out:json][timeout:10];(node["amenity"="parking"](around:${radiusMeters}, ${userLat}, ${userLng});way["amenity"="parking"](around:${radiusMeters}, ${userLat}, ${userLng}););out center 35;`;
  const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

  let liveOsmLots = [];
  try {
    liveOsmLots = await new Promise((resolve) => {
      const reqOsm = https.get(url, { headers: { 'User-Agent': 'UrbanParkApp/1.0' }, timeout: 4000 }, (resOsm) => {
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
              const operator = tags.operator || tags.name || 'Municipal Smart Parking';
              const name = tags.name || `${operator} Bay #${idx + 1}`;
              const isCovered = tags.parking === 'underground' || tags.parking === 'multi-storey';
              const distanceKm = calculateDistanceKm(userLat, userLng, stLat, stLon);
              const totalSlots = tags.capacity ? parseInt(tags.capacity, 10) || 30 : 24;
              const pricePerHour = isCovered ? 40 : 25;
              const lotId = `osm-park-${el.id || idx}`;

              const lotObj = {
                _id: lotId,
                name,
                location: tags['addr:street'] ? `${tags['addr:street']}, ${geoResult.city}` : `${name}, ${geoResult.city}`,
                city: geoResult.city,
                coordinates: { lat: stLat, lng: stLon },
                totalSlots,
                availableSlots: Math.max(5, Math.floor(totalSlots * 0.5)),
                occupiedSlots: Math.floor(totalSlots * 0.4),
                reservedSlots: 2,
                occupancyPercent: 45,
                pricePerHour,
                distanceKm,
                amenities: ['CCTV', isCovered ? 'Covered' : 'Open Parking', '24/7 Security', 'EV Charging'],
                googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${stLat},${stLon}`
              };

              memoryOsmLots.set(lotId, lotObj);
              return lotObj;
            });
            parkingOverpassCache.set(cacheKey, { timestamp: Date.now(), data: formatted });
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

  return liveOsmLots;
}

/**
 * Generate fallback smart parking lots if Overpass network is throttled or empty
 */
function generateFallbackLots(userLat, userLng, geoResult) {
  const locTitle = geoResult.locationName.split(',')[0] || 'Local Sector';

  const fallbackLots = [
    {
      _id: 'osm-park-gen-1',
      name: `${locTitle} Central Smart Parking Plaza`,
      location: `${locTitle} Main Commercial Corridor`,
      city: geoResult.city,
      coordinates: { lat: userLat + 0.003, lng: userLng + 0.002 },
      totalSlots: 35,
      availableSlots: 18,
      occupiedSlots: 15,
      reservedSlots: 2,
      occupancyPercent: 48,
      pricePerHour: 30,
      distanceKm: calculateDistanceKm(userLat, userLng, userLat + 0.003, userLng + 0.002),
      amenities: ['CCTV', 'Covered', '24/7 Security', 'EV Charging'],
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${userLat + 0.003},${userLng + 0.002}`
    },
    {
      _id: 'osm-park-gen-2',
      name: `${locTitle} Transit Metro & Retail Park`,
      location: `${locTitle} Station Road`,
      city: geoResult.city,
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
      name: `${locTitle} Multi-Level Express Hub`,
      location: `${locTitle} High Street Market`,
      city: geoResult.city,
      coordinates: { lat: userLat + 0.007, lng: userLng - 0.004 },
      totalSlots: 50,
      availableSlots: 28,
      occupiedSlots: 20,
      reservedSlots: 2,
      occupancyPercent: 44,
      pricePerHour: 35,
      distanceKm: calculateDistanceKm(userLat, userLng, userLat + 0.007, userLng - 0.004),
      amenities: ['CCTV', 'Covered', 'Handicapped Access', 'EV Charging'],
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
