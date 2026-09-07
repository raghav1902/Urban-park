import React, { useMemo } from 'react';
import { IconCheck, IconZap, IconFilter } from './Icons';

/**
 * Enterprise Slot Grid Matrix Subcomponent
 * Displays multi-level parking bay matrix, dynamic filters, responsive slot cards, and status legend.
 * Fully responsive across mobile viewports (320px–480px) and large displays.
 */
export default function SlotGridMatrix({
  slots,
  floors,
  filterFloor,
  setFilterFloor,
  filterType,
  setFilterType,
  selectedSlot,
  onSelectSlot
}) {
  // Filter slots based on floor level and vehicle bay type
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      const matchFloor = filterFloor === 'all' || String(slot.floor) === String(filterFloor);
      const matchType = filterType === 'all' || slot.type === filterType;
      return matchFloor && matchType;
    });
  }, [slots, filterFloor, filterType]);

  const slotTypeLabels = {
    regular: 'Standard Bay',
    compact: 'Compact',
    ev: 'EV Charging',
    handicapped: 'Accessible'
  };

  return (
    <div>
      {/* Floor & Type Filter Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          background: '#ffffff',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}
      >
        {/* Floor Level Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginRight: '4px' }}>
            Level:
          </span>
          <button
            onClick={() => setFilterFloor('all')}
            className={filterFloor === 'all' ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            All Floors
          </button>
          {floors.map((f) => (
            <button
              key={f}
              onClick={() => setFilterFloor(String(f))}
              className={filterFloor === String(f) ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Level {f}
            </button>
          ))}
        </div>

        {/* Slot Type Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginRight: '4px' }}>
            Bay Type:
          </span>
          {['all', 'regular', 'compact', 'ev', 'handicapped'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={filterType === type ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ padding: '6px 12px', fontSize: '12px', textTransform: 'capitalize' }}
            >
              {type === 'all' ? 'All Types' : type === 'ev' ? 'EV Charging' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Slots Matrix Card */}
      <div
        className="card"
        style={{
          background: '#ffffff',
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))',
          gap: '10px'
        }}
      >
        {filteredSlots.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '36px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '14px'
            }}
          >
            No parking bays match the selected filters on this level.
          </div>
        ) : (
          filteredSlots.map((slot) => {
            const isAvailable = slot.status === 'available';
            const isSelected = selectedSlot?._id === slot._id;

            let slotClass = 'slot-available';
            if (slot.status === 'occupied') slotClass = 'slot-occupied';
            if (slot.status === 'reserved') slotClass = 'slot-reserved';
            if (slot.status === 'locked') slotClass = 'slot-locked';
            if (isSelected) slotClass = 'slot-selected';

            return (
              <button
                key={slot._id}
                onClick={() => isAvailable && onSelectSlot(isSelected ? null : slot)}
                disabled={!isAvailable}
                className={`slot-card ${slotClass}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  minHeight: '74px',
                  position: 'relative'
                }}
              >
                {slot.type === 'ev' && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      color: isSelected ? '#2563eb' : '#059669'
                    }}
                  >
                    <IconZap size={11} />
                  </span>
                )}
                <span
                  style={{
                    fontSize: '9.5px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    opacity: 0.8
                  }}
                >
                  {slot.type === 'ev' ? 'EV Port' : slot.type}
                </span>
                <span className="mono" style={{ fontSize: '14px', fontWeight: '800' }}>
                  {slot.slotNumber}
                </span>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}
                >
                  {slot.status}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Legend Indicators */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          marginTop: '16px',
          flexWrap: 'wrap',
          background: '#ffffff',
          padding: '12px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#475569' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ffffff', border: '1.5px solid #cbd5e1' }} />
          Available
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#475569' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#eff6ff', border: '1.5px solid #2563eb' }} />
          Selected
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#475569' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f1f5f9', border: '1px solid #e2e8f0' }} />
          Occupied
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#475569' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#fef3c7', border: '1px solid #fde68a' }} />
          Reserved / Locked
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#475569' }}>
          <IconZap size={13} color="#059669" />
          EV Equipped
        </div>
      </div>
    </div>
  );
}
