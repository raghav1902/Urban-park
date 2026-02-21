import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api'; // Use existing api instance

const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

const SlotLockTimer = ({ slotId, initialTimeLeft, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (timeLeft <= 0) {
            setIsExpired(true);
            if (onExpire) onExpire();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsExpired(true);
                    if (onExpire) onExpire();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onExpire]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    if (isExpired) {
        return (
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.3)', borderRadius: '12px', marginBottom: '20px' }}>
                <div style={{ color: '#ff3b30', fontWeight: '700', marginBottom: '8px' }}>Slot Lock Expired</div>
                <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '0' }}>Please go back and select a slot again.</p>
            </div>
        );
    }

    const isWarning = timeLeft <= 60;

    return (
        <div style={{
            padding: '16px',
            background: 'var(--navy-light)',
            border: `1px solid ${isWarning ? 'rgba(255, 59, 48, 0.5)' : 'var(--navy-border)'}`,
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    Time Remaining
                </div>
                <div style={{ color: isWarning ? '#ff3b30' : 'var(--text)', fontSize: '14px' }}>
                    {isWarning && <span style={{ marginRight: '8px' }}>⚠️ Hurry!</span>}
                    Complete payment before timer ends.
                </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'JetBrains Mono', color: isWarning ? '#ff3b30' : 'var(--green)' }}>
                {formatTime(timeLeft)}
            </div>
        </div>
    );
};

export { SlotLockTimer };
