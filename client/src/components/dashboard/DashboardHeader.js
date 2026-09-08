import React from 'react';
import { IconMapPin } from '../Icons';

/**
 * Dashboard Header Title & Live GPS Origin Banner
 */
export default function DashboardHeader({
  locationAreaName,
  userCoords,
  gpsLoading,
  autoDetectUserLocation
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '20px',
        marginBottom: '20px'
      }}
    >
      <div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#2563eb',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '4px'
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
          Real-Time Global Parking Grid
        </div>
        <h1
          style={{
            fontSize: 'clamp(24px, 4vw, 30px)',
            fontWeight: '800',
            color: '#0f172a',
            letterSpacing: '-0.02em',
            margin: 0
          }}
        >
          Nearby Parking Spaces & Hubs
        </h1>
        <p style={{ color: '#64748b', fontSize: '14.5px', marginTop: '4px' }}>
          Verified public parking spaces and smart IoT facilities near your live GPS coordinates.
        </p>
      </div>

      {/* Live Location Origin Banner */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: '320px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: '#ecfdf5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <IconMapPin size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>
            Current Search Origin
          </div>
          <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', lineHeight: '1.2' }}>
            📍 {locationAreaName}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {userCoords.lat.toFixed(4)}° N, {userCoords.lng.toFixed(4)}° E
          </div>
        </div>
        <button
          onClick={autoDetectUserLocation}
          disabled={gpsLoading}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '700', gap: '4px' }}
        >
          {gpsLoading ? 'Detecting...' : '📍 Auto GPS'}
        </button>
      </div>
    </div>
  );
}
