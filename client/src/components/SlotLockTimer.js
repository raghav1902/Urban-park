import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api'; // Use existing api instance

const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

const SlotLockTimer = ({ slotId, lockStartTime }) => {
    const [remainingTime, setRemainingTime] = useState(0);
    const [isExpired, setIsExpired] = useState(false);
    const [isWarning, setIsWarning] = useState(false);

    // Ref to prevent multiple backend API calls for lock release during unmounts or Strict Mode
    const hasReleasedRef = useRef(false);

    useEffect(() => {
        if (!lockStartTime) return;

        // Helper to calculate the exact remaining time using timestamps
        const calculateTimeRemaining = () => {
            const startTimeMs = new Date(lockStartTime).getTime();
            const currentTimeMs = new Date().getTime();
            const elapsedTimeMs = currentTimeMs - startTimeMs;
            const timeLeftMs = LOCK_DURATION_MS - elapsedTimeMs;

            return timeLeftMs > 0 ? timeLeftMs : 0;
        };

        // 1. Check initial state on load (Edge case: if lock already expired when page loaded)
        const initialTimeLeft = calculateTimeRemaining();
        setRemainingTime(initialTimeLeft);

        if (initialTimeLeft <= 0) {
            handleExpire();
            return;
        }

        // 2. Start the interval to update UI
        const intervalId = setInterval(() => {
            const timeLeft = calculateTimeRemaining();
            setRemainingTime(timeLeft);

            // Trigger warning state at <= 60 seconds
            if (timeLeft <= 60000 && timeLeft > 0) {
                setIsWarning(true);
            }

            // Trigger expiration state
            if (timeLeft <= 0) {
                clearInterval(intervalId); // Stop interval cleanly
                handleExpire();
            }
        }, 1000);

        // 3. Clear interval securely on component unmount
        return () => clearInterval(intervalId);
    }, [lockStartTime, slotId]);

    const handleExpire = async () => {
        setIsExpired(true);
        setRemainingTime(0);
        setIsWarning(false);

        // Only call the release API exactly once
        if (!hasReleasedRef.current) {
            hasReleasedRef.current = true;
            try {
                // Automatically call API: POST /release-lock
                await api.post('/parking/release-lock', { slotId });
            } catch (error) {
                console.error('Failed to release slot lock:', error);
            }
        }
    };

    // Format milliseconds to MM:SS format
    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    if (isExpired) {
        return (
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.3)', borderRadius: '12px', marginBottom: '20px' }}>
                <div style={{ color: 'var(--text)', fontWeight: '700', marginBottom: '8px' }}>Slot Lock Expired</div>
                <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '0' }}>Please go back and select a slot again.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '16px', background: 'var(--navy-light)', border: `1px solid ${isWarning ? 'rgba(255, 59, 48, 0.5)' : 'var(--navy-border)'}`, borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                {formatTime(remainingTime)}
            </div>
        </div>
    );
};

export { SlotLockTimer };
