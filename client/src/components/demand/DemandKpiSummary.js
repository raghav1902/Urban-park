import React from 'react';

/**
 * Demand KPI Metric Badges
 */
export default function DemandKpiSummary({ stats }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '10px',
        marginBottom: '18px',
        background: '#f8fafc',
        padding: '12px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0'
      }}
    >
      <div>
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
          Peak Surge
        </span>
        <div style={{ fontSize: '15px', fontWeight: '700', color: '#ef4444' }}>
          {stats.peakHour} ({stats.peakValue}%)
        </div>
      </div>
      <div>
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
          Avg Daily Load
        </span>
        <div style={{ fontSize: '15px', fontWeight: '700', color: '#2563eb' }}>
          {stats.average}% Capacity
        </div>
      </div>
      <div>
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
          Off-Peak Saver
        </span>
        <div style={{ fontSize: '15px', fontWeight: '700', color: '#059669' }}>
          {stats.lowestHour} ({stats.lowestValue}%)
        </div>
      </div>
    </div>
  );
}
