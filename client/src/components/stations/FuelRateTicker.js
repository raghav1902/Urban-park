import React from 'react';
import { IconFuel, IconLeaf, IconZap, IconSparkles } from '../Icons';

/**
 * Live Daily Official Fuel & Energy Rates Ticker
 */
export default function FuelRateTicker({ locationAreaName, fuelRates }) {
  const shortArea = (locationAreaName || 'Current Sector').split(',')[0];

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '14px',
        padding: '16px 22px',
        color: '#ffffff',
        marginBottom: '22px',
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}
    >
      <div>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.05em' }}>
          Official Daily Fuel Rates • {shortArea}
        </div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', marginTop: '2px' }}>
          Standard Govt / IOCL / Torrent Gas Prices
        </div>
      </div>

      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        {/* Petrol */}
        <div style={{ background: 'rgba(255,255,255,0.08)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <IconFuel size={13} color="#f59e0b" /> PETROL
          </div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>{fuelRates.petrol}</div>
        </div>

        {/* Diesel */}
        <div style={{ background: 'rgba(255,255,255,0.08)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <IconFuel size={13} color="#38bdf8" /> DIESEL
          </div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>{fuelRates.diesel}</div>
        </div>

        {/* CNG */}
        <div style={{ background: 'rgba(255,255,255,0.08)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '11px', color: '#34d399', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <IconLeaf size={13} color="#34d399" /> CNG GAS
          </div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>{fuelRates.cng}</div>
        </div>

        {/* EV */}
        <div style={{ background: 'rgba(255,255,255,0.08)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '11px', color: '#818cf8', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <IconZap size={13} color="#818cf8" /> EV FAST DC
          </div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>{fuelRates.evUnit}</div>
        </div>
      </div>
    </div>
  );
}
