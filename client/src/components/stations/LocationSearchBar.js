import React from 'react';
import { IconMapPin, IconNavigation, IconSearch, IconCheck } from '../Icons';

/**
 * GPS Origin and Locality/City Search Bar
 */
export default function LocationSearchBar({
  locationAreaName,
  userCoords,
  locationSource,
  gpsLoading,
  gpsAccuracy,
  onUseGps,
  searchCityQuery,
  setSearchCityQuery,
  searchCityLoading,
  onSearchCitySubmit,
  onSelectQuickSector
}) {
  const quickSectors = [
    { label: 'C-Scheme', lat: 26.9124, lng: 75.8016, name: 'C-Scheme, Jaipur' },
    { label: 'Vaishali Nagar', lat: 26.9058, lng: 75.7462, name: 'Vaishali Nagar, Jaipur' },
    { label: 'Malviya Nagar / WTP', lat: 26.8532, lng: 75.8052, name: 'Malviya Nagar, Jaipur' },
    { label: 'Mansarovar', lat: 26.8785, lng: 75.7594, name: 'Mansarovar, Jaipur' },
    { label: 'Vidyadhar Nagar', lat: 26.9698, lng: 75.7725, name: 'Vidyadhar Nagar, Jaipur' },
    { label: 'Pink City', lat: 26.9247, lng: 75.8236, name: 'Pink City, Jaipur' },
    { label: 'Tonk Road', lat: 26.8835, lng: 75.8041, name: 'Tonk Road, Jaipur' }
  ];

  return (
    <div
      className="card"
      style={{
        marginBottom: '20px',
        padding: '20px 22px',
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <IconMapPin size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.04em' }}>
              Detected Current Area & Search Origin
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
              <span style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconMapPin size={16} color="#2563eb" /> {locationAreaName}
              </span>
              <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <IconCheck size={12} /> Live Sector
              </span>
              {gpsAccuracy && (
                <span style={{ fontSize: '11px', background: gpsAccuracy <= 100 ? '#ecfdf5' : '#fffbeb', color: gpsAccuracy <= 100 ? '#047857' : '#b45309', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                  ±{gpsAccuracy}m precision
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              GPS: <strong>{userCoords.lat.toFixed(4)}° N, {userCoords.lng.toFixed(4)}° E</strong> ({locationSource})
            </div>
          </div>
        </div>

        <button
          onClick={onUseGps}
          disabled={gpsLoading}
          className="btn btn-primary"
          style={{ padding: '9px 18px', fontSize: '13px', fontWeight: '700', gap: '6px', display: 'flex', alignItems: 'center' }}
        >
          <IconNavigation size={14} /> {gpsLoading ? 'Detecting Area & GPS...' : 'Auto GPS Detect'}
        </button>
      </div>

      {/* Quick Locality Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px', padding: '8px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <IconNavigation size={12} color="#2563eb" /> Quick Sectors:
        </span>
        {quickSectors.map((sec) => {
          const isCurrent = Math.abs(userCoords.lat - sec.lat) < 0.01 && Math.abs(userCoords.lng - sec.lng) < 0.01;
          return (
            <button
              key={sec.label}
              type="button"
              onClick={() => onSelectQuickSector && onSelectQuickSector(sec)}
              style={{
                fontSize: '11.5px',
                fontWeight: isCurrent ? '800' : '600',
                padding: '3px 9px',
                borderRadius: '6px',
                border: isCurrent ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                background: isCurrent ? '#eff6ff' : '#ffffff',
                color: isCurrent ? '#1d4ed8' : '#334155',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              {isCurrent && <IconCheck size={10} color="#1d4ed8" />}
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* Interactive City / Area Search Bar */}
      <form onSubmit={onSearchCitySubmit} style={{ display: 'flex', gap: '10px', width: '100%' }}>
        <input
          type="text"
          className="input"
          value={searchCityQuery}
          onChange={(e) => setSearchCityQuery(e.target.value)}
          placeholder="Search fuel & stations in any city/area (e.g. Connaught Place Delhi, Bandra Mumbai, Vidyadhar Nagar Jaipur)..."
          style={{ flex: 1, padding: '10px 14px', fontSize: '13px' }}
        />
        <button
          type="submit"
          disabled={searchCityLoading}
          className="btn btn-secondary"
          style={{ padding: '10px 20px', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <IconSearch size={14} /> {searchCityLoading ? 'Searching Area...' : 'Search Area'}
        </button>
      </form>
    </div>
  );
}
