import React from 'react';
import { IconMapPin, IconNavigation, IconCheck } from '../Icons';

export const JAIPUR_QUICK_SECTORS = [
  { label: 'C-Scheme / MI Road', lat: 26.9124, lng: 75.8016, name: 'C-Scheme, Jaipur' },
  { label: 'Vaishali Nagar', lat: 26.9058, lng: 75.7462, name: 'Vaishali Nagar, Jaipur' },
  { label: 'Malviya Nagar / WTP', lat: 26.8532, lng: 75.8052, name: 'Malviya Nagar, Jaipur' },
  { label: 'Mansarovar', lat: 26.8785, lng: 75.7594, name: 'Mansarovar, Jaipur' },
  { label: 'Vidyadhar Nagar', lat: 26.9698, lng: 75.7725, name: 'Vidyadhar Nagar, Jaipur' },
  { label: 'Pink City / Walled City', lat: 26.9247, lng: 75.8236, name: 'Pink City, Jaipur' },
  { label: 'Tonk Road / Lalkothi', lat: 26.8835, lng: 75.8041, name: 'Tonk Road, Jaipur' },
  { label: 'Jaipur Junction Station', lat: 26.9196, lng: 75.7885, name: 'Railway Station, Jaipur' }
];

/**
 * Dashboard Header Title, Live GPS Origin & Quick Sector Refinement
 */
export default function DashboardHeader({
  locationAreaName,
  userCoords,
  gpsLoading,
  gpsAccuracy,
  autoDetectUserLocation,
  onSelectQuickSector
}) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '20px',
          marginBottom: '16px'
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              fontWeight: '700',
              color: '#2563eb',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '4px'
            }}
          >
            <IconNavigation size={13} color="#2563eb" /> Live Sensor Telemetry
          </div>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: '800',
              color: '#0f172a',
              letterSpacing: '-0.02em',
              margin: 0
            }}
          >
            Jaipur Smart Parking Network
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Reserve verified real-time municipal & commercial parking plazas with live slot availability.
          </p>
        </div>

        {/* Live Origin Locator Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 18px',
            boxShadow: 'var(--shadow-sm)',
            maxWidth: '420px'
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>
                Search Origin
              </span>
              {gpsAccuracy && (
                <span
                  style={{
                    fontSize: '10.5px',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: gpsAccuracy <= 100 ? '#ecfdf5' : '#fffbeb',
                    color: gpsAccuracy <= 100 ? '#047857' : '#b45309',
                    fontWeight: '700'
                  }}
                >
                  ±{gpsAccuracy}m precision
                </span>
              )}
            </div>
            <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', lineHeight: '1.2', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <IconMapPin size={14} color="#2563eb" style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                {locationAreaName}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              {userCoords.lat.toFixed(4)}° N, {userCoords.lng.toFixed(4)}° E
            </div>
          </div>
          <button
            onClick={autoDetectUserLocation}
            disabled={gpsLoading}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '700', gap: '4px', display: 'flex', alignItems: 'center' }}
            title="Refetch fresh hardware GPS location"
          >
            <IconNavigation size={13} /> {gpsLoading ? 'Detecting...' : 'Auto GPS'}
          </button>
        </div>
      </div>

      {/* Quick Locality Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <IconNavigation size={13} color="#2563eb" /> Quick Sectors:
        </span>
        {JAIPUR_QUICK_SECTORS.map((sector) => {
          const isCurrent = Math.abs(userCoords.lat - sector.lat) < 0.01 && Math.abs(userCoords.lng - sector.lng) < 0.01;
          return (
            <button
              key={sector.label}
              onClick={() => onSelectQuickSector && onSelectQuickSector(sector)}
              style={{
                fontSize: '12px',
                fontWeight: isCurrent ? '800' : '600',
                padding: '4px 10px',
                borderRadius: '8px',
                border: isCurrent ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                background: isCurrent ? '#eff6ff' : '#ffffff',
                color: isCurrent ? '#1d4ed8' : '#334155',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
            >
              {isCurrent && <IconCheck size={11} color="#1d4ed8" />}
              {sector.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
