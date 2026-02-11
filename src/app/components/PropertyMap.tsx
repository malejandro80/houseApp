import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { Layers } from 'lucide-react';

// Fix for default marker icon in Leaflet
const icon = L.icon({
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png', // We might need to ensure these assets exist or use CDN
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Using CDN for icons to avoid asset issues for now, similar to LocationPicker
// @ts-expect-error Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface PropertyMapProps {
  lat: number;
  lng: number;
  title?: string;
  radius?: number; // Radius in meters
}

export default function PropertyMap({ lat, lng, title, radius }: PropertyMapProps) {
  
  if (!lat || !lng) return null;

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-sm border border-gray-100 z-0 relative group">
      <MapContainer 
        center={[lat, lng]} 
        zoom={14} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
        dragging={true} 
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          {title && <Popup>{title}</Popup>}
        </Marker>
        
        {radius && radius > 0 && (
            <Circle 
                center={[lat, lng]} 
                radius={radius} // radius in meters
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }} 
            />
        )}
      </MapContainer>

      <a 
        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 bg-white px-3 py-1 text-xs font-bold text-gray-600 rounded shadow hover:bg-gray-50 z-[1000]"
      >
        Ver en Google Maps
      </a>
    </div>
  );
}
