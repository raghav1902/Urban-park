import React, { useState } from 'react';
import { IconClock, IconZap, IconShield, IconSparkles, IconAlert } from './Icons';

/**
 * Enterprise AI Occupancy Forecast & Rush Hour Predictor
 * Displays hourly demand curves, peak congestion warnings, and optimal parking recommendations.
 */
export default function OccupancyForecastChart({ lotName }) {
  const currentHour = new Date().getHours();
  const [hoveredHour, setHoveredHour] = useState(null);

  // Model hourly occupancy profile (00:00 to 23:00)
  const hourlyOccupancy = [
    { hour: 0, pct: 15, label: '12 AM' },
    { hour: 1, pct: 12, label: '1 AM' },
    { hour: 2, pct: 10, label: '2 AM' },
    { hour: 3, pct: 8, label: '3 AM' },
    { hour: 4, pct: 10, label: '4 AM' },
    { hour: 5, pct: 18, label: '5 AM' },
    { hour: 6, pct: 28, label: '6 AM' },
    { hour: 7, pct: 45, label: '7 AM' },
    { hour: 8, pct: 68, label: '8 AM' },
    { hour: 9, pct: 82, label: '9 AM' },
    { hour: 10, pct: 75, label: '10 AM' },
    { hour: 11, pct: 60, label: '11 AM' },
    { hour: 12, pct: 52, label: '12 PM' },
    { hour: 13, pct: 48, label: '1 PM' },
    { hour: 14, pct: 55, label: '2 PM' },
    { hour: 15, pct: 62, label: '3 PM' },
    { hour: 16, pct: 74, label: '4 PM' },
    { hour: 17, pct: 88, label: '5 PM' },
    { hour: 18, pct: 94, label: '6 PM' },
    { hour: 19, pct: 91, label: '7 PM' },
    { hour: 20, pct: 84, label: '8 PM' },
    { hour: 21, pct: 65, label: '9 PM' },
    { hour: 22, pct: 42, label: '10 PM' },
    { hour: 23, pct: 25, label: '11 PM' }
  ];

  const currentData = hourlyOccupancy.find((h) => h.hour === currentHour) || hourlyOccupancy[12];
  const activeData = hoveredHour !== null ? hourlyOccupancy.find((h) => h.hour === hoveredHour) : currentData;

  const getBarColor = (pct, isCurrent) => {
    if (isCurrent) return '#2563eb';
    if (pct >= 85) return '#ef4444';
    if (pct >= 65) return '#f59e0b';
    return '#10b981';
  };

  const getTrafficStatus = (pct) => {
    if (pct >= 85) return { text: 'Peak Congestion', badge: 'badge-red' };
    if (pct >= 65) return { text: 'Moderate Traffic', badge: 'badge-yellow' };
    return { text: 'Plenty of Open Bays', badge: 'badge-green' };
  };

  const status = getTrafficStatus(activeData.pct);

  return (
    <div
      className="card"
      style={{
        background: '#ffffff',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        marginBottom: '24px'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
            <IconClock size={14} /> AI Occupancy & Rush Hour Forecast
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            {lotName} Traffic Trends
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0' }}>
            Predictive hourly demand based on historical Smart City traffic telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {hoveredHour !== null ? `${activeData.label}` : `Now (${activeData.label})`}
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              {activeData.pct}% Full
            </div>
          </div>
          <span className={`badge ${status.badge}`} style={{ fontSize: '11px', padding: '4px 8px' }}>
            {status.text}
          </span>
        </div>
      </div>

      {/* Hourly Bar Chart */}
      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '110px', gap: '4px', paddingTop: '10px' }}>
          {hourlyOccupancy.map((item) => {
            const isCurrent = item.hour === currentHour;
            const isHovered = item.hour === hoveredHour;
            const barHeight = `${item.pct}%`;
            const barColor = getBarColor(item.pct, isCurrent);

            return (
              <div
                key={item.hour}
                onMouseEnter={() => setHoveredHour(item.hour)}
                onMouseLeave={() => setHoveredHour(null)}
                style={{
                  flex: 1,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                {/* Live Indicator Pill */}
                {isCurrent && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-16px',
                      fontSize: '9px',
                      fontWeight: '800',
                      color: '#2563eb',
                      background: '#dbeafe',
                      padding: '1px 4px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    NOW
                  </div>
                )}

                <div
                  style={{
                    width: '100%',
                    height: barHeight,
                    background: isHovered ? '#1d4ed8' : barColor,
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.15s ease',
                    opacity: isCurrent ? 1 : 0.82,
                    boxShadow: isCurrent ? '0 0 8px rgba(37, 99, 235, 0.4)' : 'none'
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* X-Axis Hour Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '8px', padding: '0 2px' }}>
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>11 PM</span>
        </div>
      </div>

      {/* AI Smart Insights Callouts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
        <div style={{ padding: '10px 14px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconSparkles size={18} color="#047857" />
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: '#047857' }}>
              Optimal Off-Peak Window
            </div>
            <div style={{ fontSize: '12.5px', color: '#065f46', fontWeight: '600' }}>
              11:30 AM – 03:30 PM (Quick entrance, ~45% occupancy)
            </div>
          </div>
        </div>

        <div style={{ padding: '10px 14px', background: '#fff1f2', borderRadius: '8px', border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconAlert size={18} color="#b91c1c" />
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: '#b91c1c' }}>
              Peak Congestion Window
            </div>
            <div style={{ fontSize: '12.5px', color: '#9f1239', fontWeight: '600' }}>
              05:30 PM – 08:30 PM (Advance booking strongly advised)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
