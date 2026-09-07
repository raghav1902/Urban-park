import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../utils/api';
import { formatCurrency, getDynamicPrice } from '../utils/pricing';
import { useAuth } from '../context/AuthContext';
import ParkingMap from '../components/ParkingMap';
import {
  IconSearch,
  IconMapPin,
  IconArrowRight,
  IconBuilding,
  IconCar
} from '../components/Icons';

/**
 * Enterprise Dashboard Page
 * Responsive 2-column to 1-column layout, pure white theme, clean mapping & live updates
 */
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
      setOccupancyData((prev) => ({ ...prev, [data.lotId]: data }));
    });
    return () => socket.disconnect();
  }, []);

  const fetchLots = async () => {
    try {
      const res = await api.get('/parking/lots');
      setLots(res.data);
    } catch (err) {
      console.error('Failed to fetch parking lots:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLots = lots.filter(
    (lot) =>
      lot.name.toLowerCase().includes(search.toLowerCase()) ||
      lot.location.toLowerCase().includes(search.toLowerCase()) ||
      lot.city?.toLowerCase().includes(search.toLowerCase())
  );

  const getLotOccupancy = (lot) => {
    const live = occupancyData[lot._id];
    if (live) {
      return {
        available: live.available,
        occupied: live.occupied,
        pct: live.occupancyPercent
      };
    }
    return {
      available: lot.availableSlots || 0,
      occupied: lot.occupiedSlots || 0,
      pct: lot.occupancyPercent || 0
    };
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingTop: '64px' }}>
      {/* Header Bar */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '36px 0 28px' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '20px'
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#2563eb',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '6px'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
                Jaipur Metropolitan Area
              </div>
              <h1
                style={{
                  fontSize: 'clamp(24px, 4vw, 32px)',
                  fontWeight: '800',
                  color: '#0f172a',
                  letterSpacing: '-0.02em'
                }}
              >
                Parking Hubs & Facilities
              </h1>
              <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>
                Real-time occupancy status streamed directly from IoT zone sensors.
              </p>
            </div>

            {/* Search Bar */}
            <div style={{ width: '100%', maxWidth: '360px', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <IconSearch size={16} />
              </div>
              <input
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search facility by name or road..."
                style={{ paddingLeft: '38px', height: '42px', fontSize: '14px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Responsive Grid */}
      <div className="container" style={{ paddingBottom: '60px', paddingTop: '32px' }}>
        <div className="dashboard-grid">
          {/* Facility List */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                Showing {filteredLots.length} Active {filteredLots.length === 1 ? 'Zone' : 'Zones'}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#059669',
                  fontWeight: '600'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} />
                Telemetry Active
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card" style={{ height: '140px', background: '#ffffff' }} />
                ))}
              </div>
            ) : filteredLots.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <IconBuilding size={36} color="#94a3b8" />
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', marginTop: '12px' }}>
                  No parking zones match your search
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                  Try clearing your search terms or view all Jaipur zones.
                </p>
                <button
                  onClick={() => setSearch('')}
                  className="btn btn-secondary"
                  style={{ marginTop: '16px' }}
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredLots.map((lot) => {
                  const { available, pct } = getLotOccupancy(lot);
                  const pricing = getDynamicPrice(lot.pricePerHour, currentHour);
                  const isFull = available === 0;

                  return (
                    <div
                      key={lot._id}
                      className="card"
                      style={{
                        padding: '22px 24px',
                        background: '#ffffff',
                        position: 'relative'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '16px'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: '240px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                              {lot.name}
                            </h3>
                            {pricing.label !== 'Normal' && (
                              <span className={`badge ${pricing.label === 'Peak' ? 'badge-red' : 'badge-blue'}`}>
                                {pricing.label} Rate
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '13.5px',
                              color: '#64748b',
                              marginBottom: '16px'
                            }}
                          >
                            <IconMapPin size={15} color="#94a3b8" />
                            <span>{lot.location}</span>
                          </div>

                          {/* Metric Indicators */}
                          <div style={{ display: 'flex', gap: '28px', marginBottom: '16px' }}>
                            <div>
                              <div
                                style={{
                                  fontSize: '24px',
                                  fontWeight: '800',
                                  color: isFull ? '#dc2626' : '#059669',
                                  letterSpacing: '-0.02em'
                                }}
                              >
                                {available}
                              </div>
                              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                                Available
                              </div>
                            </div>

                            <div>
                              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
                                {pct}%
                              </div>
                              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                                Occupancy
                              </div>
                            </div>

                            <div>
                              <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563eb', letterSpacing: '-0.02em' }}>
                                {formatCurrency(pricing.price)}
                              </div>
                              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                                Hourly Rate
                              </div>
                            </div>
                          </div>

                          {/* Amenity Badges */}
                          {lot.amenities && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {lot.amenities.slice(0, 4).map((a) => (
                                <span key={a} className="badge badge-gray" style={{ fontSize: '11.5px' }}>
                                  {a}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action CTA */}
                        <div>
                          <Link to={`/lot/${lot._id}`} style={{ textDecoration: 'none' }}>
                            <button
                              className="btn btn-primary"
                              disabled={isFull}
                              style={{ width: '100%', padding: '10px 18px' }}
                            >
                              {isFull ? 'Capacity Reached' : 'Inspect Slots'}
                              <IconArrowRight size={15} />
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interactive Map Viewport Column */}
          <div className="map-column">
            <div className="card" style={{ padding: '16px', background: '#ffffff', height: '100%' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                  Jaipur City Geography
                </div>
                <span className="badge badge-blue">Interactive Map</span>
              </div>

              {/* Modularized Map Subcomponent */}
              <ParkingMap lots={lots} getLotOccupancy={getLotOccupancy} />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Responsive Style */}
      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 960px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          .map-column {
            order: -1;
            margin-bottom: 20px;
          }
        }
      `}</style>
    </div>
  );
}
