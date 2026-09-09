const https = require('https');

// Test Overpass with broader bounding box around Rajasthan / Jaipur / Delhi NCR
// bbox: minLat, minLon, maxLat, maxLon
// Jaipur: 26.75, 75.65, 27.05, 75.95
const query = `[out:json][timeout:30];
(
  node["amenity"="charging_station"](26.6, 75.5, 27.2, 76.1);
  way["amenity"="charging_station"](26.6, 75.5, 27.2, 76.1);
  node["amenity"="fuel"]["fuel:electricity"="yes"](26.6, 75.5, 27.2, 76.1);
  node["motorcar"="yes"]["amenity"="charging_station"](26.6, 75.5, 27.2, 76.1);
);
out center 50;`;

const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

https.get(url, { headers: { 'User-Agent': 'UrbanPark-SmartCity-App/1.0' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Results in Jaipur bbox:', parsed.elements.length);
      parsed.elements.forEach((el, i) => {
        console.log(`Station ${i+1}:`, el.tags?.name || el.tags?.operator || el.tags?.brand || 'EV Point', el.lat, el.lon);
      });
    } catch(e) {
      console.error('Error:', e.message, data.slice(0, 150));
    }
  });
}).on('error', e => console.error('Error:', e.message));
