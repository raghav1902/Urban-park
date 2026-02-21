import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

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
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error('Enter a valid 10-digit Indian mobile number');
      return;
    }
    setLoading(true);
    try {
      const res = await sendOTP(phone);
      if (res.demoOtp) setDemoOtp(res.demoOtp);
      toast.success('OTP sent successfully!');
      setStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    setLoading(true);
    try {
      const res = await verifyOTP(phone, otp);
      if (res.requireName) { setStep('name'); setLoading(false); return; }
      toast.success(`Welcome${res.user.name ? ', ' + res.user.name.split(' ')[0] : ''}!`);
      navigate(res.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSetName = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Enter your name'); return; }
    setLoading(true);
    try {
      const res = await verifyOTP(phone, otp, name.trim());
      toast.success(`Welcome, ${res.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--navy)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden'
    }} className="grid-bg">
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%', maxWidth: 440, position: 'relative', zIndex: 1,
        animation: 'fadeInUp 0.5s ease'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '16px',
            background: '#10b981',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', fontWeight: '900', color: '#fff', marginBottom: '16px'
          }}>U</div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff' }}>
            Welcome to <span style={{ color: 'var(--green)' }}>UrbanPark</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '15px' }}>
            {step === 'phone' && 'Welcome Dear Customer! Enter your mobile number to continue'}
            {step === 'otp' && `Enter the OTP sent to +91 ${phone}`}
            {step === 'name' && "You're new here! What's your name?"}
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '36px' }}>
          {step === 'phone' && (
            <form onSubmit={handleSendOTP}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Mobile Number
              </label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                <div style={{
                  padding: '12px 16px', background: 'var(--navy-light)',
                  border: '1px solid var(--navy-border)', borderRadius: '10px',
                  fontSize: '15px', color: 'var(--text-dim)', fontWeight: '600', whiteSpace: 'nowrap'
                }}>🇮🇳 +91</div>
                <input
                  className="input" type="tel" maxLength={10} value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210" autoFocus
                />
              </div>
              <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? '⏳ Sending...' : 'Send OTP →'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP}>
              {demoOtp && (
                <div style={{
                  padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
                  background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: 'var(--amber)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  🔧 <strong>Dev Mode OTP:</strong>&nbsp;
                  <span className="mono" style={{ fontSize: '16px', fontWeight: '700' }}>{demoOtp}</span>
                </div>
              )}
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Enter 6-Digit OTP
              </label>
              <input
                className="input mono" type="text" maxLength={6} value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••" autoFocus
                style={{ fontSize: '24px', letterSpacing: '8px', textAlign: 'center', marginBottom: '24px' }}
              />
              <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? '⏳ Verifying...' : 'Verify OTP ✓'}
              </button>
              <button type="button" onClick={() => { setStep('phone'); setOtp(''); }}
                style={{ width: '100%', marginTop: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}>
                ← Change Number
              </button>
            </form>
          )}

          {step === 'name' && (
            <form onSubmit={handleSetName}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Your Full Name
              </label>
              <input
                className="input" type="text" value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma" autoFocus
                style={{ marginBottom: '24px' }}
              />
              <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? '⏳ Setting up...' : 'Complete Setup →'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
          🔒 Secure OTP authentication. No password needed.
        </p>
      </div>
    </div>
  );
}