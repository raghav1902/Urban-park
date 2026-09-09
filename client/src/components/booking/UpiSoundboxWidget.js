/**
 * UPI Smart Soundbox Audio Simulation Component
 * Architecture: Web Audio API & Speech Synthesis Synthesizer
 * 100% Reliable without external audio file dependencies
 * Adheres strictly to 200-300 lines limit
 */

import React, { useState, useEffect } from 'react';
import {
  IconVolume2,
  IconVolumeX,
  IconSparkles,
  IconRupee,
  IconRefresh
} from '../Icons';

export default function UpiSoundboxWidget({
  amount = 50,
  slotNumber = 'Bay #07',
  paymentId = 'PAY-882199',
  autoPlay = false
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAnnounced, setHasAnnounced] = useState(false);

  // Synthesize pleasant banking chime using Web Audio API
  const playChimeTone = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const tones = [587.33, 880, 1174.66]; // D5, A5, D6 harmonic chord
      tones.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.01, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.45);
      });
    } catch (err) {
      console.warn('AudioContext chime not supported or muted');
    }
  };

  // Speak voice confirmation
  const triggerVoiceAnnouncement = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    playChimeTone();

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Clear any pending speech
      const text = `UrbanPark Soundbox: Received rupees ${amount} for slot ${slotNumber}. Payment successful.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      utterance.onend = () => {
        setIsPlaying(false);
        setHasAnnounced(true);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
      };

      // Slight delay after pleasant musical chime
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 450);
    } else {
      setTimeout(() => setIsPlaying(false), 1200);
    }
  };

  useEffect(() => {
    if (autoPlay && !hasAnnounced) {
      const timer = setTimeout(() => {
        triggerVoiceAnnouncement();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, hasAnnounced]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
      borderRadius: '16px',
      padding: '18px 20px',
      color: '#ffffff',
      border: '1px solid rgba(129, 140, 248, 0.3)',
      boxShadow: '0 10px 25px -5px rgba(30, 27, 75, 0.4)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Visual glowing sound wave pulses */}
      {isPlaying && (
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '24px',
          transform: 'translateY(-50%)',
          display: 'flex',
          gap: '4px',
          alignItems: 'center'
        }}>
          {[16, 28, 40, 24, 32, 18].map((height, i) => (
            <div
              key={i}
              style={{
                width: '4px',
                height: `${height}px`,
                background: '#38bdf8',
                borderRadius: '2px',
                animation: `pulse 0.6s infinite alternate ${i * 0.1}s`,
                boxShadow: '0 0 8px #38bdf8'
              }}
            />
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Soundbox Speaker Icon */}
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: isPlaying
              ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
              : 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isPlaying ? '0 0 15px rgba(56, 189, 248, 0.5)' : 'none',
            transition: 'all 0.3s ease'
          }}>
            <IconVolume2 size={24} color={isPlaying ? '#ffffff' : '#38bdf8'} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '0.3px', color: '#f8fafc' }}>
                UrbanPark UPI Soundbox
              </span>
              <span style={{
                background: isPlaying ? '#22c55e' : 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: '800',
                padding: '2px 6px',
                borderRadius: '6px',
                textTransform: 'uppercase'
              }}>
                {isPlaying ? 'Speaking' : 'Ready'}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
              Confirmed ₹<strong style={{ color: '#38bdf8' }}>{amount}</strong> via Instant UPI
            </div>
          </div>
        </div>

        {/* Play / Replay Button */}
        <button
          onClick={triggerVoiceAnnouncement}
          disabled={isPlaying}
          style={{
            background: isPlaying
              ? 'rgba(255, 255, 255, 0.1)'
              : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: isPlaying ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: isPlaying ? 'none' : '0 2px 8px rgba(2, 132, 199, 0.4)'
          }}
        >
          <IconRefresh size={14} />
          {isPlaying ? 'Playing...' : 'Play Announcement'}
        </button>
      </div>
    </div>
  );
}
