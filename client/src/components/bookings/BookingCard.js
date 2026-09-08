import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, formatTime } from '../../utils/pricing';
import EvChargingSessionWidget from './EvChargingSessionWidget';

const STATUS_BADGES = {
  confirmed: 'badge-green',
  active: 'badge-blue',
  pending: 'badge-amber',
  completed: 'badge-gray',
  cancelled: 'badge-red'
};

export default function BookingCard({
  booking,
  isExpanded,
  onToggleExpand,
  onCancel,
  onOpenExtend,
  onOpenWayfinder,
  togglingEvId,
  onToggleEv
}) {
  const navigate = useNavigate();
  const isCancellable = ['confirmed', 'pending'].includes(booking.status);
  const canExtend = ['active', 'confirmed'].includes(booking.status);

  const now = Date.now();
  const endTimeMs = new Date(booking.endTime).getTime();
  const isExpiringSoon =
    ['active', 'confirmed'].includes(booking.status) &&
    endTimeMs > now &&
    endTimeMs - now <= 15 * 60 * 1000;
  const remainingMins = isExpiringSoon ? Math.max(1, Math.round((endTimeMs - now) / 60000)) : 0;

  const hasExtension = (booking.extendedHours && booking.extendedHours > 0) || booking.extensionCount > 0;
  const originalHours = booking.originalDuration || Math.max(1, booking.duration - (booking.extendedHours || booking.extensionCount || 0));
  const extHours = booking.extendedHours || Math.max(1, booking.duration - originalHours);

  return (
    <div
      className="card"
      style={{
        background: '#ffffff',
        padding: '20px 24px',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease',
        border: isExpiringSoon ? '2px solid #f59e0b' : '1px solid #e2e8f0'
      }}
      onClick={onToggleExpand}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="mono" style={{ fontSize: '20px', fontWeight: '800', color: '#2563eb' }}>
              {booking.slotId?.slotNumber || 'Bay N/A'}
            </span>
            <span className={`badge ${STATUS_BADGES[booking.status] || 'badge-gray'}`}>
              {booking.status}
            </span>
            {booking.extensionCount > 0 && (
              <span className="badge badge-blue" style={{ fontSize: '11px' }}>
                Extended (+{booking.extensionCount})
              </span>
            )}
          </div>

          <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
            {booking.lotId?.name}
          </div>

          <div style={{ fontSize: '13px', color: '#64748b' }}>
            {formatDate(booking.startTime)} • {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
            {formatCurrency(booking.totalCost)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
            {hasExtension ? (
              <span>
                {originalHours}h + <strong style={{ color: '#2563eb' }}>+{extHours}h ext</strong> ({booking.duration}h total)
              </span>
            ) : (
              `${booking.duration} ${booking.duration === 1 ? 'hr' : 'hrs'}`
            )}
          </div>
        </div>
      </div>

      {/* 15-Minute Expiry Warning Banner */}
      {isExpiringSoon && (
        <div
          style={{
            marginTop: '14px',
            padding: '10px 14px',
            background: '#fffbeb',
            border: '1px solid #fef3c7',
            borderLeft: '4px solid #f59e0b',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#b45309' }}>
            ⚠️ Less than {remainingMins} min(s) remaining! Extend now to avoid overstay fine.
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenExtend(booking);
            }}
            style={{
              padding: '5px 12px',
              background: '#d97706',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Extend Service ↗
          </button>
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div
          style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #e2e8f0',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
              marginBottom: '20px'
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Vehicle Plate</span>
              <div className="mono" style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                {booking.vehicleNumber}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Level Location</span>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginTop: '2px' }}>
                Floor {booking.slotId?.floor || '1'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Address</span>
              <div style={{ fontSize: '13.5px', color: '#475569', marginTop: '2px' }}>
                {booking.lotId?.location}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Booked On</span>
              <div style={{ fontSize: '13.5px', color: '#475569', marginTop: '2px' }}>
                {formatDate(booking.createdAt)}
              </div>
            </div>
          </div>

          {/* Extension Breakdown Widget */}
          {hasExtension && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 16px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#1e40af', fontWeight: '700' }}>Initial Booked Time</div>
                <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#1e3a8a', marginTop: '2px' }}>
                  {originalHours} Hours {booking.originalCost ? ` (₹${booking.originalCost})` : ''}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#2563eb', fontWeight: '700' }}>Extended Service</div>
                <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#2563eb', marginTop: '2px' }}>
                  +{extHours} Hours {booking.extendedCost ? ` (+₹${booking.extendedCost})` : ''}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#0f172a', fontWeight: '700' }}>Total Duration</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                  {booking.duration} Hours (₹{booking.totalCost})
                </div>
              </div>
            </div>
          )}

          {/* QR Gate Pass Section */}
          {booking.qrCode && booking.status !== 'cancelled' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '14px 18px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '16px'
              }}
            >
              <img
                src={booking.qrCode}
                alt="QR Pass"
                style={{ width: '64px', height: '64px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>Digital Entrance QR Code</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Present this barcode directly at the facility boom barrier scanner.
                </div>
              </div>
              <button
                onClick={() => navigate(`/booking-success/${booking._id}`)}
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '12.5px' }}
              >
                Full Pass
              </button>
            </div>
          )}

          {/* EV Charging Status Widget */}
          <EvChargingSessionWidget booking={booking} togglingEvId={togglingEvId} onToggleEv={onToggleEv} />

          {/* Concierge Services */}
          {booking.addOnServices && booking.addOnServices.length > 0 && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 16px',
                background: '#fdf4ff',
                border: '1px solid #f5d0fe',
                borderRadius: '8px'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#86198f', marginBottom: '6px' }}>
                🧼 Concierge Add-on Services:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {booking.addOnServices.map((svc, idx) => (
                  <span key={idx} style={{ fontSize: '12px', padding: '4px 10px', background: '#fae8ff', color: '#86198f', border: '1px solid #f0abfc', borderRadius: '6px', fontWeight: '600' }}>
                    ✓ {svc.name} (₹{svc.price}) • Scheduled
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Landmark Driver Memo */}
          {booking.parkingNotes && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12.5px',
                color: '#334155'
              }}
            >
              📌 <strong>Driver Memo:</strong> {booking.parkingNotes}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenWayfinder(booking);
              }}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '13px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
            >
              🗺️ Locate Car / Bay
            </button>
            {canExtend && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenExtend(booking);
                }}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                + Extend Duration
              </button>
            )}
            {isCancellable && (
              <button
                onClick={() => onCancel(booking._id)}
                className="btn btn-danger"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Cancel Reservation
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
