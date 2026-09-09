const https = require('https');

const query = `[out:json][timeout:15];
(
  node["amenity"="parking"](around:5000, 26.9124, 75.7873);
  way["amenity"="parking"](around:5000, 26.9124, 75.7873);
  node["amenity"="fuel"](around:5000, 26.9124, 75.7873);
);
out center 25;`;

const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

https.get(url, { headers: { 'User-Agent': 'UrbanParkTester/1.0' }, timeout: 12000 }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Total elements:', json.elements?.length);
      json.elements?.forEach((el, i) => {
        const t = el.tags || {};
        console.log(`[${i}] ${t.amenity} | name: "${t.name || ''}" | brand: "${t.brand || ''}" | operator: "${t.operator || ''}" | street: "${t['addr:street'] || ''}" | suburb: "${t['addr:suburb'] || ''}"`);
      });
    } catch(e) {
      console.error('Parse error:', e.message);
    }
  });
}).on('error', e => console.error('Request error:', e.message));
