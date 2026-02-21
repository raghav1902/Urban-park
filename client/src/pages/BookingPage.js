import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency } from '../utils/pricing';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

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
  const [step, setStep] = useState('details'); // details | payment
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [loading, setLoading] = useState(false);

  // Timer state - start immediately with 300s (5m) for best UX
  const [lockTimeLeft, setLockTimeLeft] = useState(300);
  const [lockedSlotId, setLockedSlotId] = useState(slot?._id || null);
  const lockAttemptedRef = useRef(false);

  useEffect(() => {
    if (!slot || lockAttemptedRef.current) return;

    // Check if slot is already marked as locked in our state
    if (lockedSlotId === slot._id && lockAttemptedRef.current) return;

    lockAttemptedRef.current = true;

    const lockSlot = async () => {
      try {
        console.log('Attempting to lock slot...', slot._id);
        const response = await api.post('/parking/lock-slot', {
          slotId: slot._id,
          userId: user?._id || 'guest'
        });

        if (response.data.success) {
          console.log('Slot locked successfully');
          setLockedSlotId(slot._id);
          if (response.data.expiresIn) {
            setLockTimeLeft(response.data.expiresIn);
          }
        }
      } catch (error) {
        console.error('Locking failed:', error);
        toast.error(error.response?.data?.message || 'Slot is unavailable');
        // If it's already locked by someone else, we must go back
        if (error.response?.status === 400) {
          navigate(-1);
        }
      }
    };

    lockSlot();
  }, [slot, navigate, user, lockedSlotId]);

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
  }, [lockTimeLeft, lockedSlotId]);

  const handleAutoUnlock = async () => {
    if (!lockedSlotId) return;
    try {
      await api.post('/parking/unlock-slot', { slotId: lockedSlotId });
      setLockedSlotId(null);
      setLockTimeLeft(0);
      toast.info('Session expired. Slot released.');
      navigate(-1);
    } catch (error) {
      console.error('Failed to unlock:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };



  if (!slot || !lot) return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', paddingTop: '100px', textAlign: 'center', color: 'var(--text-dim)' }}>
      No booking data. <button onClick={() => navigate('/dashboard')} style={{ color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer' }}>Go back</button>
    </div>
  );

  const duration = Math.max(1, Math.ceil((new Date(endTime) - new Date(startTime)) / 3600000));
  const startHour = new Date(startTime).getHours();
  const { price: hourlyRate, label: pricingLabel } = pricing || { price: lot.pricePerHour, label: 'Normal' };
  const totalCost = hourlyRate * duration;

  const handleBook = async () => {
    if (!vehicleNumber.trim()) { toast.error('Enter vehicle number'); return; }
    if (new Date(startTime) >= new Date(endTime)) { toast.error('End time must be after start time'); return; }
    setLoading(true);
    try {
      const res = await api.post('/bookings', {
        slotId: slot._id, lotId, startTime, endTime, vehicleNumber, paymentMethod
      });
      toast.success('Booking confirmed! 🎉');
      navigate(`/booking-success/${res.data._id}`, { state: { booking: res.data } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', paddingTop: '80px', paddingBottom: '60px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer',
          fontSize: '14px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px'
        }}>← Back to Slot Selection</button>

        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Confirm Booking</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: '32px' }}>Review your details before confirming</p>

        {/* Reservation Timer - FORCED VISIBILITY */}
        {slot && lockTimeLeft > 0 && (
          <div style={{
            padding: '20px',
            background: 'linear-gradient(90deg, rgba(0, 232, 122, 0.1) 0%, rgba(0, 180, 216, 0.1) 100%)',
            border: `2px solid ${lockTimeLeft < 60 ? '#ef4444' : 'var(--green)'}`,
            borderRadius: '16px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: lockTimeLeft < 60 ? '0 0 20px rgba(239, 68, 68, 0.3)' : '0 0 15px rgba(0, 232, 122, 0.1)',
            animation: lockTimeLeft < 60 ? 'pulse 1s infinite' : 'none',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, width: `${(lockTimeLeft / 300) * 100}%`,
              height: '3px', background: lockTimeLeft < 60 ? '#ef4444' : 'var(--green)',
              transition: 'width 1s linear'
            }} />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '18px' }}>⏳</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Slot Reserved
                </span>
                <span style={{ background: 'var(--green)', color: '#000', fontSize: '10px', fontWeight: '900', padding: '2px 6px', borderRadius: '4px' }}>LIVE</span>
              </div>
              <div style={{ color: lockTimeLeft < 60 ? '#ef4444' : 'var(--text-dim)', fontSize: '14px', fontWeight: '500' }}>
                {lockTimeLeft < 60 ? '⚠️ FINAL SECONDS! Finish payment now.' : 'Your spot is secured. Complete payment to finalize.'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '36px', fontWeight: '900', fontFamily: 'JetBrains Mono', color: lockTimeLeft < 60 ? '#ef4444' : 'var(--green)', lineHeight: '1', textShadow: `0 0 10px ${lockTimeLeft < 60 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(0, 232, 122, 0.5)'}` }}>
                {formatTime(lockTimeLeft)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 'bold', letterSpacing: '1px' }}>MIN : SEC</div>
            </div>
          </div>
        )}

        <style>
          {`
            @keyframes pulse {
              0% { opacity: 1; }
              50% { opacity: 0.6; }
              100% { opacity: 1; }
            }
          `}
        </style>

        {/* Slot summary */}
        <div className="card" style={{ marginBottom: '20px', border: '1px solid rgba(0, 232, 122, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Selected Slot
              </div>
              <div style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'JetBrains Mono', color: 'var(--green)' }}>
                {slot.slotNumber}
              </div>
              <div style={{ color: 'var(--text-dim)', fontSize: '14px', marginTop: '4px' }}>
                Floor {slot.floor} • {slot.type} • {lot.name}
              </div>
              {pricing?.isSurge && (
                <div style={{ marginTop: '8px', display: 'inline-block', padding: '4px 10px', background: '#ef4444', color: '#fff', borderRadius: '6px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  ⚡ Surge Price Active
                </div>
              )}
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: pricing?.isSurge ? '#ef4444' : 'var(--accent)', fontFamily: 'JetBrains Mono', marginTop: '8px' }}>
              {formatCurrency(hourlyRate)}/hr
            </div>
          </div>
        </div>

        {/* Booking details */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Booking Details</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Start Time
              </label>
              <input className="input" type="datetime-local" value={startTime}
                onChange={e => setStartTime(e.target.value)} min={new Date().toISOString().slice(0, 16)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                End Time
              </label>
              <input className="input" type="datetime-local" value={endTime}
                onChange={e => setEndTime(e.target.value)} min={startTime} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Vehicle Number
            </label>
            <input className="input mono" type="text" value={vehicleNumber}
              onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
              placeholder="RJ14 XX 1234" style={{ letterSpacing: '2px', fontSize: '18px' }} />
          </div>

          {/* Duration & cost */}
          <div style={{ padding: '16px', background: 'var(--navy-light)', borderRadius: '10px', border: '1px solid var(--navy-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Rate ({pricingLabel})</span>
              <span style={{ fontWeight: '600', color: pricing?.isSurge ? '#ef4444' : 'var(--text)' }}>{formatCurrency(hourlyRate)}/hr</span>
            </div>
            <div style={{ height: 1, background: 'var(--navy-border)', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800' }}>
              <span>Total</span>
              <span style={{ color: 'var(--green)', fontFamily: 'JetBrains Mono' }}>{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Payment Method</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {[
              { id: 'upi', icon: '🏧', label: 'UPI', sub: 'GPay, PhonePe, Paytm' },
              { id: 'card', icon: '💳', label: 'Card', sub: 'Debit / Credit' },
              { id: 'netbanking', icon: '🏦', label: 'Net Banking', sub: 'All major banks' },
              { id: 'wallet', icon: '👛', label: 'Wallet', sub: 'Paytm, Mobikwik' },
            ].map(m => (
              <button key={m.id} onClick={() => setPaymentMethod(m.id)} style={{
                padding: '16px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                background: paymentMethod === m.id ? 'rgba(0, 232, 122, 0.1)' : 'var(--navy-light)',
                border: `2px solid ${paymentMethod === m.id ? 'var(--green)' : 'var(--navy-border)'}`,
                color: 'var(--text)', transition: 'all 0.2s', fontFamily: 'Outfit'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>{m.icon}</div>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>{m.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{m.sub}</div>
              </button>
            ))}
          </div>
        </div>

        <button className="btn-primary" onClick={handleBook} disabled={loading}
          style={{ width: '100%', justifyContent: 'center', fontSize: '17px', padding: '16px' }}>
          {loading ? '⏳ Processing...' : `✅ Pay ${formatCurrency(totalCost)} & Confirm`}
        </button>
      </div>
    </div>
  );
}
