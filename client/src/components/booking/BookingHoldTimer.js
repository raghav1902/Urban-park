import React from 'react';
import { IconClock } from '../Icons';

/**
 * 5-Minute Checkout Hold Timer Strip
 */
export default function BookingHoldTimer({ lockTimeLeft }) {
  if (lockTimeLeft <= 0) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isUrgent = lockTimeLeft < 60;

  return (
    <div
      style={{
        background: isUrgent ? '#fef2f2' : '#ffffff',
        border: `1.5px solid ${isUrgent ? '#f87171' : '#bfdbfe'}`,
        borderRadius: '10px',
        padding: '14px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: isUrgent ? '#fee2e2' : '#eff6ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <IconClock size={18} color={isUrgent ? '#dc2626' : '#2563eb'} />
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
            Temporary Slot Hold Active
          </div>
          <div style={{ fontSize: '12px', color: isUrgent ? '#dc2626' : '#64748b' }}>
            {isUrgent ? 'Hurry! Final seconds before release.' : 'Spot is held exclusively for your checkout.'}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div className="mono" style={{ fontSize: '24px', fontWeight: '800', color: isUrgent ? '#dc2626' : '#2563eb' }}>
          {formatTime(lockTimeLeft)}
        </div>
        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
          Time Remaining
        </div>
      </div>
    </div>
  );
}
