'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { getUserZones, getZoneHistory, Zone, ZoneHistory } from '@/app/actions/zone-actions';
import { ArrowLeft, BarChart3, ChevronDown, Loader2, MapPin, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function ZoneStatsPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [history, setHistory] = useState<ZoneHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isZoneSelectorOpen, setIsZoneSelectorOpen] = useState(false);

  useEffect(() => {
    loadZones();
  }, []);

  useEffect(() => {
    if (selectedZone) {
      fetchHistory(selectedZone.id);
    }
  }, [selectedZone]);

  const loadZones = async () => {
    try {
      const userZones = await getUserZones();
      setZones(userZones);
      if (userZones.length > 0) {
        setSelectedZone(userZones[0]);
      }
    } catch (error) {
      console.error('Error loading zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (zoneId: number) => {
    setLoadingHistory(true);
    try {
      const data = await getZoneHistory(zoneId);
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Format date for chart
  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };
  
  const formatTooltipDate = (dateStr: string) => {
     return new Date(dateStr).toLocaleDateString('es-ES', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
     });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Calculate change percentages
  const calculateChange = (current: number, field: keyof ZoneHistory) => {
    if (history.length < 2) return null;
    const previous = history[history.length - 2][field] as number;
    if (!previous) return null;
    const diff = current - previous;
    const percent = (diff / previous) * 100;
    return {
      value: percent,
      isPositive: percent >= 0
    };
  };

  const latestStats = history.length > 0 ? history[history.length - 1] : null;
  const priceChange = latestStats ? calculateChange(latestStats.avg_price, 'avg_price') : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Link href="/map" className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div className="relative">
                    <button 
                        onClick={() => setIsZoneSelectorOpen(!isZoneSelectorOpen)}
                        className="flex items-center gap-2 font-bold text-gray-900 group"
                    >
                        <span className="text-lg">{selectedZone ? selectedZone.name : 'Seleccionar Zona'}</span>
                        <ChevronDown size={16} className={`text-gray-400 group-hover:text-blue-600 transition-transform ${isZoneSelectorOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {selectedZone && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {selectedZone.lat.toFixed(4)}, {selectedZone.lon.toFixed(4)} • {selectedZone.radius}km
                        </p>
                    )}

                    {/* Zone Selector Dropdown */}
                    {isZoneSelectorOpen && (
                        <>
                            <div 
                                className="fixed inset-0 z-40 bg-black/5" 
                                onClick={() => setIsZoneSelectorOpen(false)}
                            />
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2 animate-in fade-in slide-in-from-top-2">
                                <p className="text-xs font-semibold text-gray-400 px-4 py-2 uppercase tracking-wide">Tus Zonas Guardadas</p>
                                {zones.map(zone => (
                                    <button
                                        key={zone.id}
                                        onClick={() => {
                                            setSelectedZone(zone);
                                            setIsZoneSelectorOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center justify-between ${selectedZone?.id === zone.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                                    >
                                        <span>{zone.name}</span>
                                        {selectedZone?.id === zone.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                    </button>
                                ))}
                                {zones.length === 0 && (
                                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                        No tienes zonas guardadas via <Link href="/map" className="text-blue-600 underline">Mapa</Link>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-gray-500">Última actualización: Today 1:00 AM</span>
            </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {!selectedZone ? (
             <div className="text-center py-20">
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="text-blue-500 w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Selecciona una zona para comenzar</h2>
                <p className="text-gray-500 max-w-md mx-auto">Selecciona una de tus zonas guardadas arriba para ver el análisis histórico de precios y rentabilidad.</p>
                <Link href="/map" className="inline-block mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Ir al Mapa
                </Link>
            </div>
        ) : loadingHistory ? (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500">Cargando histórico...</p>
            </div>
        ) : history.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
                <p className="text-gray-500">Aún no hay datos históricos suficientes para esta zona. <br/>Vuelve mañana después de la 1:00 AM.</p>
            </div>
        ) : (
            <>
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Precio Promedio</p>
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                            ${latestStats?.avg_price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </h3>
                        {priceChange && (
                            <span className={`text-xs font-medium flex items-center gap-1 mt-1 ${priceChange.isPositive ? 'text-green-600' : 'text-red-500'}`}>
                                <TrendingUp className={`w-3 h-3 ${!priceChange.isPositive && 'rotate-180'}`} />
                                {Math.abs(priceChange.value).toFixed(1)}% vs ayer
                            </span>
                        )}
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Precio m²</p>
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                            ${latestStats?.avg_m2_price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </h3>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Propiedades</p>
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {latestStats?.property_count}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">En el mercado</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                         <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Rentabilidad Est.</p>
                         <h3 className="text-2xl font-bold text-blue-600 tracking-tight">
                            {latestStats?.avg_roi ? `${latestStats.avg_roi.toFixed(1)}%` : 'N/A'}
                         </h3>
                    </div>
                </div>

                {/* Price Trend Chart */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900">Tendencia de Precios</h3>
                        {/* Period Selector could go here */}
                    </div>
                    
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="recorded_at" 
                                    tickFormatter={formatXAxis} 
                                    tick={{fontSize: 12, fill: '#9ca3af'}} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis 
                                    tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} 
                                    tick={{fontSize: 12, fill: '#9ca3af'}} 
                                    axisLine={false}
                                    tickLine={false}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip 
                                    labelFormatter={(value) => formatTooltipDate(String(value))}
                                    formatter={(val: number | undefined) => [`$${(val || 0).toLocaleString()}`, 'Precio Promedio']}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="avg_price" 
                                    stroke="#3b82f6" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorPrice)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                 {/* Price per m2 Trend Chart */}
                 <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6">Evolución Precio por m²</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="recorded_at" 
                                    tickFormatter={formatXAxis} 
                                    tick={{fontSize: 12, fill: '#9ca3af'}} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis 
                                    tickFormatter={(val) => `$${val.toLocaleString()}`} 
                                    tick={{fontSize: 12, fill: '#9ca3af'}} 
                                    axisLine={false}
                                    tickLine={false}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip 
                                    labelFormatter={(value) => formatTooltipDate(String(value))}
                                    formatter={(val: number | undefined) => [`$${(val || 0).toLocaleString()}`, 'Precio m²']}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="avg_m2_price" 
                                    stroke="#10b981" 
                                    strokeWidth={3}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </>
        )}
      </main>
    </div>
  );
}
