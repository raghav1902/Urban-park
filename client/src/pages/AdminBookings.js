import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatCurrency, formatDate, formatTime } from '../utils/pricing';
import { toast } from 'react-toastify';
import {
  IconCalendar,
  IconSearch,
  IconFilter,
  IconShield,
  IconCar
} from '../components/Icons';

const STATUS_BADGES = {
  confirmed: 'badge-green',
  active: 'badge-blue',
  pending: 'badge-amber',
  completed: 'badge-gray',
  cancelled: 'badge-red'
};

/**
 * Enterprise Global Bookings Administration
 * Completely responsive, 100% white theme, clean filtering and zero emojis
 */
export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/admin/bookings');
      setBookings(res.data);
    } catch (err) {
      console.error('Failed to load global bookings:', err);
      toast.error('Failed to load platform reservations.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = filter === 'all' || b.status === filter;
    const matchesSearch =
      !searchTerm ||
      b.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.lotId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingTop: '80px', paddingBottom: '60px' }}>
      <div className="container">
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '16px',
            marginBottom: '28px'
          }}
        >
          <div>
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
              Registry Records
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
              Platform Reservations Ledger
            </h1>
            <p style={{ color: '#64748b', fontSize: '15px', marginTop: '2px' }}>
              Comprehensive log of all citizen parking reservations across Jaipur.
            </p>
          </div>

          {/* Search Input */}
          <div style={{ width: '100%', maxWidth: '320px', position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <IconSearch size={16} />
            </div>
            <input
              className="input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vehicle, driver or lot..."
              style={{ paddingLeft: '38px', height: '40px', fontSize: '13.5px' }}
            />
          </div>
        </div>

        {/* Status Filter Tab Group */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '20px',
            background: '#ffffff',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}
        >
          {['all', 'confirmed', 'active', 'completed', 'cancelled'].map((tab) => {
            const isActive = filter === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={isActive ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'all' ? 'All Sessions' : tab}
              </button>
            );
          })}
        </div>

        {/* Data Table */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card" style={{ height: '70px', background: '#ffffff' }} />
            ))}
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Session Ref</th>
                  <th>Driver Details</th>
                  <th>Vehicle Plate</th>
                  <th>Parking Zone</th>
                  <th>Bay Level</th>
                  <th>Time Interval</th>
                  <th>Tariff</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                      No parking records found matching the specified parameters.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td className="mono" style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '600' }}>
                        #{booking._id.slice(-6).toUpperCase()}
                      </td>

                      <td>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>
                          {booking.userId?.name || 'Citizen'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {booking.userId?.phone}
                        </div>
                      </td>

                      <td className="mono" style={{ fontWeight: '700', color: '#0f172a' }}>
                        {booking.vehicleNumber || '—'}
                      </td>

                      <td style={{ color: '#475569' }}>
                        {booking.lotId?.name}
                      </td>

                      <td>
                        <div className="mono" style={{ fontWeight: '700', color: '#2563eb' }}>
                          {booking.slotId?.slotNumber || '—'}
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Floor {booking.slotId?.floor || '1'}
                        </span>
                      </td>

                      <td style={{ fontSize: '13px', color: '#475569' }}>
                        <div>{formatDate(booking.startTime)}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                        </div>
                      </td>

                      <td style={{ fontWeight: '700', color: '#0f172a' }}>
                        {formatCurrency(booking.totalCost)}
                      </td>

                      <td>
                        <span className={`badge ${STATUS_BADGES[booking.status] || 'badge-gray'}`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
