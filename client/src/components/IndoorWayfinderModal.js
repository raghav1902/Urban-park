import React, { useState } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { IconMapPin, IconCheck, IconCar, IconArrowRight, IconShield } from './Icons';

/**
 * Enterprise Indoor Parking Wayfinder & "Find My Car" Interactive Map
 * Renders floor blueprint with animated routing from Entrance Gate to customer's bay.
 */
export default function IndoorWayfinderModal({ booking, onClose }) {
  const slotNumber = booking.slotId?.slotNumber || 'A1';
  const floor = booking.slotId?.floor || 1;
  const lotName = booking.lotId?.name || 'Smart Parking Facility';
  const [notes, setNotes] = useState(booking.parkingNotes || '');
  const [savingNote, setSavingNote] = useState(false);

  // Compute a coordinate layout on the 600x380 SVG grid for the bay
  // Let's create an organized grid of bays A1-A12, B1-B12, etc.
  const bayIndex = parseInt(slotNumber.replace(/\D/g, ''), 10) || 1;
  const isBayEven = bayIndex % 2 === 0;
  const bayCol = Math.min(6, Math.max(1, Math.ceil(bayIndex / 2)));
  const bayX = 140 + (bayCol - 1) * 65;
  const bayY = isBayEven ? 260 : 90;

  // Path from Entrance Gate (40, 330) -> Main Corridor (140, 180) -> Target Bay
  const routePath = `M 60 330 L 120 330 L 120 180 L ${bayX + 25} 180 L ${bayX + 25} ${isBayEven ? bayY - 10 : bayY + 45}`;

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await api.patch(`/bookings/${booking._id}/notes`, { notes });
      toast.success('Pillar / Landmark memo saved!', { toastId: 'landmark-memo-saved' });
      booking.parkingNotes = notes;
    } catch (err) {
      toast.error('Failed to save parking memo.', { toastId: 'landmark-memo-error' });
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
              <IconMapPin size={15} /> Indoor Wayfinding & Car Locator
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Navigation to Bay {slotNumber} • Level {floor}
            </h2>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>
              {lotName} • Vehicle {booking.vehicleNumber}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Blueprint SVG Map */}
        <div
          style={{
            background: '#0f172a',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            position: 'relative',
            border: '2px solid #1e293b',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: '12px', right: '16px', display: 'flex', gap: '10px', fontSize: '11px', color: '#94a3b8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} /> Your Bay
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} /> Entrance
            </span>
          </div>

          <svg viewBox="0 0 600 370" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              {/* Animated pulse pattern for walking path */}
              <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Perimeter Wall & Driving Corridor */}
            <rect x="20" y="20" width="560" height="330" rx="10" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            <rect x="120" y="150" width="440" height="60" fill="#0f172a" stroke="#334155" strokeDasharray="4 4" />
            <text x="340" y="185" fill="#475569" fontSize="12" fontWeight="700" letterSpacing="2" textAnchor="middle">
              CENTRAL ACCESS CORRIDOR
            </text>

            {/* Entrance Gate */}
            <rect x="30" y="300" width="80" height="40" rx="6" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
            <text x="70" y="324" fill="#a7f3d0" fontSize="10.5" fontWeight="700" textAnchor="middle">
              GATE 1 IN
            </text>

            {/* Elevator & Stairs Landmark */}
            <rect x="30" y="40" width="70" height="50" rx="6" fill="#312e81" stroke="#6366f1" strokeWidth="1.5" />
            <text x="65" y="65" fill="#c7d2fe" fontSize="10" fontWeight="700" textAnchor="middle">LIFTS</text>
            <text x="65" y="79" fill="#818cf8" fontSize="8.5" textAnchor="middle">STAIRS A</text>

            {/* Structural Pillars */}
            {[
              { x: 190, y: 170, label: 'P1' },
              { x: 280, y: 170, label: 'P2' },
              { x: 370, y: 170, label: 'P3' },
              { x: 460, y: 170, label: 'P4' }
            ].map((p) => (
              <g key={p.label}>
                <rect x={p.x} y={p.y} width="16" height="20" rx="2" fill="#475569" stroke="#64748b" />
                <text x={p.x + 8} y={p.y + 14} fill="#e2e8f0" fontSize="8" fontWeight="800" textAnchor="middle">
                  {p.label}
                </text>
              </g>
            ))}

            {/* Row 1 Bays (Top) */}
            {[1, 3, 5, 7, 9, 11].map((num, i) => {
              const x = 140 + i * 65;
              const isTarget = slotNumber.toUpperCase() === `A${num}` || bayIndex === num;
              return (
                <g key={`top-${num}`}>
                  <rect
                    x={x}
                    y={50}
                    width={50}
                    height={80}
                    rx={6}
                    fill={isTarget ? '#1d4ed8' : '#1e293b'}
                    stroke={isTarget ? '#60a5fa' : '#334155'}
                    strokeWidth={isTarget ? 2.5 : 1}
                    filter={isTarget ? 'url(#glow)' : 'none'}
                  />
                  <text x={x + 25} y={75} fill={isTarget ? '#ffffff' : '#94a3b8'} fontSize="11" fontWeight="800" textAnchor="middle">
                    A{num}
                  </text>
                  {isTarget && (
                    <text x={x + 25} y={110} fill="#bfdbfe" fontSize="9" fontWeight="700" textAnchor="middle">
                      YOU HERE
                    </text>
                  )}
                </g>
              );
            })}

            {/* Row 2 Bays (Bottom) */}
            {[2, 4, 6, 8, 10, 12].map((num, i) => {
              const x = 140 + i * 65;
              const isTarget = slotNumber.toUpperCase() === `A${num}` || bayIndex === num;
              return (
                <g key={`bot-${num}`}>
                  <rect
                    x={x}
                    y={230}
                    width={50}
                    height={80}
                    rx={6}
                    fill={isTarget ? '#1d4ed8' : '#1e293b'}
                    stroke={isTarget ? '#60a5fa' : '#334155'}
                    strokeWidth={isTarget ? 2.5 : 1}
                    filter={isTarget ? 'url(#glow)' : 'none'}
                  />
                  <text x={x + 25} y={255} fill={isTarget ? '#ffffff' : '#94a3b8'} fontSize="11" fontWeight="800" textAnchor="middle">
                    A{num}
                  </text>
                  {isTarget && (
                    <text x={x + 25} y={290} fill="#bfdbfe" fontSize="9" fontWeight="700" textAnchor="middle">
                      YOU HERE
                    </text>
                  )}
                </g>
              );
            })}

            {/* Dynamic Walking Route Animation */}
            <path
              d={routePath}
              fill="none"
              stroke="url(#routeGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="8 6"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="28;0"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>

            {/* Target Beacon Pulse Circle */}
            <circle cx={bayX + 25} cy={isBayEven ? 270 : 90} r="12" fill="#3b82f6" opacity="0.3">
              <animate attributeName="r" values="8;18;8" dur="1.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0.1;0.7" dur="1.8s" repeatCount="indefinite" />
            </circle>
            <circle cx={bayX + 25} cy={isBayEven ? 270 : 90} r="6" fill="#60a5fa" />
          </svg>
        </div>

        {/* Turn-by-Turn Navigation Steps */}
        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
            Turn-by-Turn Walking Directions:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', fontWeight: '800', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
              <span>Enter through <strong>Gate 1 Inbound Barrier</strong> at ground level.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', fontWeight: '800', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
              <span>Proceed straight into the <strong>Central Access Corridor</strong> (past Pillar P1).</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', fontWeight: '800', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
              <span>Turn into <strong>Bay {slotNumber}</strong> (Floor {floor}) marked in glowing blue.</span>
            </div>
          </div>
        </div>

        {/* Parking Landmark Memo */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            <IconMapPin size={14} color="#2563eb" /> Parking Landmark / Pillar Memo:
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Parked opposite Pillar P3 next to Exit Stairs..."
              style={{ flex: 1, fontSize: '13px' }}
            />
            <button
              onClick={handleSaveNote}
              disabled={savingNote}
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontSize: '13px', whiteSpace: 'nowrap' }}
            >
              {savingNote ? 'Saving...' : 'Save Memo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
