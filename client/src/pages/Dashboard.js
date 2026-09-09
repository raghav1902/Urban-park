import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import api from '../utils/api';
import { getDynamicPrice } from '../utils/pricing';
import ParkingMap from '../components/ParkingMap';
import { toast } from 'react-toastify';
import { IconBuilding } from '../components/Icons';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardSearchBar from '../components/dashboard/DashboardSearchBar';
import ParkingLotCard from '../components/dashboard/ParkingLotCard';

/**
 * Global Real-Time Parking & Telemetry Dashboard
 */
export default function Dashboard() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationSearchInput, setLocationSearchInput] = useState('');
  const [locationAreaName, setLocationAreaName] = useState('Detecting Your Location...');
  const [userCoords, setUserCoords] = useState({ lat: 26.9124, lng: 75.8016 });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [radiusKm, setRadiusKm] = useState('15');
  const [occupancyData, setOccupancyData] = useState({});
  const currentHour = new Date().getHours();
  const hasDetectedRef = useRef(false);

  useEffect(() => {
    if (!hasDetectedRef.current) {
      hasDetectedRef.current = true;
      autoDetectUserLocation();
    }
    const socket = io('http://localhost:5000');
    socket.on('lot-occupancy-update', (data) => {
      setOccupancyData((prev) => ({ ...prev, [data.lotId]: data }));
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    fetchNearbyParking();
  }, [userCoords, radiusKm]);

  const autoDetectUserLocation = () => {
    if (!navigator.geolocation) {
      fetchNearbyParking();
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 20);
        setGpsAccuracy(accuracy);
        setUserCoords({ lat, lng });

        try {
          const revRes = await api.get('/ev-stations/reverse-geocode', { params: { lat, lng } });
          if (revRes.data.success && revRes.data.locationName) {
            setLocationAreaName(revRes.data.locationName);
            const accText = accuracy <= 100 ? ` (±${accuracy}m precision)` : '';
            toast.success(`Location Acquired: ${revRes.data.locationName}${accText}`, { toastId: 'location-acquired' });
          }
        } catch (e) {
          console.warn('Reverse geocode error:', e);
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        console.warn('Geolocation denied/unavailable:', err);
        setLocationAreaName('C-Scheme / Central Jaipur');
        setUserCoords({ lat: 26.9124, lng: 75.8016 });
        toast.info('GPS unavailable. Click any Quick Sector chip or search your area below.', { toastId: 'gps-unavailable' });
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const handleSelectQuickSector = (sector) => {
    setUserCoords({ lat: sector.lat, lng: sector.lng });
    setLocationAreaName(sector.name);
    setGpsAccuracy(15);
    toast.success(`Area switched to ${sector.label}`, { toastId: 'quick-sector' });
  };

  const fetchNearbyParking = async () => {
    setLoading(true);
    try {
      const params = {
        lat: userCoords.lat,
        lng: userCoords.lng,
        radiusKm: radiusKm === 'all' ? 50 : radiusKm,
        search
      };

      const res = await api.get('/parking/nearby', { params });
      if (res.data.success) {
        setLots(res.data.lots);
        if (res.data.locationName) {
          setLocationAreaName(res.data.locationName);
        }
      }
    } catch (err) {
      console.error('Failed to fetch nearby parking lots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSearchSubmit = async (e) => {
    e.preventDefault();
    if (!locationSearchInput.trim()) return;

    setGpsLoading(true);
    try {
      const query = encodeURIComponent(locationSearchInput.trim());
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
      const data = await res.json();

      if (data && data.length > 0) {
        const target = data[0];
        const newLat = parseFloat(target.lat);
        const newLng = parseFloat(target.lon);
        setUserCoords({ lat: newLat, lng: newLng });
        setLocationAreaName(target.display_name.split(',').slice(0, 2).join(','));
        toast.success(`Shifted Location: ${target.display_name.split(',')[0]}`, { toastId: 'shifted-location' });
      } else {
        toast.error('Location not found. Please try another area or city name.', { toastId: 'loc-not-found' });
      }
    } catch (err) {
      toast.error('Search request failed. Please check your internet connection.', { toastId: 'search-failed' });
    } finally {
      setGpsLoading(false);
    }
  };

  const filteredLots = lots.filter(
    (lot) =>
      lot.name.toLowerCase().includes(search.toLowerCase()) ||
      lot.location.toLowerCase().includes(search.toLowerCase()) ||
      (lot.city && lot.city.toLowerCase().includes(search.toLowerCase()))
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
      {/* Header & Location Controls Bar */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '28px 0 22px' }}>
        <div className="container">
          <DashboardHeader
            locationAreaName={locationAreaName}
            userCoords={userCoords}
            gpsLoading={gpsLoading}
            gpsAccuracy={gpsAccuracy}
            autoDetectUserLocation={autoDetectUserLocation}
            onSelectQuickSector={handleSelectQuickSector}
          />

          <DashboardSearchBar
            locationSearchInput={locationSearchInput}
            setLocationSearchInput={setLocationSearchInput}
            handleLocationSearchSubmit={handleLocationSearchSubmit}
            gpsLoading={gpsLoading}
            search={search}
            setSearch={setSearch}
            radiusKm={radiusKm}
            setRadiusKm={setRadiusKm}
          />
        </div>
      </div>

      {/* Main Content: Responsive Grid */}
      <div className="container" style={{ paddingBottom: '60px', paddingTop: '28px' }}>
        <div className="dashboard-grid">
          {/* Facility List */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>
                Showing {filteredLots.length} Real Parking {filteredLots.length === 1 ? 'Space' : 'Spaces'} Near {locationAreaName.split(',')[0]}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#059669', fontWeight: '700' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} />
                Real-Time Telemetry Active
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card" style={{ height: '140px', background: '#ffffff' }} />
                ))}
              </div>
            ) : filteredLots.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px 24px', background: '#ffffff' }}>
                <IconBuilding size={36} color="#94a3b8" />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginTop: '12px' }}>
                  No parking spaces match your search criteria
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                  Try clearing your search terms or expanding your proximity radius filter.
                </p>
                <button
                  onClick={() => {
                    setSearch('');
                    setRadiusKm('all');
                  }}
                  className="btn btn-secondary"
                  style={{ marginTop: '16px' }}
                >
                  Reset Proximity & Search Filters
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredLots.map((lot) => (
                  <ParkingLotCard
                    key={lot._id}
                    lot={lot}
                    occupancy={getLotOccupancy(lot)}
                    pricing={getDynamicPrice(lot.pricePerHour, currentHour)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Interactive Map Viewport Column */}
          <div className="map-column">
            <div className="card" style={{ padding: '16px', background: '#ffffff', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                    Live Location Geography
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Centered at {locationAreaName.split(',')[0]}
                  </div>
                </div>
                <span className="badge badge-blue">Interactive Map</span>
              </div>

              <ParkingMap lots={filteredLots} userCoords={userCoords} getLotOccupancy={getLotOccupancy} />
            </div>
          </div>
        </div>
      </div>

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
