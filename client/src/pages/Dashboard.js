import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import io from 'socket.io-client';
import api from '../utils/api';
import { formatCurrency, getDynamicPrice } from '../utils/pricing';
import { useAuth } from '../context/AuthContext';

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

export default function Dashboard() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [occupancyData, setOccupancyData] = useState({});
  const { user } = useAuth();
  const currentHour = new Date().getHours();

  useEffect(() => {
    fetchLots();
    const socket = io('http://localhost:5000');
    socket.on('lot-occupancy-update', (data) => {
      setOccupancyData(prev => ({ ...prev, [data.lotId]: data }));
    });
    return () => socket.disconnect();
  }, []);

  const fetchLots = async () => {
    try {
      const res = await api.get('/parking/lots');
      setLots(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = lots.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.location.toLowerCase().includes(search.toLowerCase())
  );

  const getLotOccupancy = (lot) => {
    const live = occupancyData[lot._id];
    if (live) return { available: live.available, occupied: live.occupied, pct: live.occupancyPercent };
    return { available: lot.availableSlots || 0, occupied: lot.occupiedSlots || 0, pct: lot.occupancyPercent || 0 };
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', paddingTop: '64px' }}>
      {/* Header */}
      <div style={{ padding: '40px 24px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px' }}>
          Find Parking, <span style={{ color: 'var(--green)' }}>{user?.name?.split(' ')[0]}</span>
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '16px', marginBottom: '28px' }}>
          Live availability across Jaipur — updates every 5 seconds
        </p>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 500 }}>
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}>🔍</span>
          <input
            className="input" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by location or name..."
            style={{ paddingLeft: '48px', fontSize: '16px', height: '52px' }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 60px', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
        {/* Lots list */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>{filtered.length} Parking Zones</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--green)' }}>
              <span style={{ width: 6, height: 6, background: 'var(--green)', borderRadius: '50%', animation: 'pulse-green 2s infinite' }}></span>
              Live Updates
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 160 }} />)}
            </div>
          ) : filtered.map(lot => {
            const { available, pct } = getLotOccupancy(lot);
            const pricing = getDynamicPrice(lot.pricePerHour, currentHour);
            const isFull = available === 0;

            return (
              <div key={lot._id} className="card" style={{ marginBottom: '16px', position: 'relative', overflow: 'hidden', transition: 'all 0.3s' }}>
                {/* Occupancy bar */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0,
                  height: '3px', width: `${pct}%`,
                  background: pct > 80 ? '#ef4444' : pct > 60 ? 'var(--amber)' : 'var(--green)',
                  transition: 'width 1s ease'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{lot.name}</h3>
                      {pricing.label !== 'Normal' && (
                        <span className={`badge ${pricing.label === 'Peak' ? 'badge-red' : 'badge-blue'}`}>
                          {pricing.label === 'Peak' ? '🔥' : '🌙'} {pricing.label}
                        </span>
                      )}
                    </div>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '16px' }}>
                      📍 {lot.location}
                    </p>

                    <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: isFull ? '#ef4444' : 'var(--green)', fontFamily: 'JetBrains Mono' }}>
                          {available}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Available
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'JetBrains Mono' }}>{pct}%</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Occupied
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>
                          {formatCurrency(pricing.price)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Per Hour
                        </div>
                      </div>
                    </div>

                    {lot.amenities && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {lot.amenities.slice(0, 3).map(a => (
                          <span key={a} className="badge badge-blue" style={{ fontSize: '11px' }}>{a}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ marginLeft: '16px' }}>
                    <Link to={`/lot/${lot._id}`}>
                      <button className="btn-primary" disabled={isFull} style={{ whiteSpace: 'nowrap' }}>
                        {isFull ? '🚫 Full' : 'View Slots →'}
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Map */}
        <div style={{ position: 'sticky', top: '80px', height: 'calc(100vh - 120px)' }}>
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Jaipur Map</h2>
          </div>
          <MapContainer
            center={[26.9124, 75.7873]} zoom={13}
            style={{ height: 'calc(100% - 40px)', width: '100%', borderRadius: '16px', border: '1px solid var(--navy-border)' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            />
            {lots.map(lot => (
              <Marker key={lot._id} position={[lot.coordinates.lat, lot.coordinates.lng]} icon={greenIcon}>
                <Popup>
                  <div style={{ fontFamily: 'Outfit, sans-serif', minWidth: 180 }}>
                    <strong>{lot.name}</strong><br />
                    <span style={{ color: '#666', fontSize: '12px' }}>{lot.location}</span><br /><br />
                    <span style={{ color: '#00b85e' }}>Available: {getLotOccupancy(lot).available} slots</span><br />
                    <span>₹{lot.pricePerHour}/hr</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
