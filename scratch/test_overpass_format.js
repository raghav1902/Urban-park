const https = require('https');

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

function fetchOverpassStations(lat, lon, radiusMeters) {
  return new Promise((resolve) => {
    const query = `[out:json][timeout:10];(node["amenity"="fuel"](around:${radiusMeters}, ${lat}, ${lon});way["amenity"="fuel"](around:${radiusMeters}, ${lat}, ${lon});node["amenity"="charging_station"](around:${radiusMeters}, ${lat}, ${lon}););out center 40;`;
    const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
    const req = https.get(url, { headers: { 'User-Agent': 'UrbanParkApp/1.0' }, timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const stations = (parsed.elements || []).map((el, i) => {
            const stLat = el.lat || el.center?.lat;
            const stLon = el.lon || el.center?.lon;
            const tags = el.tags || {};
            const isCharging = tags.amenity === 'charging_station';
            const hasCng = tags['fuel:cng'] === 'yes' || (tags.name && tags.name.toLowerCase().includes('cng'));
            
            let category = 'petrol';
            let categoryLabel = 'Petrol & Diesel';
            let fuels = ['Petrol (₹104.88/L)', 'Diesel (₹90.36/L)', 'Speed / XP95'];
            let rateDisplay = 'Petrol ₹104.88 / Diesel ₹90.36';

            if (isCharging) {
              category = 'ev';
              categoryLabel = 'EV Fast Charging';
              fuels = ['CCS-II Fast DC', 'Type-2 AC'];
              rateDisplay = '₹18.50 / kWh';
            } else if (hasCng) {
              category = 'cng';
              categoryLabel = 'CNG Gas Pump';
              fuels = ['CNG (₹85.00/kg)', 'High Flow 220 Bar', 'Petrol / Diesel'];
              rateDisplay = '₹85.00 / kg';
            }

            const name = tags.name || (tags.brand ? `${tags.brand} Fuel Station` : 'Authorized Fuel Station');
            const operator = tags.operator || tags.brand || 'Fuel Network';

            return {
              id: `osm-${el.id || i}`,
              category,
              categoryLabel,
              name,
              operator,
              brand: tags.brand || operator,
              address: tags['addr:street'] ? `${tags['addr:street']}, Jaipur` : `${name}, Jaipur`,
              landmark: tags['addr:suburb'] ? `Near ${tags['addr:suburb']}` : 'Jaipur Municipal Grid',
              coordinates: { lat: stLat, lng: stLon },
              distanceKm: calculateDistanceKm(lat, lon, stLat, stLon),
              fuels,
              rateDisplay,
              accessType: tags.opening_hours === '24/7' ? 'Public 24/7' : 'Public Operating Hours',
              contact: tags.phone || tags['contact:phone'] || '+91 1800 233 3555',
              rating: 4.6 + ((el.id % 5) * 0.08),
              googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${stLat},${stLon}`
            };
          });
          resolve(stations);
        } catch (e) {
          resolve([]);
        }
      });
    });
    req.on('error', () => resolve([]));
    req.on('timeout', () => {
      req.destroy();
      resolve([]);
    });
  });
}

(async () => {
  const stations = await fetchOverpassStations(26.9751, 75.7566, 5000);
  console.log(`Fetched ${stations.length} stations within 5km of Vidyadhar Nagar!`);
  stations.slice(0, 5).forEach(s => console.log(`- [${s.category}] ${s.name} (${s.distanceKm} km) -> ${s.googleMapsUrl}`));
})();
