const https = require('https');

const query = `[out:json][timeout:25];
(
  node["amenity"="charging_station"](around:50000, 26.9124, 75.7873);
  node["name"~"EV|Charging|Ather|Tata Power",i](around:50000, 26.9124, 75.7873);
  way["name"~"EV|Charging|Ather|Tata Power",i](around:50000, 26.9124, 75.7873);
);
out center 25;`;

const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

https.get(url, { headers: { 'User-Agent': 'UrbanPark/1.0' } }, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Results count:', parsed.elements.length);
      parsed.elements.forEach((el, i) => {
        console.log(`Match ${i+1}:`, el.tags?.name, el.lat || el.center?.lat, el.lon || el.center?.lon, el.tags);
      });
    } catch (e) {
      console.error(e.message, data.slice(0, 150));
    }
  });
}).on('error', e => console.error(e.message));
