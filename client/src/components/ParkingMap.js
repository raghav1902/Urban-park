import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix leaflet default icon assets
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
});

const blueMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

/**
 * Enterprise Map Component for Jaipur Parking Facilities
 * Pure white theme, responsive tile viewport
 */
export default function ParkingMap({ lots = [], getLotOccupancy }) {
  const defaultCenter = [26.9124, 75.7873]; // Jaipur central coordinates

  return (
    <div style={{ height: '520px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        {lots.map((lot) => {
          const occ = getLotOccupancy ? getLotOccupancy(lot) : { available: lot.availableSlots || 0 };
          return (
            <Marker
              key={lot._id}
              position={[lot.coordinates.lat, lot.coordinates.lng]}
              icon={blueMarkerIcon}
            >
              <Popup>
                <div style={{ padding: '4px', minWidth: '170px' }}>
                  <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>
                    {lot.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 8px' }}>
                    {lot.location}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#059669', fontWeight: '600' }}>
                      Available: {occ.available}
                    </span>
                    <span style={{ fontWeight: '700', color: '#2563eb' }}>
                      ₹{lot.pricePerHour}/hr
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
