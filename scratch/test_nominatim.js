const https = require('https');

// Test Nominatim for EV charging stations in Jaipur
const url = 'https://nominatim.openstreetmap.org/search?q=EV+charging+Jaipur&format=json&limit=25';

https.get(url, { headers: { 'User-Agent': 'UrbanPark-SmartCity-Jaipur/1.0 (contact@urbanpark.in)' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Nominatim results count:', parsed.length);
      parsed.slice(0, 5).forEach(item => {
        console.log({
          name: item.display_name,
          lat: item.lat,
          lon: item.lon,
          type: item.type
        });
      });
    } catch(e) {
      console.error('Nominatim parse error:', e.message);
    }
  });
}).on('error', e => console.error('Nominatim request error:', e.message));
