import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/pricing';
import { IconMapPin, IconArrowRight } from '../Icons';

/**
 * Individual Parking Lot Card with live availability telemetry
 */
export default function ParkingLotCard({ lot, occupancy, pricing }) {
  const { available, pct } = occupancy;
  const isFull = available === 0;

  return (
    <div
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
        <div style={{ flex: 1, minWidth: '260px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              {lot.name}
            </h3>
            {pricing.label !== 'Normal' && (
              <span className={`badge ${pricing.label === 'Peak' ? 'badge-red' : 'badge-blue'}`}>
                {pricing.label} Rate
              </span>
            )}
            {lot.distanceKm !== undefined && (
              <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#2563eb' }}>
                📍 {lot.distanceKm} km away
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

        {/* Action CTA & Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
          <Link to={`/lot/${lot._id}`} style={{ textDecoration: 'none' }}>
            <button
              className="btn btn-primary"
              disabled={isFull}
              style={{ width: '100%', padding: '10px 18px', fontWeight: '700' }}
            >
              {isFull ? 'Capacity Reached' : 'Inspect Slots'}
              <IconArrowRight size={15} />
            </button>
          </Link>

          {lot.googleMapsUrl && (
            <a
              href={lot.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: '12px', fontWeight: '700', textDecoration: 'none', textAlign: 'center' }}
            >
              🗺️ Navigate in Maps ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
