/**
 * Printable Digital Smart Ticket Modal
 * Architecture: Clean Vector Ticket with Print & Download Layout
 * Adheres strictly to 200-300 lines limit
 */

import React from 'react';
import {
  IconClose,
  IconPrinter,
  IconQrCode,
  IconShield,
  IconCheckCircle,
  IconCar,
  IconClock,
  IconShare2
} from '../Icons';
import { toast } from 'react-toastify';

export default function DigitalTicketModal({ isOpen, onClose, booking }) {
  if (!isOpen || !booking) return null;

  const lotName = booking?.lotId?.name || booking?.lotName || 'Jaipur Smart Municipal Lot';
  const lotLocation = booking?.lotId?.location || booking?.lotLocation || 'Vidyadhar Nagar, Jaipur';
  const slotName = booking?.slotId?.slotNumber || booking?.slotNumber || 'Bay #07';
  const vehicleNumber = booking?.vehicleNumber || 'RJ-14-EA-9921';
  const bookingId = booking?._id || booking?.id || 'UP-2026-8819';
  const totalAmount = booking?.totalCost || 40;
  const qrImage = booking?.qrCode;

  const formattedStart = booking?.startTime
    ? new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    : '10:00 AM';
  const formattedEnd = booking?.endTime
    ? new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    : '01:00 PM';
  const formattedDate = booking?.startTime
    ? new Date(booking.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '08 Sep 2026';

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `UrbanPark Ticket: ${slotName}`,
        text: `My UrbanPark Reservation at ${lotName}, Slot ${slotName} for vehicle ${vehicleNumber}.`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `UrbanPark Pass: ${lotName} | Slot: ${slotName} | Vehicle: ${vehicleNumber} | Valid until: ${formattedEnd}`
      );
      toast.info('Ticket details copied to clipboard!', { toastId: 'ticket-copied' });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.78)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '94vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        padding: '24px',
        position: 'relative'
      }}>
        {/* Top Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: '#ecfdf5',
              color: '#059669',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <IconShield size={12} />
              VERIFIED SMART PASS
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '10px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* The Printable Ticket Card */}
        <div id="printable-urban-ticket" style={{
          background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
          borderRadius: '16px',
          border: '2px dashed #cbd5e1',
          padding: '20px',
          position: 'relative',
          marginBottom: '20px'
        }}>
          {/* Ticket Header */}
          <div style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.3px' }}>
              UrbanPark Jaipur
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Official Contactless Smart Parking Ticket
            </div>
            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', marginTop: '4px' }}>
              Ref: {bookingId}
            </div>
          </div>

          {/* QR Code Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0' }}>
            {qrImage ? (
              <img
                src={qrImage}
                alt="Ticket QR"
                style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '6px',
                  background: '#ffffff'
                }}
              />
            ) : (
              <div style={{
                width: '140px',
                height: '140px',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px'
              }}>
                <IconQrCode size={56} color="#64748b" />
              </div>
            )}
            <span style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', fontWeight: '600' }}>
              Scan at Boom Barrier Entry & Exit
            </span>
          </div>

          {/* Slot & Vehicle Highlights */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            background: '#ffffff',
            borderRadius: '12px',
            padding: '12px',
            border: '1px solid #e2e8f0',
            marginBottom: '14px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                Slot Number
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#2563eb' }}>
                {slotName}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                Vehicle Plate
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                {vehicleNumber}
              </div>
            </div>
          </div>

          {/* Timeline & Location Info */}
          <div style={{ fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Date:</span>
              <strong style={{ color: '#0f172a' }}>{formattedDate}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Valid Window:</span>
              <strong style={{ color: '#0f172a' }}>{formattedStart} – {formattedEnd}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Parking Lot:</span>
              <strong style={{ color: '#0f172a', textAlign: 'right', maxWidth: '60%' }}>{lotName}</strong>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '8px',
              marginTop: '4px'
            }}>
              <span style={{ fontWeight: '700', color: '#0f172a' }}>Amount Paid:</span>
              <strong style={{ fontSize: '16px', fontWeight: '900', color: '#16a34a' }}>₹{totalAmount}</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handlePrint}
            style={{
              flex: 1,
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '13px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
            }}
          >
            <IconPrinter size={18} />
            Print / Save as PDF
          </button>
          <button
            onClick={handleShare}
            style={{
              background: '#f8fafc',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              padding: '13px 18px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <IconShare2 size={16} />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
