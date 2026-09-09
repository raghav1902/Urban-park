/**
 * Host Parking Space Registration Form
 * Architecture: Clean Component for Community P2P Parking
 * Adheres strictly to 200-300 lines limit
 */

import React, { useState } from 'react';
import {
  IconHome,
  IconMapPin,
  IconRupee,
  IconShield,
  IconCheck,
  IconCar,
  IconNavigation,
  IconZap,
  IconBuilding,
  IconLayers
} from '../Icons';
import api from '../../utils/api';
import { toast } from 'react-toastify';

export default function HostListingForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    city: 'Jaipur',
    lat: 26.9124,
    lng: 75.7873,
    pricePerHour: 25,
    dailyPrice: 180,
    totalSlots: 1,
    spotType: 'driveway',
    description: '',
    phone: '',
    upiId: '',
    amenities: ['24/7 Gated Access', 'CCTV Monitored']
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const spotTypes = [
    { id: 'driveway', label: 'Private Driveway', renderIcon: (props) => <IconHome {...props} /> },
    { id: 'covered_garage', label: 'Covered Garage', renderIcon: (props) => <IconCar {...props} /> },
    { id: 'gated_society', label: 'Gated Society Spot', renderIcon: (props) => <IconBuilding {...props} /> },
    { id: 'open_lot', label: 'Private Open Lot', renderIcon: (props) => <IconLayers {...props} /> }
  ];

  const availableAmenities = [
    'CCTV Monitored',
    '24/7 Gated Access',
    'Security Guard',
    'Covered Shed',
    'EV Charging Socket (16A)',
    'Well Lit at Night'
  ];

  const toggleAmenity = (item) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(item)
        ? prev.amenities.filter((a) => a !== item)
        : [...prev.amenities, item]
    }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported on this device');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5))
        }));
        toast.success('Exact coordinates captured from your current GPS!', { toastId: 'host-gps-captured' });
        setIsDetectingLocation(false);
      },
      () => {
        toast.warn('Location permission denied; default Jaipur coordinates used.', { toastId: 'host-loc-denied' });
        setIsDetectingLocation(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location || !formData.pricePerHour) {
      toast.error('Please complete all required fields.', { toastId: 'host-missing-fields' });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/parking/community/list', formData);
      toast.success(res.data.message || 'Private space listed successfully!', { toastId: 'host-listed-success' });
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to list space.', { toastId: 'host-listed-error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: '#ffffff',
      borderRadius: '20px',
      border: '1px solid #e2e8f0',
      padding: '28px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
    }}>
      <div style={{ marginBottom: '22px' }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
          List Your Private Space
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#64748b' }}>
          Turn your vacant driveway or garage into passive income with UrbanPark Community
        </p>
      </div>

      {/* Space Title */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
          Listing Name / Title *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Spacious Secure Driveway near C-Scheme"
          style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
        />
      </div>

      {/* Spot Type Selection */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
          Space Type
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
          {spotTypes.map((type) => {
            const isSelected = formData.spotType === type.id;
            return (
              <button
                type="button"
                key={type.id}
                onClick={() => setFormData({ ...formData, spotType: type.id })}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  background: isSelected ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: isSelected ? '#1d4ed8' : '#334155'
                }}
              >
                <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'center' }}>
                  {type.renderIcon({ size: 20, color: isSelected ? '#2563eb' : '#64748b' })}
                </div>
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Address & GPS Detection */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
            Complete Address & Landmark *
          </label>
          <button
            type="button"
            onClick={detectLocation}
            disabled={isDetectingLocation}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <IconNavigation size={13} />
            {isDetectingLocation ? 'Capturing GPS...' : 'Use My GPS'}
          </button>
        </div>
        <input
          type="text"
          required
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="House/Plot No., Street, Landmark, Area (e.g. B-12, Subhash Marg, C-Scheme)"
          style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
        />
      </div>

      {/* Pricing & Slots */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            Price per Hour (₹) *
          </label>
          <input
            type="number"
            min="10"
            max="300"
            value={formData.pricePerHour}
            onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            Daily Pass (₹)
          </label>
          <input
            type="number"
            min="50"
            value={formData.dailyPrice}
            onChange={(e) => setFormData({ ...formData, dailyPrice: e.target.value })}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            Number of Spots
          </label>
          <select
            value={formData.totalSlots}
            onChange={(e) => setFormData({ ...formData, totalSlots: e.target.value })}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? 'Spot' : 'Spots'}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Amenities Checkboxes */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
          Security & Amenities
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {availableAmenities.map((amenity) => {
            const isChecked = formData.amenities.includes(amenity);
            return (
              <button
                type="button"
                key={amenity}
                onClick={() => toggleAmenity(amenity)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '20px',
                  border: isChecked ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  background: isChecked ? '#eff6ff' : '#f8fafc',
                  color: isChecked ? '#1d4ed8' : '#475569',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {isChecked && <IconCheck size={12} />}
                {amenity}
              </button>
            );
          })}
        </div>
      </div>

      {/* Payout UPI ID */}
      <div style={{ marginBottom: '22px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
          Host Payout UPI ID (for instant earnings transfer)
        </label>
        <input
          type="text"
          value={formData.upiId}
          onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
          placeholder="yourname@okhdfcbank or yourphone@paytm"
          style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '12px',
          padding: '14px',
          fontSize: '15px',
          fontWeight: '700',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
        }}
      >
        {isSubmitting ? 'Registering Your Space...' : 'Publish Community Listing →'}
      </button>
    </form>
  );
}
