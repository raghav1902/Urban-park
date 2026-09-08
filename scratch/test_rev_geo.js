const https = require('https');

function getReverseGeocode(lat, lng) {
  return new Promise((resolve) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const req = https.get(url, { headers: { 'User-Agent': 'UrbanParkApp/1.0' }, timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const addr = parsed.address || {};
          const area = addr.suburb || addr.neighbourhood || addr.residential || addr.subdistrict || addr.county || 'Jaipur Area';
          const city = addr.city || addr.state_district || 'Jaipur';
          resolve(`${area}, ${city}`);
        } catch (e) {
          resolve('Jaipur Region');
        }
      });
    });
    req.on('error', () => resolve('Jaipur Region'));
    req.on('timeout', () => {
      req.destroy();
      resolve('Jaipur Region');
    });
  });
}

(async () => {
  const area = await getReverseGeocode(26.9751, 75.7566);
  console.log('Result for 26.9751, 75.7566:', area);
})();
