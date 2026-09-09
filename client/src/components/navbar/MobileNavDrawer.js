/**
 * Mobile Navigation Drawer Component
 * Architecture: Modular Navbar sub-component
 * Adheres strictly to 200-300 lines limit (compact clean component)
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  IconLogOut,
  IconCompass,
  IconBatteryCharging
} from '../Icons';

export default function MobileNavDrawer({
  isOpen,
  onClose,
  user,
  navLinks,
  onLogout,
  onOpenFindCar,
  onOpenEvCalc
}) {
  const location = useLocation();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '64px',
        left: 0,
        right: 0,
        bottom: 0,
        background: '#ffffff',
        zIndex: 999,
        padding: '20px 24px',
        borderTop: '1px solid #e2e8f0',
        overflowY: 'auto',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {user &&
          navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: isActive ? '#2563eb' : '#334155',
                  background: isActive ? '#eff6ff' : 'transparent'
                }}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}

        {user && (
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => {
                onClose();
                onOpenFindCar();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: '#f1f5f9',
                border: 'none',
                fontWeight: '600',
                fontSize: '14px',
                color: '#1e293b',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <IconCompass size={18} color="#2563eb" />
              Find My Parked Car (Radar)
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenEvCalc();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: '#ecfdf5',
                border: 'none',
                fontWeight: '600',
                fontSize: '14px',
                color: '#065f46',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <IconBatteryCharging size={18} color="#10b981" />
              EV Battery & Charging Calculator
            </button>
          </div>
        )}

        {user ? (
          <button
            onClick={onLogout}
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <IconLogOut size={16} />
            Sign Out
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <Link
              to="/login"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ width: '100%', textAlign: 'center' }}
            >
              Sign In
            </Link>
            <Link
              to="/login"
              onClick={onClose}
              className="btn btn-primary"
              style={{ width: '100%', textAlign: 'center' }}
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
