import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../utils/api';
import { getDynamicPrice, formatCurrency } from '../utils/pricing';
import {
  IconArrowLeft,
  IconMapPin,
  IconArrowRight,
  IconCheck,
  IconZap,
  IconCar,
  IconShield,
  IconClock
} from '../components/Icons';
import SlotGridMatrix from '../components/SlotGridMatrix';
import OccupancyForecastChart from '../components/OccupancyForecastChart';

/**
 * Enterprise Slot Selection Page
 * Completely responsive, 100% white theme, clean telemetry updates and zero emojis
 */
export default function LotView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lot, setLot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterFloor, setFilterFloor] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchData();
    const socket = io('http://localhost:5000');
    socket.emit('join-lot', id);
    socket.on('slot-update', ({ changedSlots }) => {
      setSlots((prev) =>
        prev.map((slot) => {
          const changed = changedSlots.find((c) => c.slotId === slot._id);
          return changed ? { ...slot, status: changed.status } : slot;
        })
      );
    });
    return () => {
      socket.emit('leave-lot', id);
      socket.disconnect();
    };
  }, [id]);

  const fetchData = async () => {
    try {
      const [lotRes, slotsRes] = await Promise.all([
        api.get(`/parking/lots/${id}`),
        api.get(`/parking/lots/${id}/slots`)
      ]);
      setLot(lotRes.data);
      setSlots(slotsRes.data);
    } catch (err) {
      console.error('Failed to fetch lot slots:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
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
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
            Loading facility layout...
          </span>
        </div>
      </div>
    );
  }

  const currentHour = new Date().getHours();
  const availableSlotsCount = slots.filter((s) => s.status === 'available').length;
  const occupiedSlotsCount = slots.filter((s) => s.status === 'occupied').length;
  const reservedSlotsCount = slots.filter((s) => s.status === 'reserved' || s.status === 'locked').length;

  const pricing = lot
    ? getDynamicPrice(lot.pricePerHour, currentHour, lot.totalSlots, availableSlotsCount)
    : null;

  const floors = [...new Set(slots.map((s) => s.floor))].sort();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingTop: '64px', paddingBottom: '60px' }}>
      {/* Header Container */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '24px 0' }}>
        <div className="container">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-ghost"
            style={{ padding: '6px 12px', fontSize: '13px', marginBottom: '16px' }}
          >
            <IconArrowLeft size={15} />
            Back to Facility Directory
          </button>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '20px'
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#2563eb',
                  textTransform: 'uppercase',
                  marginBottom: '4px'
                }}
              >
                Facility Inspection
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
                {lot?.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                <IconMapPin size={15} color="#94a3b8" />
                <span>{lot?.location}</span>
              </div>
            </div>

            {/* Dynamic Tariff Badge */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 20px',
                textAlign: 'right'
              }}
            >
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563eb' }}>
                {formatCurrency(pricing?.price)}
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}> / hr</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: pricing?.isSurge ? '#dc2626' : '#059669', marginTop: '2px' }}>
                {pricing?.label} Rate ({pricing?.multiplier}x Tariff)
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '28px' }}>
        {/* KPI Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
            marginBottom: '28px'
          }}
        >
          <div className="stat-card">
            <span className="stat-label">Available Slots</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#059669' }}>
              {availableSlotsCount}
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-label">Occupied Vehicles</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#dc2626' }}>
              {occupiedSlotsCount}
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-label">Pending / Reserved</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#d97706' }}>
              {reservedSlotsCount}
            </div>
          </div>
        </div>

        {/* AI Occupancy & Rush Hour Predictive Forecast */}
        <OccupancyForecastChart lotName={lot.name} />

        {/* Layout with Slot Grid & Booking Panel */}
        <div className="lot-grid-layout">
          {/* Main Slots Matrix via Subcomponent */}
          <SlotGridMatrix
            slots={slots}
            floors={floors}
            filterFloor={filterFloor}
            setFilterFloor={setFilterFloor}
            filterType={filterType}
            setFilterType={setFilterType}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
          />

          {/* Sticky Checkout Summary Panel */}
          {selectedSlot && (
            <div className="checkout-drawer">
              <div className="card" style={{ background: '#ffffff', border: '1.5px solid #2563eb', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                  <IconCheck size={16} /> Slot Confirmed
                </div>

                <div style={{ margin: '16px 0', padding: '16px', background: '#eff6ff', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>
                    Selected Bay
                  </span>
                  <div className="mono" style={{ fontSize: '32px', fontWeight: '800', color: '#2563eb' }}>
                    {selectedSlot.slotNumber}
                  </div>
                  <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                    Level {selectedSlot.floor} • {selectedSlot.type.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', fontSize: '13.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Base Hourly Rate</span>
                    <span style={{ fontWeight: '600', color: '#0f172a' }}>{formatCurrency(lot.pricePerHour)}/hr</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Active Rate</span>
                    <span style={{ fontWeight: '700', color: '#2563eb' }}>{formatCurrency(pricing?.price)}/hr</span>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/book/${id}`, { state: { slot: selectedSlot, lot, pricing } })}
                  style={{ width: '100%', padding: '12px', fontSize: '14px' }}
                >
                  Proceed to Reservation
                  <IconArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .lot-grid-layout {
          display: grid;
          grid-template-columns: 1fr ${selectedSlot ? '300px' : ''};
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 860px) {
          .lot-grid-layout {
            grid-template-columns: 1fr;
          }
          .checkout-drawer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 100;
            padding: 12px;
            background: rgba(255,255,255,0.98);
            box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
            border-top: 1px solid #e2e8f0;
          }
        }
      `}</style>
    </div>
  );
}
