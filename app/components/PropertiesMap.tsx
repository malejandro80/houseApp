'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Building2, BedDouble, Bath, Car } from 'lucide-react';
import RentabilityResult from './RentabilityResult';

// Fix for default marker icon in Leaflet
// @ts-expect-error Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type Property = {
  id: number;
  type: string;
  address: string;
  lat: number;
  lon: number;
  m2: number;
  rooms: number;
  bathrooms: number;
  has_garage: boolean;
  sale_price: number;
  rent_price: number;
};

type PropertiesMapProps = {
  properties: Property[];
};

// Fix for default marker icon in Leaflet

export default function PropertiesMap({ properties }: PropertiesMapProps) {
  // Center the map on the first property or a default location
  const defaultCenter: [number, number] = properties.length > 0 && properties[0].lat && properties[0].lon
    ? [properties[0].lat, properties[0].lon]
    : [19.4326, -99.1332]; // Mexico City default

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={12} 
      scrollWheelZoom={true} 
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {properties.map((property) => {
        if (!property.lat || !property.lon) return null;

        // Calculate rentability data
        const annualRent = property.rent_price * 12;
        const grossYield = (annualRent / property.sale_price) * 100;
        const isProfitable = grossYield >= 5;
        const targetYield = 0.05;
        const suggestedPrice = annualRent / targetYield;
        const suggestedRent = (property.sale_price * targetYield) / 12;

        return (
          <Marker key={property.id} position={[property.lat, property.lon]}>
            <Popup className="min-w-[300px]">
              <div className="p-2 max-h-[80vh] overflow-y-auto">
                <h3 className="font-bold text-lg mb-1 capitalize">{property.type}</h3>
                <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                  <span className="font-semibold text-gray-800">{property.address}</span>
                </p>
                
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="flex items-center gap-1"><BedDouble size={14}/> {property.rooms} Hab</div>
                  <div className="flex items-center gap-1"><Bath size={14}/> {property.bathrooms} Baños</div>
                  <div className="flex items-center gap-1"><Building2 size={14}/> {property.m2} m²</div>
                  <div className="flex items-center gap-1"><Car size={14}/> {property.has_garage ? 'Si' : 'No'}</div>
                </div>

                <div className="border-t pt-2 space-y-1 mb-2">
                   <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Venta:</span>
                    <span className="font-bold text-green-700">${property.sale_price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Renta:</span>
                    <span className="font-bold text-blue-700">${property.rent_price.toLocaleString()}</span>
                  </div>
                </div>

                <RentabilityResult 
                    annualRent={annualRent}
                    grossYield={grossYield}
                    isProfitable={isProfitable}
                    suggestedPrice={suggestedPrice}
                    suggestedRent={suggestedRent}
                />
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
