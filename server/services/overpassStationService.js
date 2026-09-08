/**
 * Overpass Station Service
 * Handles Live Overpass OpenStreetMap queries, Nominatim reverse geocoding, and official fuel rates
 */

const https = require('https');

const overpassCache = new Map();
const geocodeCache = new Map();

// State-wise official fuel rates in India
const STATE_FUEL_RATES = {
  'Delhi': { petrol: '₹94.72 / Litre', diesel: '₹87.62 / Litre', cng: '₹75.09 / Kg', evUnit: '₹16.00 / kWh', state: 'Delhi NCR' },
  'Maharashtra': { petrol: '₹104.21 / Litre', diesel: '₹92.15 / Litre', cng: '₹86.00 / Kg', evUnit: '₹19.00 / kWh', state: 'Maharashtra' },
  'Karnataka': { petrol: '₹102.86 / Litre', diesel: '₹88.94 / Litre', cng: '₹83.50 / Kg', evUnit: '₹18.00 / kWh', state: 'Karnataka' },
  'Gujarat': { petrol: '₹94.44 / Litre', diesel: '₹90.11 / Litre', cng: '₹76.20 / Kg', evUnit: '₹16.50 / kWh', state: 'Gujarat' },
  'Uttar Pradesh': { petrol: '₹94.65 / Litre', diesel: '₹87.75 / Litre', cng: '₹79.70 / Kg', evUnit: '₹17.00 / kWh', state: 'Uttar Pradesh' },
  'Rajasthan': { petrol: '₹104.88 / Litre', diesel: '₹90.36 / Litre', cng: '₹85.00 / Kg', evUnit: '₹18.50 / kWh', state: 'Rajasthan' },
  'default': { petrol: '₹104.88 / Litre', diesel: '₹90.36 / Litre', cng: '₹85.00 / Kg', evUnit: '₹18.50 / kWh', state: 'India Standard' }
};

function getFuelRatesForState(stateName) {
  if (!stateName) return STATE_FUEL_RATES['Rajasthan'];
  for (const [key, val] of Object.entries(STATE_FUEL_RATES)) {
    if (stateName.toLowerCase().includes(key.toLowerCase())) {
      return val;
    }
  }
  return STATE_FUEL_RATES['Rajasthan'];
}

// Haversine formula to compute great-circle distance between two GPS coordinates in kilometers
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Reverse-geocode coordinates to human-readable area & state name
 */
function getReverseGeocodeArea(lat, lng) {
  const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}`;
  if (geocodeCache.has(cacheKey)) {
    return Promise.resolve(geocodeCache.get(cacheKey));
  }

  const getJaipurLocalFallback = (lt, lg) => {
    if (lt >= 26.94 && lt <= 27.03 && lg >= 75.71 && lg <= 75.79) {
      return { locationName: 'Vidyadhar Nagar / Sikar Road, Jaipur', state: 'Rajasthan' };
    }
    if (lt >= 26.83 && lt <= 26.88 && lg >= 75.79 && lg <= 75.85) {
      return { locationName: 'Malviya Nagar, Jaipur', state: 'Rajasthan' };
    }
    if (lt >= 26.82 && lt <= 26.88 && lg >= 75.72 && lg <= 75.78) {
      return { locationName: 'Mansarovar, Jaipur', state: 'Rajasthan' };
    }
    if (lt >= 26.89 && lt <= 26.93 && lg >= 75.78 && lg <= 75.83) {
      return { locationName: 'C-Scheme / MI Road, Jaipur', state: 'Rajasthan' };
    }
    if (lt >= 26.88 && lt <= 26.93 && lg >= 75.72 && lg <= 75.77) {
      return { locationName: 'Vaishali Nagar, Jaipur', state: 'Rajasthan' };
    }
    return { locationName: 'Jaipur Region, Rajasthan', state: 'Rajasthan' };
  };

  return new Promise((resolve) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const req = https.get(
      url,
      { headers: { 'User-Agent': 'UrbanParkApp/1.0 (smartparkingjaipur@urbanpark.in)' }, timeout: 2500 },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const addr = parsed.address || {};
            const area =
              addr.suburb ||
              addr.neighbourhood ||
              addr.residential ||
              addr.subdistrict ||
              addr.road ||
              'Central Sector';
            const city = addr.city || addr.town || addr.state_district || 'Jaipur';
            const state = addr.state || 'Rajasthan';
            const result = {
              locationName: `${area}, ${city}`,
              state,
              city
            };
            geocodeCache.set(cacheKey, result);
            resolve(result);
          } catch (e) {
            resolve(getJaipurLocalFallback(lat, lng));
          }
        });
      }
    );
    req.on('error', () => resolve(getJaipurLocalFallback(lat, lng)));
    req.on('timeout', () => {
      req.destroy();
      resolve(getJaipurLocalFallback(lat, lng));
    });
  });
}

/**
 * Live Overpass OSM Query to fetch real-world fuel & EV stations around user coordinates
 */
function fetchLiveOverpassStations(lat, lon, radiusMeters, fuelRates) {
  const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}_${radiusMeters}`;
  const cached = overpassCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < 15 * 60 * 1000)) {
    return Promise.resolve(cached.data);
  }

  return new Promise((resolve) => {
    const query = `[out:json][timeout:10];(node["amenity"="fuel"](around:${radiusMeters}, ${lat}, ${lon});way["amenity"="fuel"](around:${radiusMeters}, ${lat}, ${lon});node["amenity"="charging_station"](around:${radiusMeters}, ${lat}, ${lon});way["amenity"="charging_station"](around:${radiusMeters}, ${lat}, ${lon}););out center 40;`;
    const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

    const req = https.get(
      url,
      { headers: { 'User-Agent': 'UrbanParkApp/1.0 (smartparkingjaipur@urbanpark.in)' }, timeout: 6000 },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const rawElements = parsed.elements || [];
            const stations = rawElements.map((el, idx) => {
              const stLat = el.lat || el.center?.lat;
              const stLon = el.lon || el.center?.lon;
              const tags = el.tags || {};
              const isCharging = tags.amenity === 'charging_station';
              const nameLower = (tags.name || '').toLowerCase();
              const hasCng = tags['fuel:cng'] === 'yes' || nameLower.includes('cng') || nameLower.includes('torrent');

              let category = 'petrol';
              let categoryLabel = 'Petrol & Diesel';
              let fuels = [`Petrol (${fuelRates.petrol})`, `Diesel (${fuelRates.diesel})`, 'Speed / XP95'];
              let rateDisplay = `Petrol ${fuelRates.petrol.split(' ')[0]} / Diesel ${fuelRates.diesel.split(' ')[0]}`;

              if (isCharging) {
                category = 'ev';
                categoryLabel = 'EV Fast Charging';
                fuels = ['CCS-II Fast DC', 'Type-2 22kW AC'];
                rateDisplay = fuelRates.evUnit;
              } else if (hasCng) {
                category = 'cng';
                categoryLabel = 'CNG Gas Pump';
                fuels = [`CNG (${fuelRates.cng})`, 'High Pressure 220 Bar', 'Petrol / Diesel'];
                rateDisplay = fuelRates.cng;
              }

              const operator = tags.operator || tags.brand || (hasCng ? 'Torrent Gas' : 'Fuel Station');
              const brand = tags.brand || operator;
              let name = tags.name;
              if (!name) {
                name = brand ? `${brand} Auto Care` : 'Authorized Fuel Station';
              }

              const distance = calculateDistanceKm(lat, lon, stLat, stLon);

              return {
                id: `osm-${el.id || idx}`,
                category,
                categoryLabel,
                name,
                operator,
                brand,
                address: tags['addr:street']
                  ? `${tags['addr:street']}, Jaipur, Rajasthan`
                  : `${name}, Jaipur`,
                landmark: tags['addr:suburb'] ? `Near ${tags['addr:suburb']}` : 'Municipal Grid',
                coordinates: { lat: stLat, lng: stLon },
                distanceKm: distance,
                fuels,
                rateDisplay,
                rateNum: isCharging ? 18.5 : hasCng ? 85.0 : 104.88,
                operationalStatus: 'Operational',
                accessType: 'Public 24/7',
                contact: tags.phone || tags['contact:phone'] || '+91 1800 233 3555',
                rating: Math.round((4.5 + ((Number(el.id) % 5) * 0.08)) * 10) / 10,
                googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${stLat},${stLon}`
              };
            });

            overpassCache.set(cacheKey, { timestamp: Date.now(), data: stations });
            resolve(stations);
          } catch (e) {
            resolve([]);
          }
        });
      }
    );

    req.on('error', () => resolve([]));
    req.on('timeout', () => {
      req.destroy();
      resolve([]);
    });
  });
}

module.exports = {
  STATE_FUEL_RATES,
  getFuelRatesForState,
  calculateDistanceKm,
  getReverseGeocodeArea,
  fetchLiveOverpassStations
};
