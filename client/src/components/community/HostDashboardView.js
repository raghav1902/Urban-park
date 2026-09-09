/**
 * Host Dashboard & Management View
 * Architecture: Clean P2P Host Metrics & Controls Component
 * Adheres strictly to 200-300 lines limit
 */

import React, { useState, useEffect } from 'react';
import {
  IconHome,
  IconRupee,
  IconCar,
  IconClock,
  IconCheckCircle,
  IconShield,
  IconRefresh
} from '../Icons';
import api from '../../utils/api';
import { toast } from 'react-toastify';

export default function HostDashboardView({ onAddNewSpace }) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalSpaces: 0,
    totalRevenue: 0,
    activeReservations: 0,
    completedReservations: 0
  });
  const [listings, setListings] = useState([]);

  const fetchHostData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/parking/community/my-listings');
      if (res.data.success) {
        setMetrics(res.data.metrics);
        setListings(res.data.listings);
      }
    } catch (err) {
      console.warn('Could not fetch host listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostData();
  }, []);

  const handleToggleStatus = async (lotId, currentStatus) => {
    try {
      const res = await api.patch(`/parking/community/${lotId}/toggle`);
      toast.success(res.data.message || 'Status updated');
      setListings((prev) =>
        prev.map((l) =>
          l._id === lotId
            ? { ...l, hostDetails: { ...l.hostDetails, isActive: res.data.isActive } }
            : l
        )
      );
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div>
      {/* Top Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', marginBottom: '8px' }}>
            <IconRupee size={20} />
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Total Earnings</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a' }}>
            ₹{metrics.totalRevenue}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
            Transferred to your UPI
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', marginBottom: '8px' }}>
            <IconHome size={20} />
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Listed Spaces</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a' }}>
            {metrics.totalSpaces}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
            Active driveways & spots
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ea580c', marginBottom: '8px' }}>
            <IconClock size={20} />
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Active Guests</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a' }}>
            {metrics.activeReservations}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
            Vehicles parked right now
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', marginBottom: '8px' }}>
            <IconCheckCircle size={20} />
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Completed Stays</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a' }}>
            {metrics.completedReservations}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
            Seamless parkings handled
          </div>
        </div>
      </div>

      {/* Header & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
          Your Registered Driveways & Spots
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchHostData}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <IconRefresh size={14} />
            Refresh
          </button>
          <button
            onClick={onAddNewSpace}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            + Add New Space
          </button>
        </div>
      </div>

      {/* Listings List */}
      {listings.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '40px 20px',
          textAlign: 'center',
          border: '1px dashed #cbd5e1'
        }}>
          <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
            <IconHome size={44} color="#94a3b8" />
          </div>
          <h4 style={{ margin: '0 0 6px', fontSize: '16px', color: '#0f172a' }}>
            No Spaces Listed Yet
          </h4>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
            Start earning passive income by listing your private driveway or covered spot.
          </p>
          <button
            onClick={onAddNewSpace}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            List Your First Space Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {listings.map((lot) => {
            const isActive = lot.hostDetails?.isActive ?? true;
            return (
              <div
                key={lot._id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                      {lot.name}
                    </h4>
                    <span style={{
                      background: isActive ? '#ecfdf5' : '#fef2f2',
                      color: isActive ? '#059669' : '#dc2626',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '800'
                    }}>
                      {isActive ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    {lot.location} • ₹{lot.pricePerHour}/hr • ₹{lot.hostDetails?.dailyPrice || lot.pricePerHour * 8}/day
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    {lot.amenities?.map((a) => (
                      <span key={a} style={{ background: '#f1f5f9', color: '#475569', fontSize: '11px', padding: '2px 8px', borderRadius: '6px' }}>
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleToggleStatus(lot._id, isActive)}
                    style={{
                      background: isActive ? '#fef2f2' : '#ecfdf5',
                      color: isActive ? '#dc2626' : '#059669',
                      border: `1px solid ${isActive ? '#fecaca' : '#a7f3d0'}`,
                      borderRadius: '10px',
                      padding: '8px 14px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {isActive ? 'Pause Space' : 'Resume Space'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
