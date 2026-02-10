'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../../utils/supabase';
import { ArrowLeft, Map as MapIcon } from 'lucide-react';
import Link from 'next/link';

export default function MapPage() {
  const [properties, setProperties] = useState<any[]>([]);
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
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm z-10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-xl font-bold flex items-center gap-2 text-gray-800">
              <MapIcon className="w-5 h-5 text-blue-600" />
              Mapa de Propiedades
            </h1>
          </div>
          <div className="text-sm text-gray-500">
            {properties.length} propiedades encontradas
          </div>
        </div>
      </header>

      {/* Map Container */}
      <div className="flex-1 relative">
        {loading ? (
             <div className="h-full w-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
             </div>
        ) : (
             <PropertiesMap properties={properties} />
        )}
      </div>
    </div>
  );
}
