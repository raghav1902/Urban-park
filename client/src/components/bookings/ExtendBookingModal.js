import React from 'react';
import { formatTime } from '../../utils/pricing';

/**
 * Extend Parking Reservation Modal Dialog
 */
export default function ExtendBookingModal({
  booking,
  extendHours,
  setExtendHours,
  extendingLoading,
  onClose,
  onConfirm
}) {
  if (!booking) return null;

  const lotRate = booking.lotId?.pricePerHour || 40;
  const estimatedFee = lotRate * extendHours;
  const newDeparture = new Date(new Date(booking.endTime).getTime() + extendHours * 3600000);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={() => !extendingLoading && onClose()}
    >
      <div
        className="card"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Extend Parking Reservation
          </h3>
          <button
            onClick={onClose}
            disabled={extendingLoading}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
          >
            ×
          </button>
        </div>

        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
            {booking.lotId?.name} • Bay {booking.slotId?.slotNumber}
          </div>
          <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
            Current Departure: <strong style={{ color: '#0f172a' }}>{formatTime(booking.endTime)}</strong>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Choose Additional Time:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[1, 2, 3].map((hrs) => (
              <button
                key={hrs}
                type="button"
                onClick={() => setExtendHours(hrs)}
                style={{
                  padding: '12px 8px',
                  borderRadius: '8px',
                  border: extendHours === hrs ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: extendHours === hrs ? '#eff6ff' : '#ffffff',
                  color: extendHours === hrs ? '#2563eb' : '#0f172a',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                +{hrs} {hrs === 1 ? 'Hour' : 'Hours'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#166534', marginBottom: '4px' }}>
            <span>Estimated Additional Fee:</span>
            <strong style={{ fontSize: '15px' }}>₹{estimatedFee}</strong>
          </div>
          <div style={{ fontSize: '11.5px', color: '#15803d' }}>
            New scheduled departure: {newDeparture.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            disabled={extendingLoading}
            className="btn btn-secondary"
            style={{ flex: 1, padding: '10px' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={extendingLoading}
            className="btn btn-primary"
            style={{ flex: 2, padding: '10px' }}
          >
            {extendingLoading ? 'Confirming...' : 'Confirm Extension'}
          </button>
        </div>
      </div>
    </div>
  );
}
