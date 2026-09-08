const https = require('https');

// Test fetching real EV charging stations from GitHub e-AMRIT open data
const url = 'https://raw.githubusercontent.com/mglsj/indian_ev_charging_stations/main/data.json';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const stations = JSON.parse(data);
      console.log('Total real stations in dataset:', stations.length);
      const jaipurStations = stations.filter(s =>
        (s.city && s.city.toLowerCase().includes('jaipur')) ||
        (s.state && s.state.toLowerCase().includes('rajasthan')) ||
        (s.address && s.address.toLowerCase().includes('jaipur')) ||
        (s.name && s.name.toLowerCase().includes('jaipur'))
      );
      console.log('Total real Jaipur / Rajasthan stations found:', jaipurStations.length);
      console.log('Sample Jaipur stations:');
      jaipurStations.slice(0, 5).forEach((st, i) => {
        console.log(`Station ${i+1}:`, {
          name: st.name || st.title || st.station_name,
          address: st.address || st.location,
          city: st.city,
          state: st.state,
          lat: st.latitude || st.lat,
          lon: st.longitude || st.lon || st.lng,
          operator: st.operator || st.vendor || 'NITI Aayog / DISCOM',
          connectors: st.connectors || st.charger_type || 'Type-2 / CCS2 Fast DC'
        });
      });
    } catch(e) {
      console.error('Error parsing:', e.message, data.slice(0, 200));
    }
  });
}).on('error', e => console.error('Request error:', e.message));
