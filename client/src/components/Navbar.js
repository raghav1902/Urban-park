import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Minimalist UrbanPark Logo
const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <div style={{
      width: '32px', height: '32px', borderRadius: '8px',
      background: '#10b981', // Solid emerald/mint for a cleaner look
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ color: '#fff', fontWeight: '800', fontSize: '18px' }}>U</span>
    </div>
    <span style={{
      fontSize: '18px', fontWeight: '700', letterSpacing: '-0.3px', color: '#1a1a1a'
    }}>
      Urban<span style={{ color: '#10b981' }}>Park</span>
    </span>
  </div>
);

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/'); };

  const navLinks = user?.role === 'admin'
    ? [{ to: '/admin', label: 'Dashboard' }, { to: '/admin/bookings', label: 'Bookings' }]
    : [{ to: '/dashboard', label: 'Find Parking' }, { to: '/my-bookings', label: 'My Bookings' }];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(255, 255, 255, 0.8)', // Light semi-transparent white
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #eee', // Very subtle light gray border
      padding: '0 32px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <Link to={user ? '/dashboard' : '/'} style={{ textDecoration: 'none' }}>
        <Logo />
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user && navLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            style={{
              padding: '6px 12px', borderRadius: '6px', textDecoration: 'none',
              fontWeight: '500', fontSize: '14px',
              color: location.pathname.startsWith(link.to) ? '#10b981' : '#666',
              background: location.pathname.startsWith(link.to) ? '#f0fdf4' : 'transparent',
              transition: 'all 0.2s'
            }}
          >
            {link.label}
          </Link>
        ))}

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '12px' }}>
            <span style={{ fontSize: '14px', color: '#444', fontWeight: '500' }}>
              Hi, {user.name?.split(' ')[0]}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: 'none', border: '1px solid #ddd', padding: '6px 12px',
                borderRadius: '6px', fontSize: '13px', cursor: 'pointer', color: '#666'
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <span style={{ color: '#666', fontSize: '14px', fontWeight: '500' }}>Login</span>
            </Link>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <button style={{
                background: '#1a1a1a', color: '#fff', border: 'none',
                padding: '8px 16px', borderRadius: '6px', fontSize: '14px',
                fontWeight: '500', cursor: 'pointer'
              }}>
                Get Started
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}