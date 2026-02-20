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
  const { isAsesor, isSuperAdmin } = useUserRole();
  const supabase = createClient();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [filter, setFilter] = useState<'market' | 'sale' | 'investment'>('market');
  const [propertyType, setPropertyType] = useState<'all' | 'house' | 'apartment' | 'land' | 'commercial'>('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const currentBounds = useRef<L.LatLngBounds | null>(null);

  const requestRef = useRef<number>(0);

  // Dynamically import map to avoid SSR issues
  const PropertiesMap = useMemo(() => dynamic(
    () => import('@/components/map/PropertiesMap'),
    { 
      loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500 animate-pulse">Cargando mapa...</div>,
      ssr: false
    }
  ), []);

  const fetchProperties = async (bounds: L.LatLngBounds) => {
    const requestId = ++requestRef.current;
    try {
      if (requestId === requestRef.current) setIsFetching(true);
      
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

      // Apply Type Filter
      if (propertyType !== 'all') {
          query = query.eq('type', propertyType);
      }

      // Apply Price Filter
      if (minPrice !== '') {
          query = query.gte('sale_price', minPrice);
      }
      if (maxPrice !== '') {
          query = query.lte('sale_price', maxPrice);
      }

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

      // Only update state if this is still the latest request
      if (requestId === requestRef.current) {
          if (error) {
            console.error('Error fetching properties:', error);
          } else {
            setProperties(data as any || []);
          }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      if (requestId === requestRef.current) {
        setIsFetching(false);
      }
    }
  };

  // Re-fetch when filter changes (Debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
        if (currentBounds.current) {
            fetchProperties(currentBounds.current);
        }
    }, 400);

    return () => clearTimeout(timer);
  }, [filter, propertyType, minPrice, maxPrice]);

  const handleBoundsChange = (bounds: L.LatLngBounds) => {
      currentBounds.current = bounds;
      fetchProperties(bounds);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 relative">
      <h1 className="sr-only">Explorador de Oportunidades Inmobiliarias</h1>
      
      {/* Unified Utilities Menu */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col items-end">
          <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="h-10 px-4 bg-blue-600 rounded-full shadow-lg border border-blue-500 flex items-center justify-center text-white hover:bg-blue-700 transition-all active:scale-95 gap-2 font-bold text-xs"
              aria-label="Menú de Utilidades"
          >
              <Filter size={16} />
              Filtros & Herramientas
          </button>

          <AnimatePresence>
          {isMenuOpen && (
              <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="mt-3 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
              >
                  {/* Header / Summary */}
                  <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resumen</span>
                          <div className={`w-2 h-2 rounded-full ${isFetching ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                          {properties.length} {filter === 'market' ? 'en mercado' : filter === 'sale' ? 'mis ventas' : 'mis análisis'}
                      </p>
                  </div>

                  <div className="p-2 space-y-1">
                      {/* View Mode Section (Only for logged in) */}
                      {user && (!isAsesor || isSuperAdmin) && (
                          <div className="p-2">
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Vista</p>
                             <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl">
                                <button onClick={() => setFilter('market')} className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${filter === 'market' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                                    <LayoutGrid size={14} />
                                    <span className="text-[9px] font-bold">Mercado</span>
                                </button>
                                <button onClick={() => setFilter('sale')} className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${filter === 'sale' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                    <Home size={14} />
                                    <span className="text-[9px] font-bold">Ventas</span>
                                </button>
                                <button onClick={() => setFilter('investment')} className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${filter === 'investment' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                    <TrendingUp size={14} />
                                    <span className="text-[9px] font-bold">Análisis</span>
                                </button>
                             </div>
                          </div>
                      )}

                      {/* Property Type Filters - Chips */}
                      <div className="p-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Filtros</p>
                          <div className="flex flex-wrap gap-1.5">
                            {['all', 'house', 'apartment', 'land', 'commercial'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setPropertyType(type as any)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                        propertyType === type 
                                        ? 'bg-gray-900 text-white border-gray-900' 
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    {type === 'all' ? 'Todo' : 
                                     type === 'house' ? 'Casa' : 
                                     type === 'apartment' ? 'Apto' : 
                                     type === 'land' ? 'Lote' : 'Local'}
                                </button>
                            ))}
                          </div>
                      </div>

                      {/* Price Filter */}
                      <div className="p-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Rango de Precio</p>
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                placeholder="Min" 
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-gray-300">-</span>
                            <input 
                                type="number" 
                                placeholder="Max" 
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                      </div>

                      {/* Tools Section - Radar Toggle (Only for authorized) */}
                      {user && (!isAsesor || isSuperAdmin) && (
                          <div className="p-2 border-t border-gray-50">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Herramientas</p>
                              <button 
                                  onClick={() => {
                                      setIsAnalyzerOpen(!isAnalyzerOpen);
                                      if (!isAnalyzerOpen) setIsMenuOpen(false); // Close menu when opening radar
                                  }}
                                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${isAnalyzerOpen ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                              >
                                  <span className={`text-xs font-bold ${isAnalyzerOpen ? 'text-blue-700' : 'text-gray-700'}`}>Radar de Oportunidades</span>
                                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isAnalyzerOpen ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                      <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${isAnalyzerOpen ? 'translate-x-4' : 'translate-x-0'}`} />
                                  </div>
                              </button>
                          </div>
                      )}
                  </div>
              </motion.div>
          )}
          </AnimatePresence>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full h-full relative isolate">
        <PropertiesMap 
          properties={properties as any} 
          user={user} 
          onBoundsChange={handleBoundsChange}
          isAnalyzerOpen={isAnalyzerOpen}
          onAnalyzerClose={() => setIsAnalyzerOpen(false)}
        /> 
      </div>
    </div>
  );
}
