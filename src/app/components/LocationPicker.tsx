'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet with Webpack/Next.js
// @ts-expect-error Fix for default marker icon in Leaflet with Webpack/Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type LocationPickerProps = {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number | null;
  initialLng?: number | null;
};

// Internal component to handle map flyTo effects and clicks
function MapController({ 
  onLocationSelect, 
  position, 
  setPosition 
}: { 
  onLocationSelect: (lat: number, lng: number) => void, 
  position: L.LatLng | null, 
  setPosition: (pos: L.LatLng) => void 
}) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
    locationfound(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, 15);
    },
  });

  useEffect(() => {
    // Only auto-locate if no initial position was provided
    if (!position) {
      map.locate();
    } else {
      map.flyTo(position, 16);
    }
  }, [map, position]);

  return position === null ? null : (
    <Marker position={position} />
  );
}

export default function LocationPicker({ onLocationSelect, initialLat, initialLng }: LocationPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    initialLat && initialLng ? new L.LatLng(initialLat, initialLng) : null
  );

  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition(new L.LatLng(initialLat, initialLng));
    }
  }, [initialLat, initialLng]);

  // Default center (Fallback: Mexico City)
  const defaultCenter = [19.4326, -99.1332] as L.LatLngExpression;
  const mapCenter = initialLat && initialLng ? [initialLat, initialLng] as L.LatLngExpression : defaultCenter;

  return (
    <MapContainer 
      center={mapCenter} 
      zoom={13} 
      scrollWheelZoom={false} 
      style={{ height: '300px', width: '100%', borderRadius: '0.5rem', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <MapController onLocationSelect={onLocationSelect} position={position} setPosition={setPosition} />
    </MapContainer>
  );
}
