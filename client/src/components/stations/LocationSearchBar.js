import React from 'react';
import { IconMapPin } from '../Icons';

/**
 * GPS Origin and Locality/City Search Bar
 */
export default function LocationSearchBar({
  locationAreaName,
  userCoords,
  locationSource,
  gpsLoading,
  onUseGps,
  searchCityQuery,
  setSearchCityQuery,
  searchCityLoading,
  onSearchCitySubmit
}) {
  return (
    <div
      className="card"
      style={{
        marginBottom: '20px',
        padding: '20px 22px',
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconMapPin size={24} />
          </div>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.04em' }}>
              Detected Current Area & Search Origin
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
              <span style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                📍 {locationAreaName}
              </span>
              <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                ✓ Live Detected Sector
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Exact GPS: <strong>{userCoords.lat.toFixed(4)}° N, {userCoords.lng.toFixed(4)}° E</strong> ({locationSource})
            </div>
          </div>
        </div>

        <button
          onClick={onUseGps}
          disabled={gpsLoading}
          className="btn btn-primary"
          style={{ padding: '9px 18px', fontSize: '13px', fontWeight: '700', gap: '6px' }}
        >
          {gpsLoading ? 'Detecting Area & GPS...' : '📍 Use My Live GPS Location'}
        </button>
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
          style={{ padding: '10px 20px', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}
        >
          {searchCityLoading ? 'Searching Area...' : '🔍 Search Area'}
        </button>
      </form>
    </div>
  );
}
