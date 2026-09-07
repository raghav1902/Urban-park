import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconCar,
  IconUser,
  IconLogOut,
  IconMenu,
  IconClose,
  IconBuilding,
  IconCalendar,
  IconBarChart
} from './Icons';

/**
 * Enterprise Navbar Component
 * Fully responsive with mobile drawer, zero emojis, and executive white palette
 */
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const navLinks = user?.role === 'admin'
    ? [
        { to: '/admin', label: 'Admin Overview', icon: <IconBarChart size={16} /> },
        { to: '/admin/bookings', label: 'Global Bookings', icon: <IconCalendar size={16} /> }
      ]
    : [
        { to: '/dashboard', label: 'Parking Zones', icon: <IconBuilding size={16} /> },
        { to: '/my-bookings', label: 'My Reservations', icon: <IconCalendar size={16} /> }
      ];

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #e2e8f0',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px'
        }}
      >
        {/* Brand Logo */}
        <Link
          to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/'}
          onClick={closeMobile}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none'
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
            }}
          >
            <IconCar size={20} color="#ffffff" />
          </div>
          <div>
            <span
              style={{
                fontSize: '18px',
                fontWeight: '700',
                letterSpacing: '-0.02em',
                color: '#0f172a'
              }}
            >
              Urban<span style={{ color: '#2563eb' }}>Park</span>
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '10px',
                fontWeight: '600',
                color: '#64748b',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginTop: '-3px'
              }}
            >
              Smart Parking
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          className="desktop-nav"
        >
          {user &&
            navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: isActive ? '600' : '500',
                    color: isActive ? '#2563eb' : '#475569',
                    background: isActive ? '#eff6ff' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}

          {user ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginLeft: '12px',
                paddingLeft: '14px',
                borderLeft: '1px solid #e2e8f0'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f8fafc',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <IconUser size={15} color="#2563eb" />
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#0f172a'
                  }}
                >
                  {user.name?.split(' ')[0]}
                </span>
                {user.role === 'admin' && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      background: '#dbeafe',
                      color: '#1e40af',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    Admin
                  </span>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '13px' }}
              >
                <IconLogOut size={15} />
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link to="/login" className="btn btn-ghost">
                Sign In
              </Link>
              <Link to="/login" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-toggle"
          aria-label="Toggle navigation menu"
          style={{
            display: 'none',
            background: 'none',
            border: '1px solid #e2e8f0',
            padding: '8px',
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#0f172a'
          }}
        >
          {mobileMenuOpen ? <IconClose size={20} /> : <IconMenu size={20} />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '64px',
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 999
          }}
          onClick={closeMobile}
        >
          <div
            style={{
              background: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {user && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  paddingBottom: '14px',
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <IconUser size={18} color="#2563eb" />
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: '#0f172a' }}>{user.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{user.phone}</div>
                </div>
              </div>
            )}

            {user &&
              navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMobile}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '500',
                    color: location.pathname === link.to ? '#2563eb' : '#334155',
                    background: location.pathname === link.to ? '#eff6ff' : 'transparent'
                  }}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}

            {user ? (
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '8px' }}
              >
                <IconLogOut size={16} />
                Sign Out
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link
                  to="/login"
                  onClick={closeMobile}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  onClick={closeMobile}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Style for mobile nav responsive display */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
      `}</style>
    </>
  );
}