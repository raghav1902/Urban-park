import React from 'react';
import { formatCurrency } from '../../utils/pricing';

/**
 * Detailed Price Summary Breakdown
 */
export default function BookingCostSummary({
  durationHours,
  parkingTariff,
  addOnsTotal,
  selectedAddOnsCount,
  evChargingFee,
  multiplier,
  totalCost
}) {
  return (
    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
        <span>Parking Bay Tariff ({durationHours} {durationHours === 1 ? 'Hour' : 'Hours'})</span>
        <span style={{ fontWeight: '600', color: '#0f172a' }}>{formatCurrency(parkingTariff)}</span>
      </div>

      {addOnsTotal > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#2563eb', marginBottom: '6px' }}>
          <span>Vehicle Care Add-ons ({selectedAddOnsCount})</span>
          <span style={{ fontWeight: '600' }}>+{formatCurrency(addOnsTotal)}</span>
        </div>
      )}

      {evChargingFee > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#059669', marginBottom: '6px' }}>
          <span>EV 22kW Fast AC Charging</span>
          <span style={{ fontWeight: '600' }}>+{formatCurrency(evChargingFee)}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
        <span>Dynamic Rate Factor</span>
        <span style={{ fontWeight: '600', color: '#0f172a' }}>{multiplier || 1.0}x</span>
      </div>

      <div style={{ height: '1px', background: '#e2e8f0', margin: '10px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Total Payable Amount</span>
        <span style={{ fontSize: '22px', fontWeight: '800', color: '#2563eb' }}>
          {formatCurrency(totalCost)}
        </span>
      </div>
    </div>
  );
}
