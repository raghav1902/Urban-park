/**
 * EV Battery & Charging Duration Calculator Modal
 * Architecture: Clean UI Component with Lucide React Icons
 * Adheres strictly to 200-350 lines limit
 */

import React, { useState, useMemo } from 'react';
import {
  EV_VEHICLE_DATABASE,
  CHARGER_PROFILES,
  computeEnergyRequiredKwh,
  computeChargingTimeMinutes,
  formatDurationHoursMinutes,
  computeEstimatedCost,
  computeCo2OffsetKg
} from '../../utils/evVehicleData';
import {
  IconClose,
  IconBatteryCharging,
  IconZap,
  IconClock,
  IconRupee,
  IconSparkles,
  IconCar,
  IconSliders
} from '../Icons';

export default function EvChargeCalculatorModal({ isOpen, onClose, ratePerKwh = 18.5, onSelectDuration }) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(EV_VEHICLE_DATABASE[0].id);
  const [currentBatteryPct, setCurrentBatteryPct] = useState(20);
  const [targetBatteryPct, setTargetBatteryPct] = useState(85);
  const [selectedChargerId, setSelectedChargerId] = useState(CHARGER_PROFILES[0].id);
  const [customBatteryKwh, setCustomBatteryKwh] = useState(35);

  const selectedVehicle = useMemo(() => {
    return EV_VEHICLE_DATABASE.find(v => v.id === selectedVehicleId) || EV_VEHICLE_DATABASE[0];
  }, [selectedVehicleId]);

  const selectedCharger = useMemo(() => {
    return CHARGER_PROFILES.find(c => c.id === selectedChargerId) || CHARGER_PROFILES[0];
  }, [selectedChargerId]);

  const effectiveCapacity = useMemo(() => {
    return selectedVehicle.id === 'custom-ev' ? customBatteryKwh : selectedVehicle.batteryKwh;
  }, [selectedVehicle, customBatteryKwh]);

  // Calculations
  const calculations = useMemo(() => {
    const kwhNeeded = computeEnergyRequiredKwh(effectiveCapacity, currentBatteryPct, targetBatteryPct);
    const durationMins = computeChargingTimeMinutes(
      kwhNeeded,
      selectedCharger.powerKw,
      selectedVehicle.maxDcKw,
      selectedCharger.type === 'DC'
    );
    const cost = computeEstimatedCost(kwhNeeded, ratePerKwh);
    const co2Saved = computeCo2OffsetKg(kwhNeeded, selectedVehicle.efficiencyKmPerKwh);

    return {
      kwhNeeded,
      durationMins,
      formattedTime: formatDurationHoursMinutes(durationMins),
      cost,
      co2Saved
    };
  }, [effectiveCapacity, currentBatteryPct, targetBatteryPct, selectedCharger, selectedVehicle, ratePerKwh]);

  if (!isOpen) return null;

  const handleApplyToBooking = () => {
    if (onSelectDuration) {
      const hoursToReserve = Math.max(1, Math.ceil(calculations.durationMins / 60));
      onSelectDuration(hoursToReserve, calculations.durationMins);
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.72)',
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
        maxWidth: '560px',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        padding: '24px',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <IconBatteryCharging size={24} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                EV Smart Charging Calculator
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
                Accurate time, kWh consumption & cost estimator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
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

        {/* Vehicle Selection */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            Select Electric Vehicle
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                color: '#0f172a',
                background: '#f8fafc',
                fontWeight: '600'
              }}
            >
              {EV_VEHICLE_DATABASE.map(v => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} ({v.batteryKwh} kWh) • {v.type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Battery Level Sliders */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '18px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
              Current Battery: <strong style={{ color: '#ef4444' }}>{currentBatteryPct}%</strong>
            </span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
              Target Charge: <strong style={{ color: '#10b981' }}>{targetBatteryPct}%</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', minWidth: '40px' }}>Start</span>
            <input
              type="range"
              min="5"
              max="90"
              step="5"
              value={currentBatteryPct}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setCurrentBatteryPct(val);
                if (val >= targetBatteryPct) setTargetBatteryPct(Math.min(100, val + 15));
              }}
              style={{ flex: 1, accentColor: '#ef4444', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748b', minWidth: '40px' }}>Target</span>
            <input
              type="range"
              min="15"
              max="100"
              step="5"
              value={targetBatteryPct}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setTargetBatteryPct(Math.max(val, currentBatteryPct + 5));
              }}
              style={{ flex: 1, accentColor: '#10b981', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Charger Speed Selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
            Select Charger Type
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
            {CHARGER_PROFILES.map(c => {
              const isSelected = selectedChargerId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedChargerId(c.id)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #10b981' : '1px solid #e2e8f0',
                    background: isSelected ? '#ecfdf5' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: '800', color: isSelected ? '#065f46' : '#1e293b' }}>
                    {c.powerKw} kW {c.type}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {c.type === 'DC' ? 'Fast Charger' : 'Wallbox AC'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Calculation Result Summary Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '22px'
        }}>
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <IconClock size={22} color="#16a34a" />
            <div>
              <div style={{ fontSize: '11px', color: '#166534', fontWeight: '600' }}>Estimated Duration</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#14532d' }}>
                {calculations.formattedTime}
              </div>
            </div>
          </div>

          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <IconZap size={22} color="#2563eb" />
            <div>
              <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: '600' }}>Energy Required</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e3a8a' }}>
                {calculations.kwhNeeded} kWh
              </div>
            </div>
          </div>

          <div style={{
            background: '#faf5ff',
            border: '1px solid #e9d5ff',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <IconRupee size={22} color="#9333ea" />
            <div>
              <div style={{ fontSize: '11px', color: '#6b21a8', fontWeight: '600' }}>Estimated Energy Cost</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#581c87' }}>
                ₹{calculations.cost}
              </div>
            </div>
          </div>

          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <IconSparkles size={22} color="#059669" />
            <div>
              <div style={{ fontSize: '11px', color: '#065f46', fontWeight: '600' }}>CO₂ Emissions Saved</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#064e3b' }}>
                {calculations.co2Saved} kg CO₂
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleApplyToBooking}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '14px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
          }}
        >
          <IconZap size={18} color="#ffffff" />
          {onSelectDuration ? `Reserve EV Slot for ${calculations.formattedTime}` : 'Confirm Calculation & Close'}
        </button>
      </div>
    </div>
  );
}
