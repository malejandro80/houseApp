'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { getUserZones, getZoneHistory, Zone, ZoneHistory } from '@/app/actions/zone-actions';
import { ArrowLeft, BarChart3, ChevronDown, Loader2, MapPin, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import InfoTooltip from '@/app/components/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
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
                        <motion.div
                            animate={{ rotate: isZoneSelectorOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown size={16} className="text-gray-400 group-hover:text-blue-600" />
                        </motion.div>
                    </button>
                    {selectedZone && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {selectedZone.lat.toFixed(4)}, {selectedZone.lon.toFixed(4)} • {selectedZone.radius}km
                        </p>
                    )}

                    {/* Zone Selector Dropdown */}
                    <AnimatePresence>
                    {isZoneSelectorOpen && (
                        <>
                            <div 
                                className="fixed inset-0 z-40 bg-black/5" 
                                onClick={() => setIsZoneSelectorOpen(false)}
                            />
                            <motion.div 
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2 overflow-hidden"
                            >
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
                                        {selectedZone?.id === zone.id && <motion.div layoutId="activeZoneIndicator" className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                    </button>
                                ))}
                                {zones.length === 0 && (
                                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                        No tienes zonas guardadas via <Link href="/map" className="text-blue-600 underline">Mapa</Link>
                                    </div>
                                )}
                            </motion.div>
                        </>
                    )}
                    </AnimatePresence>
                </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-gray-500">Última actualización: Today 1:00 AM</span>
            </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {!selectedZone ? (
             <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
             >
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="text-blue-500 w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Selecciona una zona para comenzar</h2>
                <p className="text-gray-500 max-w-md mx-auto">Selecciona una de tus zonas guardadas arriba para ver el análisis histórico de precios y rentabilidad.</p>
                <Link href="/map">
                    <motion.span 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-block mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                        Ir al Mapa
                    </motion.span>
                </Link>
            </motion.div>
        ) : loadingHistory ? (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500">Cargando histórico...</p>
            </div>
        ) : history.length === 0 ? (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-8 text-center border border-gray-200"
            >
                <p className="text-gray-500">Aún no hay datos históricos suficientes para esta zona. <br/>Vuelve mañana después de la 1:00 AM.</p>
            </motion.div>
        ) : (
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <motion.div variants={itemVariants} whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-shadow">
                        <div className="flex items-center gap-1 mb-1">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Precio Promedio</p>
                            <InfoTooltip text="Promedio del precio de lista de todas las propiedades activas en esta zona." />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                            ${latestStats?.avg_price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </h3>
                        {priceChange && (
                            <span className={`text-xs font-medium flex items-center gap-1 mt-1 ${priceChange.isPositive ? 'text-green-600' : 'text-red-500'}`}>
                                <TrendingUp className={`w-3 h-3 ${!priceChange.isPositive && 'rotate-180'}`} />
                                {Math.abs(priceChange.value).toFixed(1)}% vs ayer
                            </span>
                        )}
                    </motion.div>
                    
                    <motion.div variants={itemVariants} whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-shadow">
                        <div className="flex items-center gap-1 mb-1">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Precio m²</p>
                            <InfoTooltip text="Valor promedio por metro cuadrado de construcción. Indicador clave de plusvalía." />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                            ${latestStats?.avg_m2_price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </h3>
                    </motion.div>

                    <motion.div variants={itemVariants} whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-shadow">
                        <div className="flex items-center gap-1 mb-1">
                             <p className="text-xs text-gray-500 uppercase font-semibold">Propiedades</p>
                             <InfoTooltip text="Número total de propiedades disponibles en el mercado dentro de la zona." />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {latestStats?.property_count}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">En el mercado</p>
                    </motion.div>

                    <motion.div variants={itemVariants} whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-shadow">
                         <div className="flex items-center gap-1 mb-1">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Rentabilidad Est.</p>
                            <InfoTooltip text="Retorno de inversión anual estimado (ROI) basado en rentas promedio vs precio de venta." />
                         </div>
                         <h3 className="text-2xl font-bold text-blue-600 tracking-tight">
                            {latestStats?.avg_roi ? `${latestStats.avg_roi.toFixed(1)}%` : 'N/A'}
                         </h3>
                    </motion.div>
                </div>

                {/* Price Trend Chart */}
                <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
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
                                <RechartsTooltip 
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
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                 {/* Price per m2 Trend Chart */}
                 <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
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
                                <RechartsTooltip 
                                    labelFormatter={(value) => formatTooltipDate(String(value))}
                                    formatter={(val: number | undefined) => [`$${(val || 0).toLocaleString()}`, 'Precio m²']}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="avg_m2_price" 
                                    stroke="#10b981" 
                                    strokeWidth={3}
                                    dot={false}
                                    animationDuration={1500}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

            </motion.div>
        )}
      </main>
    </div>
  );
}
