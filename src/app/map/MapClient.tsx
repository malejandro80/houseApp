'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, Map as MapIcon } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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
  cover_image?: string | null;
  images?: string[];
};

export default function MapClient() {
  const supabase = createClient();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamically import map to avoid SSR issues
  const PropertiesMap = useMemo(() => dynamic(
    () => import('../components/PropertiesMap'),
    { 
      loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500 animate-pulse">Cargando mapa...</div>,
      ssr: false
    }
  ), []);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const { data, error } = await supabase
          .from('datahouse')
          .select('*')
          .not('lat', 'is', null) // Only fetch properties with coordinates
          .not('lon', 'is', null);

        if (error) {
          console.error('Error fetching properties:', error);
        } else {
          setProperties(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [supabase]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 relative">
      {/* Property Count Overlay */}
      <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-sm shadow-md rounded-full px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        {properties.length} propiedades encontradas
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full h-full relative isolate">
        {loading ? (
             <div className="h-full w-full flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
             </div>
        ) : (
             <PropertiesMap properties={properties} />
        )}
      </div>
    </div>
  );
}
