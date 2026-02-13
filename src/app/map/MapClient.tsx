'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export type Property = {
  id: string;
  title: string;
  type: string;
  address: string;
  lat: number;
  lon: number;
  sale_price: number;
  rent_price: number;
  cover_image?: string | null;
  area_total: number;
  metadata: any; 
  assigned_advisor?: {
    full_name: string | null;
  } | null;
};

export default function MapClient({ user }: { user: User | null }) {
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
        let query = supabase
          .from('properties')
          .select(`
            *,
            assigned_advisor:assigned_advisor_id(full_name)
          `)
          .not('lat', 'is', null)
          .not('lon', 'is', null);

        // Filter logic:
        // Public: is_listed = true
        // Logged in: is_listed = true OR user_id = my_id
        
        if (user) {
            // Logged in: is_listed (Public Sales) OR my properties (Investments, drafts)
            query = query.or(`is_listed.eq.true,user_id.eq.${user.id}`);
        } else {
            // Public: Only listed properties (which are by definition 'sale')
            query = query.eq('is_listed', true);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching properties:', error);
        } else {
          setProperties(data as any || []);
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
      {/* Search/Filter Overlay could go here */}
      
      {/* Property Count Overlay */}
      <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-sm shadow-md rounded-full px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        {properties.length} propiedades en venta
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full h-full relative isolate">
        {loading ? (
             <div className="h-full w-full flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
             </div>
        ) : (
             <PropertiesMap properties={properties as any} user={user} /> 
        )}
      </div>
    </div>
  );
}
