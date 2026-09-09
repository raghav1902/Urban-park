const https = require('https');

// Query Overpass for charging stations in India
const query = `[out:json][timeout:25];
area["ISO3166-1"="IN"]->.india;
(
  node["amenity"="charging_station"](area.india);
);
out 10;`;

const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

https.get(url, { headers: { 'User-Agent': 'UrbanPark-SmartCity-App/1.0' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Results across India:', parsed.elements.length);
      parsed.elements.forEach((el, i) => {
        console.log(`India station ${i+1}:`, el.tags?.name || el.tags?.operator || el.tags?.brand, el.lat, el.lon);
      });
    } catch(e) {
      console.error('Error:', e.message, data.slice(0, 150));
    }
  });
}).on('error', e => console.error('Error:', e.message));
