import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  IconCar,
  IconPhone,
  IconShield,
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
  IconUser,
  IconAlert
} from '../components/Icons';

/**
 * Enterprise Authentication Page
 * Pure professional white theme, responsive design, no emojis, clean OTP UX
 */
export default function Login() {
  const [step, setStep] = useState('phone'); // phone | otp | name
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.trim();

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      toast.error('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOTP(cleanPhone);
      if (res.demoOtp) {
        setDemoOtp(res.demoOtp);
      }
      toast.success('Authentication code dispatched.');
      setStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();

    if (cleanOtp.length !== 6) {
      toast.error('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOTP(phone.trim(), cleanOtp, name.trim());
      toast.success(`Authenticated successfully as ${res.user.name || 'User'}`);
      navigate(res.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };


  const handleSetName = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your full legal name.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOTP(phone.trim(), otp.trim(), name.trim());
      toast.success(`Welcome to UrbanPark, ${res.user.name}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete profile registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        paddingTop: '80px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          margin: '0 auto'
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#2563eb',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              marginBottom: '16px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}
          >
            <IconCar size={26} color="#ffffff" />
          </div>

          <h1
            style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#0f172a',
              letterSpacing: '-0.02em',
              marginBottom: '8px'
            }}
          >
            {step === 'phone' && 'Sign in to UrbanPark'}
            {step === 'otp' && 'Verify Phone Number'}
            {step === 'name' && 'Complete Profile'}
          </h1>

          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>
            {step === 'phone' && 'Access smart parking booking and live slot status.'}
            {step === 'otp' && `Enter the 6-digit passcode sent to +91 ${phone}`}
            {step === 'name' && 'Please provide your name for parking verification.'}
          </p>
        </div>

        {/* Authentication Card */}
        <div className="card" style={{ padding: '32px', background: '#ffffff' }}>
          {step === 'phone' && (
            <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="input-label" htmlFor="phone-input">
                  Mobile Phone Number
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div
                    style={{
                      padding: '10px 14px',
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    +91
                  </div>
                  <input
                    id="phone-input"
                    className="input"
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="98765 43210"
                    autoFocus
                  />
                </div>
                <span style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                  Standard Indian 10-digit mobile number
                </span>
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading || phone.length < 10}
                style={{ width: '100%', padding: '12px', fontSize: '15px' }}
              >
                {loading ? 'Transmitting Code...' : 'Send Verification Code'}
                <IconArrowRight size={16} />
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {demoOtp && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1e40af',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontWeight: '500' }}>Testing Passcode:</span>
                  <span className="mono" style={{ fontWeight: '700', fontSize: '15px' }}>
                    {demoOtp}
                  </span>
                </div>
              )}

              <div>
                <label className="input-label" htmlFor="otp-input" style={{ textAlign: 'center' }}>
                  Enter 6-Digit Passcode
                </label>
                <input
                  id="otp-input"
                  className="input mono"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  style={{
                    fontSize: '24px',
                    letterSpacing: '10px',
                    textAlign: 'center',
                    padding: '14px 10px'
                  }}
                />
              </div>

              <div>
                <label className="input-label" htmlFor="name-input" style={{ fontSize: '12px' }}>
                  Full Name (Optional for new users)
                </label>
                <input
                  id="name-input"
                  className="input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Raghav Sharma"
                  style={{ fontSize: '14px', padding: '10px 14px' }}
                />
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading || otp.length !== 6}
                style={{ width: '100%', padding: '12px', fontSize: '15px' }}
              >
                {loading ? 'Verifying Code...' : 'Verify & Continue'}
                <IconCheck size={16} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                }}
                className="btn btn-ghost"
                style={{ width: '100%', fontSize: '13px' }}
              >
                <IconArrowLeft size={14} />
                Modify Mobile Number
              </button>
            </form>
          )}

          {step === 'name' && (
            <form onSubmit={handleSetName} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="input-label" htmlFor="name-input">
                  Full Name
                </label>
                <input
                  id="name-input"
                  className="input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Raghav Sharma"
                  autoFocus
                />
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading || !name.trim()}
                style={{ width: '100%', padding: '12px', fontSize: '15px' }}
              >
                {loading ? 'Completing Registration...' : 'Complete Profile'}
                <IconArrowRight size={16} />
              </button>
            </form>
          )}
        </div>

        {/* Security Assurance Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '24px',
            color: '#64748b',
            fontSize: '13px'
          }}
        >
          <IconShield size={16} color="#059669" />
          <span>Encrypted cryptographic session authentication</span>
        </div>
      </div>
    </div>
  );
}