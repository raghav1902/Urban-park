import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { IconCar, IconArrowRight } from '../components/Icons';
import IndoorWayfinderModal from '../components/IndoorWayfinderModal';
import EcoImpactCard from '../components/EcoImpactCard';
import BookingCard from '../components/bookings/BookingCard';
import ExtendBookingModal from '../components/bookings/ExtendBookingModal';
import DigitalTicketModal from '../components/booking/DigitalTicketModal';
import FindMyCarModal from '../components/parking/FindMyCarModal';

/**
 * Enterprise User Reservation Ledger Page
 */
export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedExtendBooking, setSelectedExtendBooking] = useState(null);
  const [extendHours, setExtendHours] = useState(1);
  const [extendingLoading, setExtendingLoading] = useState(false);
  const [wayfinderBooking, setWayfinderBooking] = useState(null);
  const [ticketBooking, setTicketBooking] = useState(null);
  const [radarBooking, setRadarBooking] = useState(null);
  const [togglingEvId, setTogglingEvId] = useState(null);
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

  const handleToggleEv = async (bookingId) => {
    setTogglingEvId(bookingId);
    try {
      const res = await api.post(`/bookings/${bookingId}/ev-toggle`);
      if (res.data.success) {
        toast.success(res.data.message);
        setBookings((prev) =>
          prev.map((b) => (b._id === bookingId ? { ...b, evCharging: res.data.evCharging } : b))
        );
      }
    } catch (err) {
      toast.error('Failed to update EV charging status.');
    } finally {
      setTogglingEvId(null);
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

  const handleConfirmExtend = async () => {
    if (!selectedExtendBooking) return;
    setExtendingLoading(true);

    try {
      const res = await api.put(`/bookings/${selectedExtendBooking._id}/extend`, {
        hours: extendHours
      });

      toast.success(res.data.message || `Extended by ${extendHours} hr(s) successfully!`);

      if (res.data.booking) {
        setBookings((prev) =>
          prev.map((item) => (item._id === selectedExtendBooking._id ? res.data.booking : item))
        );
      } else {
        await fetchMyBookings();
      }

      setSelectedExtendBooking(null);
      setExtendHours(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to extend booking duration.');
    } finally {
      setExtendingLoading(false);
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

        {/* Green City ESG Eco-Impact Tracker */}
        {!loading && bookings.length > 0 && (
          <EcoImpactCard bookingCount={bookings.length} />
        )}

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
            {bookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                isExpanded={expandedId === booking._id}
                onToggleExpand={() => setExpandedId(expandedId === booking._id ? null : booking._id)}
                onCancel={handleCancel}
                onOpenExtend={setSelectedExtendBooking}
                onOpenWayfinder={setWayfinderBooking}
                onOpenTicket={setTicketBooking}
                onOpenFindCar={setRadarBooking}
                togglingEvId={togglingEvId}
                onToggleEv={handleToggleEv}
              />
            ))}
          </div>
        )}

        {/* Extension Modal */}
        <ExtendBookingModal
          booking={selectedExtendBooking}
          extendHours={extendHours}
          setExtendHours={setExtendHours}
          extendingLoading={extendingLoading}
          onClose={() => setSelectedExtendBooking(null)}
          onConfirm={handleConfirmExtend}
        />

        {/* Indoor Wayfinder Modal */}
        {wayfinderBooking && (
          <IndoorWayfinderModal
            booking={wayfinderBooking}
            onClose={() => setWayfinderBooking(null)}
          />
        )}

        {/* Digital Ticket Modal */}
        {ticketBooking && (
          <DigitalTicketModal
            isOpen={Boolean(ticketBooking)}
            booking={ticketBooking}
            onClose={() => setTicketBooking(null)}
          />
        )}

        {/* Find My Car Radar Modal */}
        {radarBooking && (
          <FindMyCarModal
            isOpen={Boolean(radarBooking)}
            booking={radarBooking}
            onClose={() => setRadarBooking(null)}
          />
        )}
      </div>
    </div>
  );
}
