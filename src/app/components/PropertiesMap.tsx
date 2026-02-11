'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Building2, TrendingUp, MapPin } from 'lucide-react';
import { calculateProfitabilityForList, getHealthLabel } from '@/lib/financial-utils';

type Property = {
  id: number;
  title?: string | null;
  type: string;
  address: string;
  lat: number;
  lon: number;
  sale_price: number;
  rent_price: number;
};

type PropertiesMapProps = {
  properties: Property[];
};

// Custom Marker Function
const createCustomMarker = (color: string) => {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 drop-shadow-md filter">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3" fill="white"></circle>
  </svg>`;
  
  return L.divIcon({
    className: 'custom-marker',
    html: svg,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

export default function PropertiesMap({ properties }: PropertiesMapProps) {
  // Center: Mexico City default or first property
  const defaultCenter: [number, number] = properties.length > 0
    ? [properties[0].lat, properties[0].lon]
    : [19.4326, -99.1332];

  return (
    <div className="h-full w-full rounded-lg overflow-hidden relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {properties.map((property) => {
          const { netReturn, health } = calculateProfitabilityForList(property.sale_price, property.rent_price);
          const healthStyle = getHealthLabel(health);
          
          // Determine marker color hex code manually for SVG fill
          let markerColor = '#ef4444'; // Red default
          if (health === 'safe') markerColor = '#16a34a'; // Green-600
          else if (health === 'average') markerColor = '#ca8a04'; // Yellow-600

          return (
            <Marker 
              key={property.id} 
              position={[property.lat, property.lon]}
              icon={createCustomMarker(markerColor)}
            >
              <Popup className="custom-popup" closeButton={false}>
                <div className="p-3 min-w-[200px] max-w-[250px] font-sans">
                  {/* Header: Title & Type */}
                  <div className="flex justify-between items-start mb-2 border-b border-gray-100 pb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 leading-tight">
                        {property.title || 'Propiedad'}
                      </h3>
                      <span className="text-xs text-gray-500 capitalize flex items-center gap-1 mt-0.5">
                         <Building2 size={10} /> {property.type}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${healthStyle.bg} ${healthStyle.color} ${healthStyle.borderColor}`}>
                      {healthStyle.text}
                    </span>
                  </div>

                  {/* Profitability Hero */}
                  <div className="bg-gray-50 rounded-lg p-2 mb-3 text-center border border-gray-100">
                     <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Retorno Neto (ROI)</p>
                     <div className={`text-xl font-extrabold flex items-center justify-center gap-1 ${healthStyle.color}`}>
                        <TrendingUp size={18} />
                        {netReturn.toFixed(1)}%
                     </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-[10px] text-gray-400">Precio Venta</p>
                      <p className="font-semibold text-gray-700 text-sm">
                        ${(property.sale_price / 1000).toFixed(0)}k
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Renta Est.</p>
                      <p className="font-semibold text-gray-700 text-sm">
                        ${property.rent_price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Footer: Address */}
                  <div className="flex items-start gap-1.5 text-xs text-gray-500 bg-white pt-1">
                    <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                    <span className="truncate leading-tight">{property.address}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          padding: 0;
          overflow: hidden;
          border-radius: 0.75rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        .leaflet-container {
            font-family: inherit;
        }
      `}</style>
    </div>
  );
}
