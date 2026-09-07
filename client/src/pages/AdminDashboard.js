import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatCurrency } from '../utils/pricing';
import DemandChart from '../components/DemandChart';
import {
  IconBarChart,
  IconBuilding,
  IconCalendar,
  IconUser,
  IconCreditCard,
  IconShield,
  IconArrowRight
} from '../components/Icons';

const STATUS_BADGES = {
  confirmed: 'badge-green',
  active: 'badge-blue',
  pending: 'badge-amber',
  completed: 'badge-gray',
  cancelled: 'badge-red'
};

/**
 * Enterprise Administrative Analytics Dashboard
 * Completely responsive, 100% white theme, high contrast analytics, zero emojis
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then((res) => setStats(res.data))
      .catch((err) => console.error('Failed to load admin telemetry:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingTop: '80px', paddingBottom: '60px' }}>
      <div className="container">
        {/* Header Block */}
        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#2563eb',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '4px'
            }}
          >
            Operations & Telemetry
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            Jaipur Municipal Administration Overview
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>
            System KPIs, real-time bay utilization, and transaction records.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card" style={{ height: '110px', background: '#ffffff' }} />
            ))}
          </div>
        ) : stats ? (
          <>
            {/* KPI Metric Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '28px'
              }}
            >
              <div className="stat-card">
                <span className="stat-label">Gross Revenue</span>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#059669' }}>
                  {formatCurrency(stats.totalRevenue)}
                </div>
                <span className="stat-caption">
                  Today: {formatCurrency(stats.todayRevenue)}
                </span>
              </div>

              <div className="stat-card">
                <span className="stat-label">Active City Occupancy</span>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb' }}>
                  {stats.occupancyPercent}%
                </div>
                <span className="stat-caption">
                  {stats.occupiedSlots + stats.reservedSlots} of {stats.totalSlots} Slots Assigned
                </span>
              </div>

              <div className="stat-card">
                <span className="stat-label">Active Vehicle Sessions</span>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#d97706' }}>
                  {stats.activeBookings}
                </div>
                <span className="stat-caption">
                  {stats.totalBookings} Cumulative Reservations
                </span>
              </div>

              <div className="stat-card">
                <span className="stat-label">Registered Citizens</span>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
                  {stats.totalUsers}
                </div>
                <span className="stat-caption">
                  Across {stats.totalLots} Jaipur Facilities
                </span>
              </div>
            </div>

            {/* Inventory Distribution */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '28px'
              }}
            >
              <div className="card" style={{ background: '#ffffff', textAlign: 'center', padding: '18px' }}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669' }}>
                  {stats.availableSlots}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginTop: '4px' }}>
                  Available Bays
                </div>
                <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(stats.availableSlots / stats.totalSlots) * 100}%`,
                      height: '100%',
                      background: '#059669'
                    }}
                  />
                </div>
              </div>

              <div className="card" style={{ background: '#ffffff', textAlign: 'center', padding: '18px' }}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#dc2626' }}>
                  {stats.occupiedSlots}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginTop: '4px' }}>
                  Occupied Vehicles
                </div>
                <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(stats.occupiedSlots / stats.totalSlots) * 100}%`,
                      height: '100%',
                      background: '#dc2626'
                    }}
                  />
                </div>
              </div>

              <div className="card" style={{ background: '#ffffff', textAlign: 'center', padding: '18px' }}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#d97706' }}>
                  {stats.reservedSlots}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginTop: '4px' }}>
                  Reserved / Locked
                </div>
                <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(stats.reservedSlots / stats.totalSlots) * 100}%`,
                      height: '100%',
                      background: '#d97706'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* AI Demand Prediction Telemetry Chart Component */}
            <DemandChart />

            {/* Recent Booking Ledger Table */}
            <div className="card" style={{ background: '#ffffff', padding: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}
              >
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                  Recent Platform Reservations
                </h2>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Latest 10 Sessions</span>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Citizen / Driver</th>
                      <th>Facility</th>
                      <th>Bay</th>
                      <th>Schedule</th>
                      <th>Amount</th>
                      <th>State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.recentBookings || []).map((b) => (
                      <tr key={b._id}>
                        <td>
                          <div style={{ fontWeight: '600', color: '#0f172a' }}>{b.userId?.name || 'Customer'}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{b.userId?.phone}</div>
                        </td>
                        <td>{b.lotId?.name}</td>
                        <td className="mono" style={{ fontWeight: '700', color: '#2563eb' }}>
                          {b.slotId?.slotNumber || '—'}
                        </td>
                        <td style={{ fontSize: '13px', color: '#475569' }}>
                          {new Date(b.startTime).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td style={{ fontWeight: '700', color: '#0f172a' }}>
                          {formatCurrency(b.totalCost)}
                        </td>
                        <td>
                          <span className={`badge ${STATUS_BADGES[b.status] || 'badge-gray'}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
