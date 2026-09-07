import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency } from '../utils/pricing';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import {
  IconArrowLeft,
  IconClock,
  IconCheck,
  IconCreditCard,
  IconShield,
  IconCalendar,
  IconCar
} from '../components/Icons';

/**
 * Enterprise Booking & Payment Confirmation Page
 * Responsive 2-column or stacked layout, pure white theme, zero emojis, verified locking
 */
export default function BookingPage() {
  const { id: lotId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { slot, lot, pricing } = state || {};

  const now = new Date();
  const defaultStart = new Date(now.getTime() + 10 * 60000);
  const defaultEnd = new Date(now.getTime() + 70 * 60000);

  const [startTime, setStartTime] = useState(defaultStart.toISOString().slice(0, 16));
  const [endTime, setEndTime] = useState(defaultEnd.toISOString().slice(0, 16));
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('free_demo');
  const [loading, setLoading] = useState(false);

  // 5-minute checkout hold timer
  const [lockTimeLeft, setLockTimeLeft] = useState(300);
  const [lockedSlotId, setLockedSlotId] = useState(slot?._id || null);
  const lockAttemptedRef = useRef(false);

  useEffect(() => {
    if (!slot || lockAttemptedRef.current) return;
    lockAttemptedRef.current = true;

    const lockSlot = async () => {
      try {
        const response = await api.post('/parking/lock-slot', {
          slotId: slot._id,
          userId: user?._id || 'guest-session'
        });

        if (response.data.success) {
          setLockedSlotId(slot._id);
          if (response.data.expiresIn) {
            setLockTimeLeft(response.data.expiresIn);
          }
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Slot hold failed. Please re-select.');
        if (error.response?.status === 400) {
          navigate(-1);
        }
      }
    };

    lockSlot();
  }, [slot, navigate, user]);

  useEffect(() => {
    if (lockTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setLockTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoUnlock();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockTimeLeft]);

  const handleAutoUnlock = async () => {
    if (!lockedSlotId) return;
    try {
      await api.post('/parking/unlock-slot', { slotId: lockedSlotId });
      setLockedSlotId(null);
      setLockTimeLeft(0);
      toast.info('Session expired. The temporary slot hold was released.');
      navigate(-1);
    } catch (error) {
      console.error('Failed to unlock slot:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!slot || !lot) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', paddingTop: '100px', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '15px' }}>No active reservation payload detected.</p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ marginTop: '16px' }}>
          Back to Directory
        </button>
      </div>
    );
  }

  const durationHours = Math.max(1, Math.ceil((new Date(endTime) - new Date(startTime)) / 3600000));
  const hourlyRate = pricing?.price || lot.pricePerHour;
  const totalCost = hourlyRate * durationHours;

  const handleBook = async (e) => {
    e.preventDefault();

    if (!vehicleNumber.trim()) {
      toast.error('Please enter your vehicle registration plate number.');
      return;
    }

    if (new Date(startTime) >= new Date(endTime)) {
      toast.error('Booking departure time must be strictly after arrival time.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/bookings', {
        slotId: slot._id,
        lotId,
        startTime,
        endTime,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        paymentMethod
      });

      toast.success('Reservation confirmed successfully.');
      navigate(`/booking-success/${res.data._id}`, { state: { booking: res.data } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reservation failed.');
    } finally {
      setLoading(false);
    }
  };

  const paymentOptions = [
    { id: 'free_demo', title: 'Community Free Pass', desc: 'Complimentary pilot access program' },
    { id: 'upi', title: 'UPI Quick Pay', desc: 'Instant verification via BHIM, GPay, PhonePe' },
    { id: 'card', title: 'Corporate / Fleet Card', desc: 'Visa, MasterCard, RuPay' },
    { id: 'netbanking', title: 'Net Banking Gateway', desc: 'Direct bank account transfer' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingTop: '80px', paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: '780px' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost"
          style={{ padding: '6px 12px', fontSize: '13px', marginBottom: '20px' }}
        >
          <IconArrowLeft size={15} />
          Return to Slot Selection
        </button>

        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '6px' }}>
          Finalize Parking Reservation
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
          Please verify reservation parameters and vehicle credentials before confirmation.
        </p>

        {/* Temporary Hold Countdown Strip */}
        {lockTimeLeft > 0 && (
          <div
            style={{
              background: lockTimeLeft < 60 ? '#fef2f2' : '#ffffff',
              border: `1.5px solid ${lockTimeLeft < 60 ? '#f87171' : '#bfdbfe'}`,
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
                  background: lockTimeLeft < 60 ? '#fee2e2' : '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <IconClock size={18} color={lockTimeLeft < 60 ? '#dc2626' : '#2563eb'} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                  Temporary Slot Hold Active
                </div>
                <div style={{ fontSize: '12px', color: lockTimeLeft < 60 ? '#dc2626' : '#64748b' }}>
                  {lockTimeLeft < 60 ? 'Hurry! Final seconds before release.' : 'Spot is held exclusively for your checkout.'}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div className="mono" style={{ fontSize: '24px', fontWeight: '800', color: lockTimeLeft < 60 ? '#dc2626' : '#2563eb' }}>
                {formatTime(lockTimeLeft)}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
                Time Remaining
              </div>
            </div>
          </div>
        )}

        {/* Facility & Bay Confirmation Card */}
        <div className="card" style={{ marginBottom: '20px', padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                Allocated Bay
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '2px' }}>
                <span className="mono" style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb' }}>
                  {slot.slotNumber}
                </span>
                <span style={{ fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                  Level {slot.floor} • {slot.type.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{lot.name}</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                {formatCurrency(hourlyRate)} / hr
              </div>
              <span className={`badge ${pricing?.isSurge ? 'badge-red' : 'badge-green'}`} style={{ marginTop: '4px' }}>
                {pricing?.label} Rate
              </span>
            </div>
          </div>
        </div>

        {/* Booking Form Card */}
        <form onSubmit={handleBook}>
          <div className="card" style={{ marginBottom: '20px', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '18px' }}>
              Reservation Interval & Vehicle Info
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '18px'
              }}
            >
              <div>
                <label className="input-label" htmlFor="start-time">
                  Arrival Timestamp
                </label>
                <input
                  id="start-time"
                  className="input"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>

              <div>
                <label className="input-label" htmlFor="end-time">
                  Departure Timestamp
                </label>
                <input
                  id="end-time"
                  className="input"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  min={startTime}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="input-label" htmlFor="vehicle-number">
                Vehicle Registration Plate
              </label>
              <input
                id="vehicle-number"
                className="input mono"
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="RJ14 AB 1234"
                style={{ fontSize: '16px', letterSpacing: '1px' }}
                required
              />
            </div>

            {/* Price Summary Breakdown */}
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: '#64748b', marginBottom: '8px' }}>
                <span>Duration</span>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>{durationHours} {durationHours === 1 ? 'Hour' : 'Hours'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: '#64748b', marginBottom: '8px' }}>
                <span>Rate Factor</span>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>{pricing?.multiplier || 1.0}x</span>
              </div>
              <div style={{ height: '1px', background: '#e2e8f0', margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Total Amount</span>
                <span style={{ fontSize: '22px', fontWeight: '800', color: '#2563eb' }}>
                  {formatCurrency(totalCost)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
              Select Payment Authorization
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              {paymentOptions.map((opt) => {
                const isSelected = paymentMethod === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setPaymentMethod(opt.id)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '8px',
                      border: `1.5px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                      background: isSelected ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: isSelected ? '#2563eb' : '#0f172a' }}>
                        {opt.title}
                      </span>
                      {isSelected && <IconCheck size={16} color="#2563eb" />}
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{opt.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
          >
            {loading ? 'Processing Reservation...' : `Confirm & Authorize ${formatCurrency(totalCost)}`}
          </button>
        </form>
      </div>
    </div>
  );
}
