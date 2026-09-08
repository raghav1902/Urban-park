import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate, formatTime } from '../utils/pricing';
import {
  IconCheckCircle,
  IconClock,
  IconCalendar,
  IconMapPin,
  IconCreditCard,
  IconDownload,
  IconCar,
  IconQrCode
} from '../components/Icons';
import IndoorWayfinderModal from '../components/IndoorWayfinderModal';

/**
 * Enterprise Booking Confirmation & Gate Pass Voucher
 * Pure white theme, responsive printable pass, zero emojis
 */
export default function BookingSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWayfinder, setShowWayfinder] = useState(false);

  useEffect(() => {
    api.get(`/bookings/${id}`)
      .then((res) => setBooking(res.data))
      .catch((err) => console.error('Failed to load booking:', err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '64px'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#2563eb',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px'
            }}
          />
          <span style={{ fontSize: '14px', color: '#64748b' }}>Generating digital gate passport...</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', paddingTop: '100px', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '15px' }}>Reservation record not found.</p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ marginTop: '16px' }}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const isExtended = (booking.extendedHours && booking.extendedHours > 0) || (booking.extensionCount && booking.extensionCount > 0);
  const extHours = booking.extendedHours || (booking.extensionCount ? booking.extensionCount : 0);
  const origDuration = booking.originalDuration || (isExtended ? Math.max(1, booking.duration - extHours) : booking.duration);
  const actualExtHours = booking.duration > origDuration ? booking.duration - origDuration : extHours;
  const origCost = booking.originalCost != null ? booking.originalCost : (isExtended ? Math.max(0, booking.totalCost - (booking.extendedCost || 0)) : booking.totalCost);
  const extCost = booking.extendedCost != null ? booking.extendedCost : (isExtended ? Math.max(0, booking.totalCost - origCost) : 0);

  const receiptItems = [
    { label: 'Facility Name', value: booking.lotId?.name },
    { label: 'Allocated Bay', value: booking.slotId?.slotNumber, mono: true, highlight: true },
    { label: 'Floor Level', value: `Floor ${booking.slotId?.floor}` },
    { label: 'Registered Vehicle', value: booking.vehicleNumber, mono: true },
    { label: 'Reservation Date', value: formatDate(booking.startTime) },
    { label: 'Arrival Window', value: formatTime(booking.startTime) },
    { label: 'Departure Window', value: formatTime(booking.endTime) },
    ...(isExtended && actualExtHours > 0
      ? [
          { label: 'Initial Booked Duration', value: `${origDuration} ${origDuration === 1 ? 'Hour' : 'Hours'}` },
          {
            label: 'Extended Duration',
            value: `+${actualExtHours} ${actualExtHours === 1 ? 'Hour' : 'Hours'} (Extension Pass)`,
            color: '#2563eb',
            fontWeight: '700'
          },
          {
            label: 'Total Authorized Duration',
            value: `${booking.duration} ${booking.duration === 1 ? 'Hour' : 'Hours'}`,
            highlight: true
          },
          ...(extCost > 0
            ? [
                { label: 'Initial Base Tariff', value: formatCurrency(origCost) },
                { label: 'Extension Tariff', value: `+${formatCurrency(extCost)}`, color: '#2563eb', fontWeight: '700' },
                { label: 'Total Tariff Paid', value: formatCurrency(booking.totalCost), highlight: true }
              ]
            : [
                { label: 'Total Tariff Paid', value: formatCurrency(booking.totalCost), highlight: true }
              ])
        ]
      : [
          { label: 'Authorized Duration', value: `${booking.duration} ${booking.duration === 1 ? 'Hour' : 'Hours'}` },
          { label: 'Tariff Paid', value: formatCurrency(booking.totalCost) }
        ]),
    ...(booking.evCharging?.enabled
      ? [{ label: 'EV Smart Charger', value: `${booking.evCharging.chargerType} (Enabled)`, color: '#059669', fontWeight: '700' }]
      : []),
    ...(booking.addOnServices && booking.addOnServices.length > 0
      ? [{ label: 'Vehicle Care Add-ons', value: booking.addOnServices.map((s) => s.name).join(', ') }]
      : []),
    ...(booking.parkingNotes
      ? [{ label: 'Landmark Memo', value: booking.parkingNotes }]
      : []),
    { label: 'Pass Status', value: booking.status.toUpperCase(), badge: true }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingTop: '80px', paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: '620px', textAlign: 'center' }}>
        {/* Success Header */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#ecfdf5',
            border: '2px solid #a7f3d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 4px 14px rgba(5, 150, 105, 0.15)'
          }}
        >
          <IconCheckCircle size={32} color="#059669" />
        </div>

        <h1
          style={{
            fontSize: '28px',
            fontWeight: '800',
            color: '#0f172a',
            letterSpacing: '-0.02em',
            marginBottom: '8px'
          }}
        >
          Reservation Confirmed
        </h1>
        <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '32px' }}>
          Your digital gate pass is active. Present this QR code at the entrance sensor barrier.
        </p>

        {/* QR Code Gate Pass Card */}
        {booking.qrCode && (
          <div
            className="card"
            style={{
              marginBottom: '24px',
              padding: '28px',
              background: '#ffffff',
              border: '1.5px solid #2563eb'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: '700',
                color: '#2563eb',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '16px'
              }}
            >
              <IconQrCode size={16} /> Contactless Gate Access Code
            </div>

            <div
              style={{
                display: 'inline-block',
                padding: '16px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                marginBottom: '16px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <img
                src={booking.qrCode}
                alt="Gate Access QR Code"
                style={{ width: '190px', height: '190px', display: 'block' }}
              />
            </div>

            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Compatible with UrbanPark automated boom barriers & security scanners
            </div>
          </div>
        )}

        {/* Receipt Parameter Breakdown */}
        <div className="card" style={{ marginBottom: '24px', textAlign: 'left', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <h2
              style={{
                fontSize: '15px',
                fontWeight: '700',
                color: '#0f172a',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                margin: 0
              }}
            >
              Official Reservation Receipt
            </h2>
            {isExtended && actualExtHours > 0 && (
              <span className="badge badge-blue" style={{ fontSize: '11px' }}>
                +{actualExtHours}h Extended Pass
              </span>
            )}
          </div>

          {/* Extension Notice Callout if booking has an extension */}
          {isExtended && actualExtHours > 0 && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                background: '#eff6ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                fontSize: '12.5px',
                color: '#1e40af'
              }}
            >
              <div>
                <strong>Duration Transparency:</strong> Initial ({origDuration}h) + Extension ({actualExtHours}h)
              </div>
              <span style={{ fontWeight: '700' }}>
                Valid for {booking.duration} Hours total
              </span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {receiptItems.map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '8px',
                  borderBottom: '1px dashed #f1f5f9'
                }}
              >
                <span style={{ fontSize: '13.5px', color: '#64748b' }}>{item.label}</span>
                {item.badge ? (
                  <span className="badge badge-green">{item.value}</span>
                ) : (
                  <span
                    style={{
                      fontSize: item.highlight ? '16px' : '14px',
                      fontWeight: item.highlight ? '800' : (item.fontWeight || '600'),
                      color: item.highlight ? '#2563eb' : (item.color || '#0f172a'),
                      fontFamily: item.mono ? 'JetBrains Mono' : 'inherit'
                    }}
                  >
                    {item.value}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowWayfinder(true)}
            style={{ width: '100%', padding: '13px', background: '#1d4ed8', fontSize: '14px', fontWeight: '700' }}
          >
            🗺️ View Bay Map & Walking Route
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/dashboard')}
            style={{ flex: 1, minWidth: '150px', padding: '12px' }}
          >
            Find Another Zone
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/my-bookings')}
            style={{ flex: 1, minWidth: '150px', padding: '12px' }}
          >
            My Reservations
          </button>
          <button
            className="btn btn-ghost"
            onClick={handlePrint}
            style={{ minWidth: '110px', padding: '12px' }}
          >
            Print Receipt
          </button>
        </div>

        {/* Indoor Wayfinder Modal */}
        {showWayfinder && (
          <IndoorWayfinderModal
            booking={booking}
            onClose={() => setShowWayfinder(false)}
          />
        )}
      </div>
    </div>
  );
}
