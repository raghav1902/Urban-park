import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import FuelRateTicker from '../components/stations/FuelRateTicker';
import LocationSearchBar from '../components/stations/LocationSearchBar';
import StationCard from '../components/stations/StationCard';
import EvChargeCalculatorModal from '../components/stations/EvChargeCalculatorModal';
import { IconBatteryCharging, IconFuel, IconZap, IconSparkles, IconGlobe, IconLeaf, IconNavigation } from '../components/Icons';

/**
 * Multi-Fuel & EV Infrastructure Discovery Page
 * Real-world verified dataset with live GPS proximity distance, official fuel rates, and 1-click Google Maps navigation.
 */
export default function EVStationsNearby() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState({ lat: 26.9124, lng: 75.7873 });
  const [locationSource, setLocationSource] = useState('Central Sector');
  const [locationAreaName, setLocationAreaName] = useState('Detecting Your Location...');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [searchCityQuery, setSearchCityQuery] = useState('');
  const [searchCityLoading, setSearchCityLoading] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [fuelRates, setFuelRates] = useState({
    petrol: '₹104.88 / L',
    diesel: '₹90.36 / L',
    cng: '₹85.00 / kg',
    evUnit: '₹18.50 / kWh'
  });

  const [activeCategory, setActiveCategory] = useState('all');
  const [radiusKm, setRadiusKm] = useState('5');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    autoDetectUserLocation();
  }, []);

  useEffect(() => {
    fetchStations();
  }, [userCoords, radiusKm, activeCategory]);

  const autoDetectUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationAreaName('Jaipur Central Hub');
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
        setLocationSource('Live GPS Sensor');

        try {
          const revRes = await api.get('/ev-stations/reverse-geocode', { params: { lat, lng } });
          if (revRes.data.success && revRes.data.locationName) {
            setLocationAreaName(revRes.data.locationName);
          } else {
            setLocationAreaName('Live GPS Location');
          }
        } catch (e) {
          setLocationAreaName('Live GPS Location');
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        setLocationAreaName('C-Scheme / Central Jaipur');
        setUserCoords({ lat: 26.9124, lng: 75.8016 });
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const handleSelectQuickSector = (sec) => {
    setUserCoords({ lat: sec.lat, lng: sec.lng });
    setLocationAreaName(sec.name);
    setLocationSource('Selected Sector');
    setGpsAccuracy(15);
    toast.success(`Search area switched to ${sec.label}`, { toastId: 'ev-quick-sector' });
  };

  const handleSearchCitySubmit = async (e) => {
    if (e) e.preventDefault();
    if (!searchCityQuery.trim()) return;

    setSearchCityLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchCityQuery.trim())}&format=json&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const displayName = data[0].display_name || searchCityQuery;
        setUserCoords({ lat, lng });
        setLocationAreaName(displayName);
        setLocationSource('User Custom Search');
        toast.success(`Search area updated: ${displayName.split(',')[0]}`, { toastId: 'ev-search-area' });
      } else {
        toast.error('Location not found. Please try another city or locality name.');
      }
    } catch (err) {
      console.error('Nominatim Geocoding Error:', err);
      toast.error('Failed to search area. Please check connection.');
    } finally {
      setSearchCityLoading(false);
    }
  };

  const fetchStations = async () => {
    setLoading(true);
    try {
      const params = {
        lat: userCoords.lat,
        lng: userCoords.lng,
        radiusKm: radiusKm === 'all' ? 50 : radiusKm,
        category: activeCategory
      };

      const res = await api.get('/ev-stations/nearby', { params });
      if (res.data.success) {
        setStations(res.data.stations);
        if (res.data.locationName && locationSource !== 'User Custom Search') {
          setLocationAreaName(res.data.locationName);
        }
        if (res.data.currentFuelRates) {
          setFuelRates({
            petrol: res.data.currentFuelRates.petrol || '₹104.88 / L',
            diesel: res.data.currentFuelRates.diesel || '₹90.36 / L',
            cng: res.data.currentFuelRates.cng || '₹85.00 / kg',
            evUnit: res.data.currentFuelRates.evUnit || '₹18.50 / kWh'
          });
        }
      }
    } catch (err) {
      console.error('Failed to load stations:', err);
      toast.error('Unable to fetch nearby fuel stations.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = stations.filter((st) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      st.name.toLowerCase().includes(q) ||
      st.operator.toLowerCase().includes(q) ||
      st.address.toLowerCase().includes(q) ||
      (st.landmark && st.landmark.toLowerCase().includes(q))
    );
  });

  const categoryTabs = [
    { id: 'all', label: 'All Fuel & EV Hubs', renderIcon: (props) => <IconGlobe {...props} /> },
    { id: 'ev', label: 'EV Fast Charging', renderIcon: (props) => <IconZap {...props} /> },
    { id: 'cng', label: 'CNG Gas Stations', renderIcon: (props) => <IconLeaf {...props} /> },
    { id: 'petrol', label: 'Petrol & Diesel Pumps', renderIcon: (props) => <IconFuel {...props} /> }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingTop: '80px', paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: '1020px' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '22px' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: '700',
                color: '#059669',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '4px'
              }}
            >
              <IconFuel size={14} color="#059669" /> Real-Time Energy & Fuel Grid
            </div>
            <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              Nearby Fuel, CNG & EV Charging Hubs
            </h1>
            <p style={{ color: '#64748b', fontSize: '15px', marginTop: '6px', maxWidth: '680px' }}>
              Verified real-world Petrol pumps, CNG stations, and Fast EV chargers across India with live distance and turn-by-turn routing.
            </p>
          </div>

          <button
            onClick={() => setIsCalcOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 18px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}
          >
            <IconBatteryCharging size={18} color="#ffffff" />
            EV Charge Calculator
          </button>
        </div>

        {/* Live Daily Fuel Rates Ticker */}
        <FuelRateTicker locationAreaName={locationAreaName} fuelRates={fuelRates} />

        {/* Location & GPS Banner */}
        <LocationSearchBar
          locationAreaName={locationAreaName}
          userCoords={userCoords}
          locationSource={locationSource}
          gpsLoading={gpsLoading}
          gpsAccuracy={gpsAccuracy}
          onUseGps={autoDetectUserLocation}
          searchCityQuery={searchCityQuery}
          setSearchCityQuery={setSearchCityQuery}
          searchCityLoading={searchCityLoading}
          onSearchCitySubmit={handleSearchCitySubmit}
          onSelectQuickSector={handleSelectQuickSector}
        />

        {/* Category Filter Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categoryTabs.map((tab) => {
            const isSelected = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  background: isSelected ? '#eff6ff' : '#ffffff',
                  color: isSelected ? '#1d4ed8' : '#475569',
                  fontWeight: isSelected ? '800' : '600',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.renderIcon({ size: 15, color: isSelected ? '#1d4ed8' : '#64748b' })}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Controls Bar */}
        <div className="card" style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', marginBottom: '22px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Search Station / Area:
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Vidyadhar Nagar, Malviya, Sikar Rd, Torrent, Shell..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '13px', width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Proximity Radius:
              </label>
              <select
                className="input"
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '13px', width: '100%' }}
              >
                <option value="3">Within 3 km (Immediate Local Sector)</option>
                <option value="5">Within 5 km (Local Ward & Sector)</option>
                <option value="10">Within 10 km (City Suburb Zone)</option>
                <option value="15">Within 15 km (Greater City Area)</option>
                <option value="25">Within 25 km (All Major Corridors)</option>
                <option value="all">All Available (Full Network 50 km)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stations Results List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card" style={{ height: '140px', background: '#ffffff' }} />
            ))}
          </div>
        ) : filteredStations.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '50px 20px', background: '#ffffff' }}>
            <div style={{ marginBottom: '12px' }}>
              <IconFuel size={36} color="#94a3b8" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
              No Fuel Stations Found Within Selected Range
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '420px', margin: '0 auto 18px' }}>
              Try clearing your search query, choosing 'All Fuel & EV Hubs', or expanding the proximity radius.
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setRadiusKm('all');
                setSearchQuery('');
              }}
              className="btn btn-primary"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>
                Showing {filteredStations.length} Station{filteredStations.length > 1 ? 's' : ''} (Nearest First)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', color: '#059669', fontWeight: '700' }}>
                <IconNavigation size={13} color="#059669" /> Nearest: {filteredStations[0]?.name} ({filteredStations[0]?.distanceKm} km away)
              </span>
            </div>

            {filteredStations.map((station) => (
              <StationCard key={station.id} station={station} />
            ))}
          </div>
        )}
      </div>

      {/* EV Charge Calculator Modal */}
      <EvChargeCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        ratePerKwh={parseFloat(fuelRates.evUnit?.replace(/[^0-9.]/g, '')) || 18.5}
      />
    </div>
  );
}
