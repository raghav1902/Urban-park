const https = require('https');

function fetchRealParking(lat, lon, radiusMeters = 5000) {
  return new Promise((resolve) => {
    const query = `[out:json][timeout:10];(node["amenity"="parking"](around:${radiusMeters}, ${lat}, ${lon});way["amenity"="parking"](around:${radiusMeters}, ${lat}, ${lon}););out center 30;`;
    const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
    
    https.get(url, { headers: { 'User-Agent': 'UrbanParkApp/1.0' }, timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const elements = parsed.elements || [];
          console.log(`Found ${elements.length} real parking locations around (${lat}, ${lon}):`);
          elements.slice(0, 8).forEach((e, idx) => {
            const stLat = e.lat || e.center?.lat;
            const stLon = e.lon || e.center?.lon;
            const tags = e.tags || {};
            const name = tags.name || (tags.operator ? `${tags.operator} Parking` : `Public Parking Facility #${idx + 1}`);
            console.log(`- ${name} (${tags.parking || 'surface'}) at ${stLat}, ${stLon}`);
          });
          resolve(elements);
        } catch (err) {
          console.error(err);
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

(async () => {
  console.log('--- TEST 1: Real Parking near Vidyadhar Nagar Jaipur ---');
  await fetchRealParking(26.9751, 75.7566, 5000);

  console.log('\n--- TEST 2: Real Parking near Connaught Place Delhi ---');
  await fetchRealParking(28.6317, 77.2193, 5000);
})();
