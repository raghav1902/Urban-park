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
  IconBarChart,
  IconZap,
  IconHome,
  IconCompass,
  IconBatteryCharging
} from './Icons';
import FindMyCarModal from './parking/FindMyCarModal';
import EvChargeCalculatorModal from './stations/EvChargeCalculatorModal';
import MobileNavDrawer from './navbar/MobileNavDrawer';

/**
 * Enterprise Navbar Component
 * Fully responsive with Lucide icons, P2P Rent Space, Find My Car & EV Calculator
 */
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [isEvCalcOpen, setIsEvCalcOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const navLinks = user?.role === 'admin'
    ? [
        { to: '/admin', label: 'Admin Overview', icon: <IconBarChart size={16} /> },
        { to: '/admin/bookings', label: 'Global Bookings', icon: <IconCalendar size={16} /> },
        { to: '/ev-stations', label: 'Fuel & EV Stations', icon: <IconZap size={16} /> },
        { to: '/rent-space', label: 'Rent Space (P2P)', icon: <IconHome size={16} /> }
      ]
    : [
        { to: '/dashboard', label: 'Parking Zones', icon: <IconBuilding size={16} /> },
        { to: '/ev-stations', label: 'Fuel & EV Stations', icon: <IconZap size={16} /> },
        { to: '/rent-space', label: 'Rent Space (P2P)', icon: <IconHome size={16} /> },
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
                gap: '10px',
                marginLeft: '12px',
                paddingLeft: '14px',
                borderLeft: '1px solid #e2e8f0'
              }}
            >
              <button
                onClick={() => setIsCarModalOpen(true)}
                title="Find My Parked Car"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: '#1e293b',
                  cursor: 'pointer'
                }}
              >
                <IconCompass size={15} color="#2563eb" />
                Find Car
              </button>

              <button
                onClick={() => setIsEvCalcOpen(true)}
                title="EV Battery & Charging Calculator"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: '#065f46',
                  cursor: 'pointer'
                }}
              >
                <IconBatteryCharging size={15} color="#10b981" />
                EV Calc
              </button>

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
      <MobileNavDrawer
        isOpen={mobileMenuOpen}
        onClose={closeMobile}
        user={user}
        navLinks={navLinks}
        onLogout={handleLogout}
        onOpenFindCar={() => setIsCarModalOpen(true)}
        onOpenEvCalc={() => setIsEvCalcOpen(true)}
      />

      {/* Quick Access Feature Modals */}
      <FindMyCarModal
        isOpen={isCarModalOpen}
        onClose={() => setIsCarModalOpen(false)}
      />

      <EvChargeCalculatorModal
        isOpen={isEvCalcOpen}
        onClose={() => setIsEvCalcOpen(false)}
      />

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