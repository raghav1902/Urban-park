const http = require('http');

function test(url, label) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`=== ${label} ===`);
          console.log('Location Name:', json.locationName);
          console.log('Total Found:', json.totalFound);
          const items = json.lots || json.stations || [];
          items.slice(0, 5).forEach((item, i) => {
            console.log(` ${i + 1}. [${item.category || 'parking'}] ${item.name} | ${item.distanceKm} km | ${item.location || item.address}`);
          });
        } catch (e) {
          console.error(label, 'Parse error:', e.message);
        }
        resolve();
      });
    }).on('error', e => {
      console.error(label, 'Request error:', e.message);
      resolve();
    });
  });
}

async function run() {
  await test('http://localhost:5000/api/parking/nearby?lat=26.9124&lng=75.8016', 'PARKING NEAR C-SCHEME');
  console.log('\n');
  await test('http://localhost:5000/api/ev-stations/nearby?lat=26.9124&lng=75.8016', 'FUEL & EV NEAR C-SCHEME');
}

run();
