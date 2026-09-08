import React from 'react';

/**
 * Smart EV Charging Session Telemetry Widget
 */
export default function EvChargingSessionWidget({ booking, togglingEvId, onToggleEv }) {
  if (!booking?.evCharging?.enabled) return null;

  const ev = booking.evCharging;
  const isCharging = ev.chargingStatus === 'charging';

  return (
    <div
      style={{
        marginBottom: '16px',
        padding: '16px',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
        border: '1.5px solid #a7f3d0',
        borderRadius: '10px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>⚡</span>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#065f46' }}>
              Smart EV Charging Session • {ev.chargerType || 'Type-2 22kW'}
            </div>
            <div style={{ fontSize: '11.5px', color: '#047857' }}>
              Status: <strong>{(ev.chargingStatus || 'charging').toUpperCase()}</strong>
            </div>
          </div>
        </div>

        <button
          onClick={() => onToggleEv(booking._id)}
          disabled={togglingEvId === booking._id}
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: '700',
            borderRadius: '6px',
            background: isCharging ? '#fef2f2' : '#ecfdf5',
            color: isCharging ? '#dc2626' : '#059669',
            border: '1px solid currentColor',
            cursor: 'pointer'
          }}
        >
          {togglingEvId === booking._id
            ? 'Updating...'
            : isCharging
            ? 'Pause Charging'
            : 'Resume Charging'}
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          background: '#ffffff',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #d1fae5'
        }}
      >
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '600' }}>Current Battery</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669' }}>
            {ev.currentBatteryPct || 65}%
          </div>
          <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${ev.currentBatteryPct || 65}%`, height: '100%', background: '#10b981' }} />
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '600' }}>Power Output</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
            {isCharging ? '21.8 kW' : '0.0 kW'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Fast AC Inverter</div>
        </div>

        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '600' }}>Energy Delivered</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
            {(ev.kwhConsumed || 14.2).toFixed(1)} kWh
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Flat tariff: ₹{ev.chargingCost || 225}</div>
        </div>
      </div>
    </div>
  );
}
