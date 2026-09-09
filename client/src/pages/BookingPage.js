import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency } from '../utils/pricing';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { IconArrowLeft } from '../components/Icons';
import BookingHoldTimer from '../components/booking/BookingHoldTimer';
import ConciergeAddonSelector, { CONCIERGE_SERVICES } from '../components/booking/ConciergeAddonSelector';
import PaymentMethodSelector from '../components/booking/PaymentMethodSelector';
import BookingCostSummary from '../components/booking/BookingCostSummary';

const toLocalInputFormat = (date) => {
  const pad = (num) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Enterprise Booking & Payment Confirmation Page
 */
export default function BookingPage() {
  const { id: lotId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { slot, lot, pricing } = state || {};

  const now = new Date();
  const defaultEnd = new Date(now.getTime() + 2 * 3600000);

  const [startTime, setStartTime] = useState(toLocalInputFormat(now));
  const [endTime, setEndTime] = useState(toLocalInputFormat(defaultEnd));
  const [selectedPreset, setSelectedPreset] = useState(2);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('free_demo');
  const [loading, setLoading] = useState(false);

  // Smart Add-ons & EV Charging
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [enableEvCharging, setEnableEvCharging] = useState(slot?.type === 'ev');
  const [parkingNotes, setParkingNotes] = useState('');

  const toggleAddOn = (id) => {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleQuickSelectDuration = (hours) => {
    const start = new Date();
    const end = new Date(start.getTime() + hours * 3600000);
    setStartTime(toLocalInputFormat(start));
    setEndTime(toLocalInputFormat(end));
    setSelectedPreset(hours);
  };

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
        if (error.response?.status === 400 || error.response?.status === 409) {
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
  const parkingTariff = hourlyRate * durationHours;

  const addOnsTotal = selectedAddOns.reduce((sum, id) => {
    const s = CONCIERGE_SERVICES.find((srv) => srv.id === id);
    return sum + (s ? s.price : 0);
  }, 0);

  const isEvSlot = slot?.type === 'ev';
  const evChargingFee = (enableEvCharging && isEvSlot) ? 225 : 0;
  const totalCost = parkingTariff + addOnsTotal + evChargingFee;

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
        paymentMethod,
        addOnServices: selectedAddOns.map((id) => {
          const s = CONCIERGE_SERVICES.find((srv) => srv.id === id);
          return { id: s.id, name: s.name, price: s.price };
        }),
        evCharging: {
          enabled: enableEvCharging && isEvSlot,
          chargerType: 'Type-2 22kW Fast AC',
          chargingCost: evChargingFee,
          currentBatteryPct: 45
        },
        parkingNotes
      });

      toast.success('Reservation confirmed successfully.');
      navigate(`/booking-success/${res.data._id}`, { state: { booking: res.data } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reservation failed.');
    } finally {
      setLoading(false);
    }
  };

  const durationPresets = [
    { label: '1 Hr', hours: 1 },
    { label: '2 Hrs', hours: 2 },
    { label: '3 Hrs', hours: 3 },
    { label: '4 Hrs', hours: 4 },
    { label: '6 Hrs', hours: 6 },
    { label: '8 Hrs', hours: 8 },
    { label: '12 Hrs', hours: 12 },
    { label: '24 Hrs', hours: 24 }
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
        <BookingHoldTimer lockTimeLeft={lockTimeLeft} />

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
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
              Reservation Interval & Vehicle Info
            </h2>

            {/* Quick Duration Presets */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="input-label" style={{ margin: 0, fontWeight: '600', color: '#334155' }}>
                  Quick Duration Presets
                </label>
                <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600' }}>
                  Current Time + Selected Hours
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(75px, 1fr))', gap: '8px' }}>
                {durationPresets.map((preset) => {
                  const isActive = selectedPreset === preset.hours;
                  return (
                    <button
                      key={preset.hours}
                      type="button"
                      onClick={() => handleQuickSelectDuration(preset.hours)}
                      style={{
                        padding: '9px 6px',
                        borderRadius: '8px',
                        border: isActive ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: isActive ? '#eff6ff' : '#f8fafc',
                        color: isActive ? '#1d4ed8' : '#334155',
                        fontWeight: isActive ? '700' : '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'center',
                        boxShadow: isActive ? '0 1px 3px rgba(37,99,235,0.2)' : 'none'
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '18px' }}>
              <div>
                <label className="input-label" htmlFor="start-time">Arrival Timestamp</label>
                <input
                  id="start-time"
                  className="input"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setSelectedPreset(null);
                  }}
                  min={toLocalInputFormat(new Date())}
                  required
                />
              </div>

              <div>
                <label className="input-label" htmlFor="end-time">Departure Timestamp</label>
                <input
                  id="end-time"
                  className="input"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setSelectedPreset(null);
                  }}
                  min={startTime}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="input-label" htmlFor="vehicle-number">Vehicle Registration Plate</label>
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

            {/* EV Charging & Concierge Add-ons */}
            <ConciergeAddonSelector
              isEvSlot={isEvSlot}
              enableEvCharging={enableEvCharging}
              setEnableEvCharging={setEnableEvCharging}
              selectedAddOns={selectedAddOns}
              toggleAddOn={toggleAddOn}
              parkingNotes={parkingNotes}
              setParkingNotes={setParkingNotes}
            />

            {/* Price Summary Breakdown */}
            <BookingCostSummary
              durationHours={durationHours}
              parkingTariff={parkingTariff}
              addOnsTotal={addOnsTotal}
              selectedAddOnsCount={selectedAddOns.length}
              evChargingFee={evChargingFee}
              multiplier={pricing?.multiplier}
              totalCost={totalCost}
            />
          </div>

          {/* Payment Method Selector */}
          <PaymentMethodSelector paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />

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
