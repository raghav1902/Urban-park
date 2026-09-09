import React from 'react';
import {
  IconZap,
  IconLeaf,
  IconFuel,
  IconMapPin,
  IconStar,
  IconNavigation,
  IconPhone
} from '../Icons';

export const getCategoryConfig = (category) => {
  switch (category) {
    case 'ev':
      return {
        renderIcon: (props) => <IconZap {...props} />,
        label: 'EV Fast Charging',
        badgeBg: '#eff6ff',
        badgeBorder: '#bfdbfe',
        badgeText: '#1d4ed8',
        accentColor: '#2563eb'
      };
    case 'cng':
      return {
        renderIcon: (props) => <IconLeaf {...props} />,
        label: 'CNG Gas Station',
        badgeBg: '#ecfdf5',
        badgeBorder: '#a7f3d0',
        badgeText: '#047857',
        accentColor: '#059669'
      };
    case 'petrol':
      return {
        renderIcon: (props) => <IconFuel {...props} />,
        label: 'Petrol & Diesel Pump',
        badgeBg: '#fffbeb',
        badgeBorder: '#fde68a',
        badgeText: '#b45309',
        accentColor: '#d97706'
      };
    default:
      return {
        renderIcon: (props) => <IconMapPin {...props} />,
        label: 'Energy Station',
        badgeBg: '#f1f5f9',
        badgeBorder: '#cbd5e1',
        badgeText: '#334155',
        accentColor: '#475569'
      };
  }
};

/**
 * Fuel & EV Station Card Component
 */
export default function StationCard({ station }) {
  const catConfig = getCategoryConfig(station.category);

  return (
    <div
      className="card"
      style={{
        background: '#ffffff',
        padding: '22px 24px',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        transition: 'all 0.15s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        {/* Main Details */}
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 9px',
                borderRadius: '6px',
                background: catConfig.badgeBg,
                border: `1px solid ${catConfig.badgeBorder}`,
                color: catConfig.badgeText,
                fontSize: '11px',
                fontWeight: '800',
                textTransform: 'uppercase'
              }}
            >
              {catConfig.renderIcon({ size: 12, color: catConfig.badgeText })}
              {station.categoryLabel || catConfig.label}
            </span>

            <span
              style={{
                padding: '3px 9px',
                borderRadius: '6px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontSize: '11px',
                fontWeight: '700'
              }}
            >
              {station.brand || station.operator}
            </span>

            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: '#f59e0b', fontWeight: '700' }}>
              <IconStar size={13} color="#f59e0b" fill="#f59e0b" /> {station.rating}
            </span>

            <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
              • {station.accessType}
            </span>
          </div>

          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
            {station.name}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', marginBottom: '4px' }}>
            <IconMapPin size={14} color="#64748b" style={{ flexShrink: 0 }} />
            <span>{station.address}</span>
          </div>

          {station.landmark && (
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', paddingLeft: '20px' }}>
              Landmark: <strong>{station.landmark}</strong>
            </div>
          )}

          {/* Fuels / Dispensers List */}
          {station.fuels && station.fuels.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
              {station.fuels.map((fuelItem, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  {catConfig.renderIcon({ size: 11, color: catConfig.accentColor })}
                  {fuelItem}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Proximity & Navigation CTA */}
        <div className="station-cta-col">
          <div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: catConfig.accentColor }}>
              {station.distanceKm} <span style={{ fontSize: '14px', fontWeight: '600' }}>km</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b' }}>Driving distance</div>
            <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#059669', marginTop: '4px' }}>
              {station.rateDisplay || (station.ratePerKwh ? `₹${station.ratePerKwh}/kWh` : 'Standard Rates')}
            </div>
          </div>

          <div className="station-btn-row">
            <a
              href={station.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary nav-map-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '12.5px',
                fontWeight: '700',
                textDecoration: 'none',
                background: catConfig.accentColor,
                borderColor: catConfig.accentColor
              }}
            >
              <IconNavigation size={13} color="#ffffff" /> Navigate in Maps ↗
            </a>

            {station.contact && (
              <a
                href={`tel:${station.contact.replace(/\s/g, '')}`}
                className="btn btn-secondary call-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  fontSize: '12.5px',
                  textDecoration: 'none'
                }}
              >
                <IconPhone size={13} color="#475569" /> Call
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
