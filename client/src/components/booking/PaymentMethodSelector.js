import React from 'react';
import { IconCheck } from '../Icons';

export const PAYMENT_OPTIONS = [
  { id: 'free_demo', title: 'Community Free Pass', desc: 'Complimentary pilot access program' },
  { id: 'upi', title: 'UPI Quick Pay', desc: 'Instant verification via BHIM, GPay, PhonePe' },
  { id: 'card', title: 'Corporate / Fleet Card', desc: 'Visa, MasterCard, RuPay' },
  { id: 'netbanking', title: 'Net Banking Gateway', desc: 'Direct bank account transfer' }
];

/**
 * Payment Authorization Method Selector Cards
 */
export default function PaymentMethodSelector({ paymentMethod, setPaymentMethod }) {
  return (
    <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
        Select Payment Authorization
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
        {PAYMENT_OPTIONS.map((opt) => {
          const isSelected = paymentMethod === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => setPaymentMethod(opt.id)}
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                border: `1.5px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                background: isSelected ? '#eff6ff' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: isSelected ? '#2563eb' : '#0f172a' }}>
                  {opt.title}
                </span>
                {isSelected && <IconCheck size={16} color="#2563eb" />}
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{opt.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
