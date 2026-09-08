const https = require('https');

const lat = 26.9751;
const lon = 75.7566;
const radius = 5000; // 5km

const query = `[out:json][timeout:15];
(
  node["amenity"="fuel"](around:${radius}, ${lat}, ${lon});
  way["amenity"="fuel"](around:${radius}, ${lat}, ${lon});
  node["amenity"="charging_station"](around:${radius}, ${lat}, ${lon});
  way["amenity"="charging_station"](around:${radius}, ${lat}, ${lon});
);
out center 40;`;

const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

console.log('Fetching live stations within 5km of', lat, lon);

https.get(url, { headers: { 'User-Agent': 'UrbanParkApp/1.0' } }, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    try {
      const data = JSON.parse(d);
      console.log('Total stations found within 5km:', data.elements.length);
      data.elements.forEach(e => {
        const stationLat = e.lat || e.center?.lat;
        const stationLon = e.lon || e.center?.lon;
        const name = e.tags?.name || e.tags?.brand || (e.tags?.amenity === 'charging_station' ? 'EV Charging Hub' : 'Fuel Station');
        const brand = e.tags?.brand || e.tags?.operator || 'Fuel Network';
        console.log(`- [${e.tags?.amenity}] ${name} (${brand}) at ${stationLat}, ${stationLon}`);
      });
    } catch (err) {
      console.error('Parse error:', err);
    }
  });
}).on('error', e => console.error(e));
