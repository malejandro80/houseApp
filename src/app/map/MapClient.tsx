'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { LayoutGrid, Home, TrendingUp, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserRole } from '@/hooks/useUserRole';

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
  const { isAsesor } = useUserRole();
  const supabase = createClient();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [filter, setFilter] = useState<'market' | 'sale' | 'investment'>('market');
  const currentBounds = useRef<L.LatLngBounds | null>(null);

  // Dynamically import map to avoid SSR issues
  const PropertiesMap = useMemo(() => dynamic(
    () => import('../components/PropertiesMap'),
    { 
      loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500 animate-pulse">Cargando mapa...</div>,
      ssr: false
    }
  ), []);

  const fetchProperties = async (bounds: L.LatLngBounds) => {
    try {
      setIsFetching(true);
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      let query = supabase
        .from('properties')
        .select(`
          *,
          assigned_advisor:assigned_advisor_id(full_name)
        `)
        .gte('lat', sw.lat)
        .lte('lat', ne.lat)
        .gte('lon', sw.lng)
        .lte('lon', ne.lng);

      if (user) {
          if (filter === 'market') {
              // Show only public listed properties for SALE (Market view)
              query = query.eq('is_listed', true).eq('purpose', 'sale');
          } else {
              // Strictly my properties by purpose (sale or investment)
              query = query.eq('user_id', user.id).eq('purpose', filter);
          }
      } else {
          // Public view: only listed properties for SALE
          query = query.eq('is_listed', true).eq('purpose', 'sale');
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
      setIsFetching(false);
    }
  };

  // Re-fetch when filter changes
  useEffect(() => {
    if (currentBounds.current) {
        fetchProperties(currentBounds.current);
    }
  }, [filter]);

  const handleBoundsChange = (bounds: L.LatLngBounds) => {
      currentBounds.current = bounds;
      fetchProperties(bounds);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 relative">
      <h1 className="sr-only">Explorador de Oportunidades Inmobiliarias</h1>
      
      {/* Property Count Overlay */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col items-end gap-2">
        <div className="bg-white/95 backdrop-blur-sm shadow-md rounded-full px-4 py-2 text-sm font-bold text-gray-800 border border-gray-200 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isFetching ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
            {properties.length} {filter === 'market' ? 'propiedades en mercado' : filter === 'sale' ? 'mis propiedades en venta' : 'mis análisis de inversión'}
        </div>
      </div>

      {/* Filter Bar (Only for logged in users who are NOT advisors) */}
      <AnimatePresence>
      {user && !isAsesor && (
        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[400] bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-1"
        >
            <button 
                onClick={() => setFilter('market')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${filter === 'market' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}`}
            >
                <LayoutGrid size={14} />
                Mercado
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <button 
                onClick={() => setFilter('sale')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${filter === 'sale' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}`}
            >
                <Home size={14} />
                Mis Ventas
            </button>
            <button 
                onClick={() => setFilter('investment')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${filter === 'investment' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}`}
            >
                <TrendingUp size={14} />
                Mis Análisis
            </button>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Map Container */}
      <div className="flex-1 w-full h-full relative isolate">
        <PropertiesMap 
          properties={properties as any} 
          user={user} 
          onBoundsChange={handleBoundsChange} 
        /> 
      </div>
    </div>
  );
}
