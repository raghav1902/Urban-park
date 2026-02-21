import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatCurrency } from '../utils/pricing';
import { toast } from 'react-toastify';

export default function AdminBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await api.get('/admin/bookings');
            setBookings(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.put(`/admin/bookings/${id}/status`, { status });
            setBookings(prev => prev.map(b => b._id === id ? { ...b, status } : b));
            toast.success(`Booking marked as ${status}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed');
        }
    };

    const filteredBookings = bookings.filter(b =>
        filter === 'all' || b.status === filter
    );

    const STATUS_COLORS = {
        confirmed: '#00e87a',
        pending: '#f59e0b',
        active: '#00d4ff',
        completed: '#64748b',
        cancelled: '#ef4444'
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--navy)', paddingTop: '80px', paddingBottom: '60px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
                            All <span style={{ color: 'var(--green)' }}>Bookings</span>
                        </h1>
                        <p style={{ color: 'var(--text-dim)' }}>Manage and monitor all parking reservations</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['all', 'confirmed', 'active', 'completed', 'cancelled'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={filter === f ? 'btn-primary' : 'btn-ghost'}
                                style={{ padding: '6px 12px', fontSize: '13px', textTransform: 'capitalize' }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: 60 }} />)}
                    </div>
                ) : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(26, 45, 74, 0.3)' }}>
                                        {['Booking ID', 'User', 'Parking Lot', 'Slot', 'Time Window', 'Amount', 'Status'].map(h => (
                                            <th key={h} style={{ padding: '16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--navy-border)' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                                                No bookings found with status: <strong>{filter}</strong>
                                            </td>
                                        </tr>
                                    ) : filteredBookings.map(b => (
                                        <tr key={b._id} style={{ borderBottom: '1px solid rgba(26,45,74,0.5)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '16px', fontFamily: 'JetBrains Mono', fontSize: '12px', color: 'var(--text-dim)' }}>
                                                #{b._id.slice(-6).toUpperCase()}
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ fontWeight: '600' }}>{b.userId?.name || 'N/A'}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{b.userId?.phone}</div>
                                            </td>
                                            <td style={{ padding: '16px', color: 'var(--text-dim)' }}>{b.lotId?.name}</td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--green)', fontWeight: '700' }}>
                                                    {b.slotId?.slotNumber || '—'}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Floor {b.slotId?.floor}</div>
                                            </td>
                                            <td style={{ padding: '16px', color: 'var(--text-dim)', fontSize: '12px' }}>
                                                <div>{new Date(b.startTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                                                <div style={{ color: 'var(--text-muted)' }}>— {new Date(b.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td style={{ padding: '16px', fontWeight: '700', color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>
                                                {formatCurrency(b.totalCost)}
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <span className={`badge`} style={{
                                                    background: `${STATUS_COLORS[b.status]}20`,
                                                    color: STATUS_COLORS[b.status],
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {b.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
