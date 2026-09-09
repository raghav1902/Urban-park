/**
 * Interactive Radar Compass & Walking Distance View
 * Architecture: Clean Vector Graphics & Motion Component
 * Adheres strictly to 200-300 lines limit
 */

import React, { useState, useEffect } from 'react';
import {
  IconCompass,
  IconNavigation,
  IconMapPin,
  IconSparkles,
  IconArrowRight
} from '../Icons';

export default function RadarCompassView({
  targetLat = 26.9751,
  targetLng = 75.7566,
  userLat = 26.9740,
  userLng = 75.7555,
  slotNumber = 'Bay #07',
  pillarNote = 'Basement B1, Pillar C-12'
}) {
  const [bearing, setBearing] = useState(42);
  const [distanceMeters, setDistanceMeters] = useState(120);
  const [pulseActive, setPulseActive] = useState(true);

  // Compute bearing and approximate walking distance
  useEffect(() => {
    if (!targetLat || !targetLng || !userLat || !userLng) return;

    const y = Math.sin((targetLng - userLng) * Math.PI / 180) * Math.cos(targetLat * Math.PI / 180);
    const x = Math.cos(userLat * Math.PI / 180) * Math.sin(targetLat * Math.PI / 180) -
              Math.sin(userLat * Math.PI / 180) * Math.cos(targetLat * Math.PI / 180) *
              Math.cos((targetLng - userLng) * Math.PI / 180);
    const calculatedBearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    setBearing(Math.round(calculatedBearing));

    // Approximate distance
    const R = 6371e3; // metres
    const φ1 = userLat * Math.PI / 180;
    const φ2 = targetLat * Math.PI / 180;
    const Δφ = (targetLat - userLat) * Math.PI / 180;
    const Δλ = (targetLng - userLng) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = Math.max(15, Math.round(R * c));
    setDistanceMeters(dist);
  }, [targetLat, targetLng, userLat, userLng]);

  const estimatedWalkingMins = Math.max(1, Math.ceil(distanceMeters / 75));

  return (
    <div style={{
      background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
      borderRadius: '18px',
      padding: '24px 20px',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)'
    }}>
      {/* Background Radial Glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '280px',
        height: '280px',
        background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none'
      }} />

      {/* Radar Dial */}
      <div style={{
        position: 'relative',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        border: '2px solid rgba(59, 130, 246, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        {/* Inner concentric distance rings */}
        <div style={{
          position: 'absolute',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          border: '1px dashed rgba(59, 130, 246, 0.3)'
        }} />
        <div style={{
          position: 'absolute',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          border: '1px solid rgba(59, 130, 246, 0.25)'
        }} />

        {/* Crosshairs */}
        <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'rgba(59, 130, 246, 0.2)' }} />
        <div style={{ position: 'absolute', height: '100%', width: '1px', background: 'rgba(59, 130, 246, 0.2)' }} />

        {/* Cardinal Markers */}
        <span style={{ position: 'absolute', top: '6px', fontSize: '11px', fontWeight: '800', color: '#60a5fa' }}>N</span>
        <span style={{ position: 'absolute', right: '8px', fontSize: '11px', fontWeight: '800', color: '#64748b' }}>E</span>
        <span style={{ position: 'absolute', bottom: '6px', fontSize: '11px', fontWeight: '800', color: '#64748b' }}>S</span>
        <span style={{ position: 'absolute', left: '8px', fontSize: '11px', fontWeight: '800', color: '#64748b' }}>W</span>

        {/* Rotating Radar Sweep Animation */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, rgba(59, 130, 246, 0.4) 0deg, transparent 60deg)',
          animation: 'spin 3s linear infinite',
          pointerEvents: 'none'
        }} />

        {/* Direction Needle Pointing Towards Vehicle */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          transform: `rotate(${bearing}deg)`,
          transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          pointerEvents: 'none'
        }}>
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: '#22c55e',
              border: '2px solid #ffffff',
              boxShadow: '0 0 12px #22c55e',
              animation: 'pulse 1.5s infinite'
            }} />
            <div style={{
              width: '0',
              height: '0',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '14px solid #3b82f6',
              marginTop: '4px'
            }} />
          </div>
        </div>

        {/* Center User Dot */}
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: '#38bdf8',
          boxShadow: '0 0 8px #38bdf8',
          zIndex: 2
        }} />
      </div>

      {/* Distance & Time Readout */}
      <div style={{ textAlign: 'center', marginBottom: '14px' }}>
        <div style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-0.5px', color: '#ffffff' }}>
          {distanceMeters} <span style={{ fontSize: '18px', fontWeight: '600', color: '#94a3b8' }}>meters</span>
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(37, 99, 235, 0.25)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          borderRadius: '20px',
          padding: '4px 12px',
          marginTop: '6px',
          fontSize: '12px',
          fontWeight: '700',
          color: '#93c5fd'
        }}>
          <IconNavigation size={13} color="#93c5fd" />
          Approx. {estimatedWalkingMins} min walk • Bearing {bearing}°
        </div>
      </div>

      {/* Landmark / Pillar Guidance Box */}
      <div style={{
        width: '100%',
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '12px',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Reserved Space & Pillar
          </div>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#f8fafc', marginTop: '2px' }}>
            {slotNumber} — {pillarNote}
          </div>
        </div>
        <div style={{
          background: '#22c55e',
          color: '#ffffff',
          borderRadius: '8px',
          padding: '4px 8px',
          fontSize: '11px',
          fontWeight: '800'
        }}>
          LOCKED
        </div>
      </div>
    </div>
  );
}
