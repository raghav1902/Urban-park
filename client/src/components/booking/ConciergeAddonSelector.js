import React from 'react';
import { formatCurrency } from '../../utils/pricing';
import { IconZap, IconSparkles } from '../Icons';

export const CONCIERGE_SERVICES = [
  { id: 'wash', name: 'Eco Waterless Car Wash', price: 199, desc: 'Hand-detailed scratch-free exterior bio-cleaning' },
  { id: 'nitrogen', name: 'Digital Tyre Nitrogen Fill', price: 49, desc: 'All 4 tyres calibrated to exact manufacturer PSI' },
  { id: 'vacuum', name: 'Interior Deep Vacuuming', price: 149, desc: 'Cabin, seats, footmats & boot dust evacuation' }
];

/**
 * Concierge Services & EV Charging Add-on Selector
 */
export default function ConciergeAddonSelector({
  isEvSlot,
  enableEvCharging,
  setEnableEvCharging,
  selectedAddOns,
  toggleAddOn,
  parkingNotes,
  setParkingNotes
}) {
  return (
    <>
      {/* EV Charging Station Option if Slot is EV */}
      {isEvSlot && (
        <div
          style={{
            marginBottom: '16px',
            padding: '14px 16px',
            background: enableEvCharging ? '#eff6ff' : '#f8fafc',
            border: enableEvCharging ? '2px solid #2563eb' : '1px solid #e2e8f0',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onClick={() => setEnableEvCharging(!enableEvCharging)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                checked={enableEvCharging}
                onChange={() => {}}
                style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                  <IconZap size={15} color="#2563eb" /> Activate EV Smart Charging (Type-2 22kW AC)
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Smart connector auto-initializes upon bay sensor vehicle lock
                </div>
              </div>
            </div>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#2563eb' }}>
              +₹225 <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748b' }}>flat session</span>
            </span>
          </div>
        </div>
      )}

      {/* Smart Concierge & Vehicle Care Add-ons */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            <IconSparkles size={14} color="#0284c7" /> Smart Concierge & Vehicle Care Add-ons
          </span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Fulfilled while parked</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {CONCIERGE_SERVICES.map((srv) => {
            const isChecked = selectedAddOns.includes(srv.id);
            return (
              <div
                key={srv.id}
                onClick={() => toggleAddOn(srv.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: isChecked ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                  background: isChecked ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                  />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                      {srv.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{srv.desc}</div>
                  </div>
                </div>
                <span style={{ fontSize: '13.5px', fontWeight: '700', color: isChecked ? '#1d4ed8' : '#0f172a' }}>
                  +{formatCurrency(srv.price)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Parking Landmark Memo Notes */}
      <div style={{ marginBottom: '20px' }}>
        <label className="input-label" htmlFor="parking-notes">
          Pillar / Parking Note (Optional)
        </label>
        <input
          id="parking-notes"
          className="input"
          type="text"
          value={parkingNotes}
          onChange={(e) => setParkingNotes(e.target.value)}
          placeholder="e.g. Near Lift B, blue sedan, luggage in boot"
          style={{ fontSize: '13.5px' }}
        />
      </div>
    </>
  );
}
