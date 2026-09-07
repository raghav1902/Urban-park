import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate, formatTime } from '../utils/pricing';
import { toast } from 'react-toastify';
import {
  IconCar,
  IconCalendar,
  IconMapPin,
  IconQrCode,
  IconClock,
  IconArrowRight,
  IconShield
} from '../components/Icons';

const STATUS_BADGES = {
  confirmed: 'badge-green',
  active: 'badge-blue',
  pending: 'badge-amber',
  completed: 'badge-gray',
  cancelled: 'badge-red'
};

/**
 * Enterprise User Reservation Ledger
 * Pure white theme, responsive grid, zero emojis, clean status indicators
 */
export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      const res = await api.get('/bookings/my');
      setBookings(res.data);
    } catch (err) {
      console.error('Failed to load user reservations:', err);
      toast.error('Unable to fetch booking records.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    const isConfirmed = window.confirm('Are you sure you want to cancel this reservation? The slot will be released.');
    if (!isConfirmed) return;

    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      setBookings((prev) =>
        prev.map((item) => (item._id === bookingId ? { ...item, status: 'cancelled' } : item))
      );
      toast.success('Reservation cancelled. The parking slot has been released.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation request failed.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingTop: '80px', paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: '840px' }}>
        {/* Header Title */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#2563eb',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '4px'
            }}
          >
            User Account Ledger
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            My Parking Reservations
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>
            Review past reservations, download active gate passes, or manage schedules.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card" style={{ height: '110px', background: '#ffffff' }} />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 24px', background: '#ffffff' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: '#f1f5f9',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                marginBottom: '16px'
              }}
            >
              <IconCar size={28} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
              No Reservations Found
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '380px', margin: '0 auto 24px' }}>
              You do not have any active or past parking bookings recorded in your account.
            </p>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
              Browse Jaipur Parking Zones
              <IconArrowRight size={15} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {bookings.map((booking) => {
              const isExpanded = expandedId === booking._id;
              const isCancellable = ['confirmed', 'pending'].includes(booking.status);

              return (
                <div
                  key={booking._id}
                  className="card"
                  style={{
                    background: '#ffffff',
                    padding: '20px 24px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease'
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : booking._id)}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span className="mono" style={{ fontSize: '20px', fontWeight: '800', color: '#2563eb' }}>
                          {booking.slotId?.slotNumber || 'Bay N/A'}
                        </span>
                        <span className={`badge ${STATUS_BADGES[booking.status] || 'badge-gray'}`}>
                          {booking.status}
                        </span>
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
                        {booking.duration} {booking.duration === 1 ? 'hr' : 'hrs'}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Accordion */}
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
                          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>
                            Vehicle Plate
                          </span>
                          <div className="mono" style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                            {booking.vehicleNumber}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>
                            Level Location
                          </span>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginTop: '2px' }}>
                            Floor {booking.slotId?.floor || '1'}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>
                            Address
                          </span>
                          <div style={{ fontSize: '13.5px', color: '#475569', marginTop: '2px' }}>
                            {booking.lotId?.location}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>
                            Booked On
                          </span>
                          <div style={{ fontSize: '13.5px', color: '#475569', marginTop: '2px' }}>
                            {formatDate(booking.createdAt)}
                          </div>
                        </div>
                      </div>

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
                            <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                              Digital Entrance QR Code
                            </div>
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

                      {/* Cancellation Action */}
                      {isCancellable && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleCancel(booking._id)}
                            className="btn btn-danger"
                            style={{ padding: '8px 16px', fontSize: '13px' }}
                          >
                            Cancel Reservation
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
