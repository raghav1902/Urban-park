const https = require('https');

// Test Overpass for amenity=fuel in Jaipur
const query = `[out:json][timeout:25];
(
  node["amenity"="fuel"](around:15000, 26.9124, 75.7873);
  way["amenity"="fuel"](around:15000, 26.9124, 75.7873);
);
out center 25;`;

const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

https.get(url, { headers: { 'User-Agent': 'UrbanPark-SmartCity-App/1.0' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Total real fuel/petrol stations found in OSM around Jaipur:', parsed.elements.length);
      parsed.elements.slice(0, 10).forEach((el, i) => {
        const tags = el.tags || {};
        console.log(`Station ${i+1}:`, {
          name: tags.name || tags.operator || tags.brand || 'Fuel Station',
          brand: tags.brand || tags.operator,
          fuel_cng: tags['fuel:cng'] || tags['cng'],
          lat: el.lat || el.center?.lat,
          lon: el.lon || el.center?.lon,
          address: tags['addr:street'] || tags['addr:full'] || tags['name']
        });
      });
    } catch(e) {
      console.error('Parse error:', e.message, data.slice(0, 200));
    }
  });
}).on('error', (e) => console.error('Request error:', e.message));
