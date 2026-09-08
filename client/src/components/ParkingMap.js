import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

const redMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

// Component to handle dynamic recentering of Leaflet map
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && center[0] && center[1]) {
      map.setView(center, 13, { animate: true });
    }
  }, [center, map]);
  return null;
}

/**
 * Enterprise Map Component for Parking Facilities
 * Pure white theme, responsive tile viewport
 */
export default function ParkingMap({ lots = [], getLotOccupancy, userCoords }) {
  const mapCenter = userCoords?.lat && userCoords?.lng
    ? [userCoords.lat, userCoords.lng]
    : [26.9124, 75.7873];

  return (
    <div className="parking-map-wrapper">
      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <MapRecenter center={mapCenter} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* User Current Location Marker */}
        {userCoords?.lat && userCoords?.lng && (
          <Marker position={[userCoords.lat, userCoords.lng]} icon={redMarkerIcon}>
            <Popup>
              <div style={{ padding: '4px', fontWeight: '700', color: '#dc2626', fontSize: '13px' }}>
                📍 Your Location / Search Center
              </div>
            </Popup>
          </Marker>
        )}

        {/* Parking Lots Markers */}
        {lots.map((lot) => {
          const occ = getLotOccupancy ? getLotOccupancy(lot) : { available: lot.availableSlots || 0 };
          return (
            <Marker
              key={lot._id || lot.id}
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
      <style>{`
        .parking-map-wrapper {
          height: 520px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        @media (max-width: 768px) {
          .parking-map-wrapper {
            height: 360px;
          }
        }
      `}</style>
    </div>
  );
}

