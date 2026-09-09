const https = require('https');

const query = `[out:json][timeout:25];
(
  node["amenity"="charging_station"](around:25000, 26.9124, 75.7873);
  way["amenity"="charging_station"](around:25000, 26.9124, 75.7873);
);
out center 30;`;

const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

https.get(url, { headers: { 'User-Agent': 'UrbanPark-SmartCity-App/1.0' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Total real EV stations found in Jaipur:', parsed.elements.length);
      parsed.elements.slice(0, 5).forEach((el, i) => {
        console.log(`Station #${i + 1}:`, {
          name: el.tags.name || el.tags.brand || el.tags.operator || 'EV Charging Station',
          operator: el.tags.operator || el.tags.brand,
          lat: el.lat || el.center?.lat,
          lon: el.lon || el.center?.lon,
          socket: el.tags['socket:type2'] || el.tags['socket:ccs_combo_2'] || el.tags.socket || 'Type 2 / CCS2',
          capacity: el.tags.capacity || '2-4 Bays'
        });
      });
    } catch (e) {
      console.error('Parse error:', e.message, data.slice(0, 200));
    }
  });
}).on('error', (e) => console.error('Request error:', e.message));
