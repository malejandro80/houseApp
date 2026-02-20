'use client';

import { useState } from 'react';
import PropertyMapWrapper from '@/app/components/PropertyMapWrapper';
import { getZoneStats, ZoneStats } from '@/app/actions/get-zone-stats';
import { X, Radar, TrendingUp, DollarSign, MapPin, Loader2, Layers } from 'lucide-react';
import Tooltip from './Tooltip';

interface ZoneAnalyzerProps {
  id: number;
  lat: number;
  lng: number;
  title?: string;
}

export default function ZoneAnalyzer({ id, lat, lng, title }: ZoneAnalyzerProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [radius, setRadius] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ZoneStats | null>(null);

  const radii = [
    { label: '500m', value: 0.5 },
    { label: '1km', value: 1 },
    { label: '2km', value: 2 },
  ];

  const handleOpenMenu = () => {
    setIsMenuOpen(true);
    // Default to 1km if not set
    if (radius === 0) {
        handleRadiusChange(1);
    }
  };

  const handleRadiusChange = async (km: number) => {
    setRadius(km);
    setLoading(true);
    try {
      const data = await getZoneStats(lat, lng, km, id);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch zone stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert km to meters for the map circle
  const radiusInMeters = radius * 1000;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-white">
      
      {/* Header */}
      <div className="p-6 pb-0 mb-6">
         <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="text-blue-600" />
            Ubicación y Análisis
        </h2>
      </div>

      {/* Map Container */}
      <div className="relative h-[400px]">
        <PropertyMapWrapper 
            lat={lat} 
            lng={lng} 
            title={title} 
            radius={radiusInMeters}
        />

        {/* Floating Action Button - Now outside Layout to ensure visibility */}
        <button 
           onClick={handleOpenMenu}
           className="absolute top-4 right-4 bg-white shadow-lg border border-gray-200 z-[1000] py-2 px-4 rounded-full hover:bg-gray-50 hover:scale-105 transition-all active:scale-95 text-gray-700 flex items-center gap-2 font-medium text-sm group"
        >
           <Layers className="text-blue-600 w-4 h-4" />
           <span>Precio Promedio Zona</span>
        </button>

        {/* Side Menu Overlay */}
        {isMenuOpen && (
            <div className="absolute inset-0 z-[2000] flex justify-end">
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMenuOpen(false)}
                />
                
                {/* Drawer */}
                <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
                    
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                        <div className="flex items-center gap-2">
                            <Radar className="w-5 h-5" />
                            <h3 className="font-bold">Radar de Precios</h3>
                        </div>
                        <button 
                            onClick={() => setIsMenuOpen(false)}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Drawer Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        
                        {/* Radius Selector */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Radio de búsqueda</label>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                {radii.map((r) => (
                                    <button
                                        key={r.value}
                                        onClick={() => handleRadiusChange(r.value)}
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${radius === r.value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Results */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
                                <span className="text-sm">Analizando mercado...</span>
                            </div>
                        ) : stats ? (
                            <div className="space-y-4 animate-fade-in-up">
                                {stats.count > 0 ? (
                                    <>
                                        {/* Summary Card */}
                                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                            <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Precio Promedio</p>
                                            <h4 className="text-2xl font-bold text-gray-900">
                                                ${stats.averagePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Basado en {stats.count} propiedades cercanas
                                            </p>
                                        </div>

                                        {/* Metrics Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <div className="flex items-center gap-1 text-gray-500 mb-1">
                                                    <TrendingUp size={14} />
                                                    <span className="text-xs font-medium">Precio m²</span>
                                                </div>
                                                <p className="text-lg font-bold text-gray-900">
                                                    ${stats.averagePriceM2.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </p>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <div className="flex items-center gap-1 text-gray-500 mb-1">
                                                    <DollarSign size={14} />
                                                    <span className="text-xs font-medium">Rango</span>
                                                </div>
                                                <p className="text-xs font-bold text-gray-900 mt-1">
                                                    ${(stats.minPrice/1000).toFixed(0)}k - ${(stats.maxPrice/1000).toFixed(0)}k
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-400 text-center italic">
                                            * Datos estimados basados en propiedades listadas en la plataforma.
                                        </p>
                                    </>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <MapPin className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                                        <p className="text-sm font-medium">No hay datos suficientes</p>
                                        <p className="text-xs">Intenta aumentar el radio de búsqueda.</p>
                                    </div>
                                )}
                            </div>
                        ) : null}

                    </div>
                    
                    {/* Drawer Footer */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <button 
                            onClick={() => setIsMenuOpen(false)}
                            className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                            Cerrar Análisis
                        </button>
                    </div>

                </div>
            </div>
        )}

      </div>
    </div>
  );
}
