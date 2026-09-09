const https = require('https');

// Open Charge Map public test
const url = 'https://api.openchargemap.io/v3/poi/?output=json&latitude=26.9124&longitude=75.7873&distance=50&distanceunit=KM&maxresults=20&key=c53bca5e-fbda-43a9-8fb3-e63d41fdf79a';

https.get(url, { headers: { 'User-Agent': 'UrbanPark-SmartCity-App/1.0' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Total OCM real EV stations:', Array.isArray(parsed) ? parsed.length : parsed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log('First station:', {
          title: parsed[0].AddressInfo?.Title,
          address: parsed[0].AddressInfo?.AddressLine1,
          town: parsed[0].AddressInfo?.Town,
          lat: parsed[0].AddressInfo?.Latitude,
          lng: parsed[0].AddressInfo?.Longitude,
          operator: parsed[0].OperatorInfo?.Title,
          connections: parsed[0].Connections?.map(c => c.ConnectionType?.Title)
        });
      }
    } catch(e) {
      console.log('Raw response:', data.slice(0, 300));
    }
  });
}).on('error', (e) => console.error('OCM error:', e.message));
