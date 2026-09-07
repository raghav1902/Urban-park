import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IconCar,
  IconMapPin,
  IconClock,
  IconShield,
  IconQrCode,
  IconZap,
  IconBarChart,
  IconCreditCard,
  IconArrowRight,
  IconCheckCircle
} from '../components/Icons';

/**
 * Enterprise Landing Page
 * Completely responsive, 100% white theme, clean typography and zero emojis
 */
export default function Landing() {
  const [occupancyRate, setOccupancyRate] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setOccupancyRate((prev) => (prev < 68 ? prev + 1 : prev));
    }, 25);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <IconMapPin size={24} color="#2563eb" />,
      title: 'Interactive City Mapping',
      desc: 'Browse all municipal and private parking facilities across Jaipur with live slot availability.'
    },
    {
      icon: <IconClock size={24} color="#059669" />,
      title: 'Real-time Slot Reservations',
      desc: 'Reserve your verified parking space in seconds with automated gate check-in QR codes.'
    },
    {
      icon: <IconBarChart size={24} color="#7c3aed" />,
      title: 'Dynamic Demand Optimization',
      desc: 'Transparent automated rates balancing city peak hours with off-peak vehicle incentives.'
    },
    {
      icon: <IconZap size={24} color="#d97706" />,
      title: 'IoT Sensor Telemetry',
      desc: 'Hardware IoT sensor integration broadcasting active occupancy changes every 5 seconds.'
    },
    {
      icon: <IconQrCode size={24} color="#0891b2" />,
      title: 'Contactless Digital Passports',
      desc: 'Instant cryptographic QR passes for seamless boom barrier entry and exit validation.'
    },
    {
      icon: <IconShield size={24} color="#dc2626" />,
      title: 'Secure OTP Authorization',
      desc: 'Passwordless telephone authentication safeguarding user privacy and vehicle credentials.'
    }
  ];

  const metrics = [
    { value: '3', label: 'Prime Jaipur Zones', note: 'Central & Heritage Hubs' },
    { value: '60', label: 'Managed Smart Slots', note: 'Regular, Compact & EV' },
    { value: '100%', label: 'Free Access Mode', note: 'Community Pilot Program' },
    { value: '< 2m', label: 'Average Booking Time', note: 'Instant Slot Confirmation' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingTop: '64px' }}>
      {/* Hero Section */}
      <section
        style={{
          padding: '80px 24px 60px',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          borderBottom: '1px solid #e2e8f0',
          textAlign: 'center'
        }}
      >
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          {/* Status Chip */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              fontSize: '13px',
              fontWeight: '600',
              color: '#1d4ed8',
              marginBottom: '28px'
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#2563eb',
                boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.2)'
              }}
            />
            Intelligent Parking Infrastructure — Jaipur Smart City
          </div>

          <h1
            style={{
              fontSize: 'clamp(36px, 5.5vw, 64px)',
              fontWeight: '800',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: '#0f172a',
              marginBottom: '20px'
            }}
          >
            Predictable Urban Parking <br />
            <span style={{ color: '#2563eb' }}>Engineered for Efficiency</span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 19px)',
              color: '#475569',
              lineHeight: 1.6,
              maxWidth: '640px',
              margin: '0 auto 36px'
            }}
          >
            Eliminate circling and congested streets. Search live parking availability, reserve your slot
            in advance, and enjoy contactless gate check-in across Jaipur.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              flexWrap: 'wrap',
              marginBottom: '50px'
            }}
          >
            <Link to="/login" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px' }}>
              <IconCar size={18} />
              Reserve Parking Slot
              <IconArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '12px 26px', fontSize: '15px' }}>
              <IconMapPin size={18} color="#475569" />
              Explore Jaipur Map
            </Link>
          </div>

          {/* Live Telemetry Card */}
          <div
            className="card"
            style={{
              maxWidth: '560px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              background: '#ffffff'
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                Active City Occupancy
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
                {occupancyRate}%
              </div>
            </div>

            <div style={{ height: '40px', width: '1px', background: '#e2e8f0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#059669', fontWeight: '500' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
                41 Slots Available
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }} />
                19 Slots Occupied / Reserved
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section style={{ padding: '40px 24px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            textAlign: 'center'
          }}
        >
          {metrics.map((item, index) => (
            <div key={index} style={{ padding: '16px' }}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#2563eb', letterSpacing: '-0.02em' }}>
                {item.value}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginTop: '4px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {item.note}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Architectural Features */}
      <section style={{ padding: '80px 24px' }}>
        <div className="container" style={{ maxWidth: '1120px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              System Capabilities
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginTop: '8px' }}>
              Built for High-Throughput City Mobility
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '520px', margin: '12px auto 0' }}>
              Enterprise grade parking automation providing real-time oversight for commuters, operators, and city planners.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px'
            }}
          >
            {features.map((item, index) => (
              <div key={index} className="card" style={{ padding: '28px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px'
                  }}
                >
                  {item.icon}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section
        style={{
          padding: '70px 24px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          borderBottom: '1px solid #e2e8f0',
          textAlign: 'center'
        }}
      >
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '16px' }}>
            Experience Next-Generation Smart Parking
          </h2>
          <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '32px' }}>
            Book your parking spot in under 60 seconds with instant QR code delivery.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ padding: '14px 36px', fontSize: '16px' }}>
            Get Started Now
            <IconArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 24px', background: '#f8fafc', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          © {new Date().getFullYear()} UrbanPark Management Systems. Operational in Jaipur, Rajasthan.
        </p>
      </footer>
    </div>
  );
}
