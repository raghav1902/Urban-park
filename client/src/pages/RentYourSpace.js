/**
 * Community P2P Parking: Rent Your Space ("Airbnb for Parking")
 * Architecture: Clean Full-Page Container with Responsive Layout
 * Adheres strictly to 200-300 lines limit
 */

import React, { useState } from 'react';
import HostListingForm from '../components/community/HostListingForm';
import HostDashboardView from '../components/community/HostDashboardView';
import {
  IconHome,
  IconPlusCircle,
  IconBarChart,
  IconShield,
  IconRupee,
  IconCheckCircle
} from '../components/Icons';

export default function RentYourSpace() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      paddingBottom: '60px'
    }}>
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        padding: '48px 24px 36px',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(37, 99, 235, 0.25)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '20px',
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#93c5fd',
            marginBottom: '14px'
          }}>
            <IconHome size={14} />
            COMMUNITY PEER-TO-PEER MOBILITY
          </div>

          <h1 style={{
            fontSize: '32px',
            fontWeight: '900',
            letterSpacing: '-0.5px',
            margin: '0 0 10px'
          }}>
            Rent Your Space • Earn Passive Income
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#94a3b8',
            maxWidth: '650px',
            margin: '0 0 24px',
            lineHeight: '1.5'
          }}>
            List your empty driveway, covered garage, or society parking space in Jaipur. Drivers reserve securely with verified QR codes while you receive automatic instant payouts.
          </p>

          {/* Quick Value Pillars */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            maxWidth: '850px'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <IconShield size={20} color="#38bdf8" />
              <div style={{ fontSize: '12.5px', color: '#f1f5f9' }}>
                <strong>Verified Drivers</strong> with vehicle plate check
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <IconRupee size={20} color="#4ade80" />
              <div style={{ fontSize: '12.5px', color: '#f1f5f9' }}>
                <strong>Instant UPI Payouts</strong> straight to bank
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <IconCheckCircle size={20} color="#fbbf24" />
              <div style={{ fontSize: '12.5px', color: '#f1f5f9' }}>
                <strong>Total Control:</strong> Pause or resume anytime
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px 0' }}>
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          background: '#ffffff',
          borderRadius: '14px',
          padding: '6px',
          marginBottom: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          width: 'fit-content'
        }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'dashboard' ? '#2563eb' : 'transparent',
              color: activeTab === 'dashboard' ? '#ffffff' : '#64748b',
              fontWeight: '700',
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: activeTab === 'dashboard' ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <IconBarChart size={16} />
            Host Dashboard
          </button>

          <button
            onClick={() => setActiveTab('list')}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'list' ? '#2563eb' : 'transparent',
              color: activeTab === 'list' ? '#ffffff' : '#64748b',
              fontWeight: '700',
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: activeTab === 'list' ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <IconPlusCircle size={16} />
            + List a Space
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'dashboard' ? (
          <HostDashboardView onAddNewSpace={() => setActiveTab('list')} />
        ) : (
          <div style={{ maxWidth: '680px' }}>
            <HostListingForm onSuccess={() => setActiveTab('dashboard')} />
          </div>
        )}
      </div>
    </div>
  );
}
