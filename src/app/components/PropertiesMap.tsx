import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Building2, TrendingUp, MapPin, Layers, X, Radar, DollarSign, Loader2, Save, Trash2, History, UserCircle, Mail, Target, ArrowRight, ShieldCheck } from 'lucide-react';
import { calculateProfitabilityForList, getHealthLabel } from '@/lib/financial-utils';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { getZoneStats, ZoneStats } from '@/app/actions/get-zone-stats';
import { getUserZones, createZone, deleteZone, Zone } from '@/app/actions/zone-actions';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@supabase/supabase-js';
import { getAdvisorContact } from '@/app/actions/contact';
import { toast } from 'sonner';

type Property = {
  id: string; 
  title?: string | null;
  type: string;
  address: string;
  lat: number;
  lon: number;
  sale_price: number;
  rent_price: number;
  cover_image?: string | null;
  user_id?: string | null;
  assigned_advisor_id?: string | null; 
  assigned_advisor?: {
    full_name: string | null;
  } | null;
};

// Custom Colored Marker Function
const createColoredMarker = (color: string) => {
  return L.divIcon({
    className: 'custom-colored-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); transition: transform 0.2s;"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

type PropertiesMapProps = {
  properties: Property[];
  user?: User | null;
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
  children?: React.ReactNode;
};

function MapController({ 
  onMapClick, 
  onBoundsChange 
}: { 
  onMapClick: (center: L.LatLng) => void,
  onBoundsChange?: (bounds: L.LatLngBounds) => void
}) {
  const map = useMap();
  
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
    moveend: () => {
      onBoundsChange?.(map.getBounds());
    }
  });

  useEffect(() => {
    // Initial bounds trigger
    onBoundsChange?.(map.getBounds());
  }, []);

  return null;
}

export default function PropertiesMap({ properties, user, onBoundsChange, children }: PropertiesMapProps) {
  // Center: Mexico City default or first property
  const defaultCenter: [number, number] = properties.length > 0
    ? [properties[0].lat, properties[0].lon]
    : [19.4326, -99.1332];

  const [mapCenter, setMapCenter] = useState<L.LatLng>(new L.LatLng(defaultCenter[0], defaultCenter[1]));
  
  // Analyzer State
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'radar' | 'my-zones'>('radar');
  const [radius, setRadius] = useState<number>(1); // Default 1km
  
  // Radar Stats
  const [loadingStats, setLoadingStats] = useState(false);
  const [stats, setStats] = useState<ZoneStats | null>(null);

  // My Zones State
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [creatingZone, setCreatingZone] = useState(false);
  
  // Contact State
  const [contactingId, setContactingId] = useState<string | null>(null);

  // Load Zones on Mount (Only if user logged in)
  useEffect(() => {
    if (user) {
        loadZones();
    }
  }, [user]);

  const loadZones = async () => {
    setLoadingZones(true);
    try {
      const userZones = await getUserZones();
      setZones(userZones);
    } catch (error) {
      console.error('Failed to load zones:', error);
    } finally {
      setLoadingZones(false);
    }
  };

  // Fetch stats when analyzer is open and map center changes (via click) or radius changes
  useEffect(() => {
    if (isAnalyzerOpen && activeTab === 'radar') {
      fetchStats();
    }
  }, [isAnalyzerOpen, radius, mapCenter, activeTab]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const data = await getZoneStats(mapCenter.lat, mapCenter.lng, radius, 0); 
      setStats(data);
    } catch (error) {
       console.error(error);
    } finally {
       setLoadingStats(false);
    }
  };

  const handleCreateZone = async () => {
    if (!newZoneName.trim()) return;
    setCreatingZone(true);
    try {
      await createZone(newZoneName, mapCenter.lat, mapCenter.lng, radius);
      setNewZoneName('');
      await loadZones(); // Reload list
      setActiveTab('my-zones');
    } catch (error) {
      toast.error('Error al crear la zona');
    } finally {
      setCreatingZone(false);
    }
  };

  const handleDeleteZone = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta zona?')) return;
    try {
      await deleteZone(id);
      await loadZones();
      toast.success('Zona eliminada');
    } catch (error) {
      toast.error('Error al eliminar la zona');
    }
  };

  const handleSelectZone = (zone: Zone) => {
    setMapCenter(new L.LatLng(zone.lat, zone.lon));
    setRadius(zone.radius);
  };

  const handleOpenAnalyzer = () => {
    setIsAnalyzerOpen(true);
  };

  const handleMapClick = (latlng: L.LatLng) => {
      if (isAnalyzerOpen) {
          setMapCenter(latlng);
      }
  };
  
  const handleContactAdvisor = async (propertyId: string, advisorId: string | undefined | null) => {
      if (!advisorId) {
          toast.info('Esta propiedad no tiene un asesor asignado aún.');
          return;
      }
      
      setContactingId(propertyId);
      try {
          const contact = await getAdvisorContact(advisorId);
          if (contact.email) {
              window.location.href = `mailto:${contact.email}?subject=Interés en propiedad ${propertyId}&body=Hola, estoy interesado en recibir más información sobre esta propiedad.`;
          } else {
              toast.error('No se encontró información de contacto para este asesor.');
          }
      } catch (e) {
          console.error(e);
          toast.error('Error al contactar asesor.');
      } finally {
          setContactingId(null);
      }
  };

  return (
    <div className="h-full w-full rounded-lg overflow-hidden relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapController onMapClick={handleMapClick} onBoundsChange={onBoundsChange} />
        <LocateControl autoLocate={true} />
        {children}

        {/* Render Properties */}
        {properties.map((property) => {
          const { netReturn, health } = calculateProfitabilityForList(property.sale_price, property.rent_price);
          const healthStyle = getHealthLabel(health);
          
          const isInvestment = (property as any).purpose === 'investment';

          let markerColor = '#ef4444'; 
          if (isInvestment) {
              markerColor = '#3b82f6'; // Blue for Investment
          } else {
              if (health === 'safe') markerColor = '#16a34a'; 
              else if (health === 'average') markerColor = '#ca8a04'; 
          }

          return (
            <Marker 
              key={property.id} 
              position={[property.lat, property.lon]}
              icon={createColoredMarker(markerColor)}
              alt={`Propiedad: ${property.title || 'Inmueble'}, Rentabilidad: ${netReturn.toFixed(1)}%`}
            >
              <Popup className="custom-popup" closeButton={false}>
                 <div className="p-0 min-w-[240px] max-w-[260px] font-sans pb-3">
                  
                  {/* Property Image */}
                  <div className="relative h-32 w-full bg-gray-100 mb-3">
                    {property.cover_image ? (
                        <img 
                            src={property.cover_image} 
                            alt={property.title || 'Propiedad'} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                             <Building2 size={32} />
                        </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                        {isInvestment && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 shadow-sm">
                                Mi Análisis
                            </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${healthStyle.bg} ${healthStyle.color} ${healthStyle.borderColor}`}>
                            {healthStyle.text}
                        </span>
                    </div>
                  </div>

                  <div className="px-3">
                     {/* Title & Type */}
                    <div className="mb-3">
                      <h3 className="font-black text-gray-900 leading-tight text-base mb-1 line-clamp-1 tracking-tight">
                        {property.title || 'Propiedad sin nombre'}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                            <Building2 size={10} aria-hidden="true" className="text-blue-600" /> {property.type}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                            <MapPin size={10} aria-hidden="true" /> {property.address.split(',')[0]}
                        </div>
                      </div>
                    </div>

                    {/* Profitability Hero (Glassmorphism look) */}
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 mb-4 text-center border border-gray-100 shadow-inner relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Retorno Neto (ROI)</p>
                        <div className={`text-2xl font-black flex items-center justify-center gap-2 ${healthStyle.color.replace('600', '800')}`}>
                            <TrendingUp size={20} aria-hidden="true" strokeWidth={3} />
                            {netReturn.toFixed(1)}%
                        </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50">
                            <p className="text-[9px] font-bold text-gray-700 uppercase tracking-wider mb-1">Precio Venta</p>
                            <p className="font-extrabold text-gray-900 text-sm">
                                ${property.sale_price.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50">
                            <p className="text-[9px] font-bold text-gray-700 uppercase tracking-wider mb-1">Renta Est.</p>
                            <p className="font-extrabold text-gray-900 text-sm">
                                ${property.rent_price.toLocaleString()}<span className="text-[10px] text-gray-500">/m</span>
                            </p>
                        </div>
                    </div>

                    {/* Contact / Detail Action - ONLY FOR SALES */}
                    {!isInvestment && (
                        user ? (
                            user.id === property.user_id ? (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <Link 
                                        href={`/my-properties/${property.id}/edit`}
                                        className="w-full py-3 bg-gray-900 hover:bg-black !text-white rounded-2xl text-xs font-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        Gestionar Propiedad
                                        <ArrowRight size={14} />
                                    </Link>
                                </div>
                            ) : (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 mb-3 px-1">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 border border-blue-200 uppercase">
                                            {property.assigned_advisor?.full_name?.[0] || 'A'}
                                        </div>
                                        <p className="text-[10px] text-gray-600 font-medium">
                                            Asesor: <span className="font-bold text-gray-900">{property.assigned_advisor?.full_name?.split(' ')[0] || 'Experto Local'}</span>
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => handleContactAdvisor(property.id, property.assigned_advisor_id)}
                                            disabled={contactingId === property.id}
                                            className="w-full py-3 bg-blue-700 hover:bg-blue-800 !text-white rounded-2xl text-xs font-black transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-2"
                                            aria-label="Consultar Disponibilidad"
                                        >
                                            {contactingId === property.id ? <Loader2 className="animate-spin w-4 h-4" /> : <Mail className="w-4 h-4" />}
                                            Consultar Disponibilidad
                                        </button>
                                        <button
                                            onClick={() => window.open('https://www.bbva.com.mx/personas/productos/creditos/credito-hipotecario/simulador-credito-hipotecario.html', '_blank')}
                                            className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl text-xs font-black hover:bg-gray-50 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                                            aria-label="Simular Crédito Hipotecario"
                                        >
                                            <Target size={14} className="text-emerald-500" />
                                            Simular Crédito
                                        </button>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-[11px] text-gray-600 mb-4 font-bold text-center leading-relaxed">
                                    Únete para contactar asesores y recibir <span className="text-blue-700 font-black italic">análisis exclusivos</span>.
                                </p>
                                <Link 
                                    href="/login" 
                                    className="block w-full py-4 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 !text-white text-center rounded-2xl text-xs font-black transition-all shadow-xl shadow-blue-900/20 active:scale-95 group relative overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        ¡Quiero esta propiedad!
                                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </span>
                                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                                </Link>
                            </div>
                        )
                    )}
                    
                    {/* Investment Notice & Disclaimer */}
                    {isInvestment && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                             <div className="text-center">
                                 <p className="text-[10px] text-blue-600 font-black bg-blue-50 py-1.5 rounded-xl px-4 inline-flex items-center gap-2 border border-blue-100">
                                     <ShieldCheck size={12} /> Solo visible para ti
                                 </p>
                             </div>
                             <p className="text-[9px] text-gray-500 font-bold text-center leading-tight px-2">
                                * Los rendimientos proyectados están sujetos a variaciones del mercado. Invierta con criterio profesional.
                             </p>
                        </div>
                    )}

                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Analzyer Circles... (unchanged) */}
        {isAnalyzerOpen && (
            <>
             <Circle 
                center={mapCenter} 
                radius={radius * 1000} 
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, dashArray: '5, 10' }} 
            />
            <Circle 
                center={mapCenter}
                radius={10}
                pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 1 }}
            />
            </>
        )}
      </MapContainer>
      
      {/* Floating Action Button (Top-Left) */}
      <AnimatePresence>
      {!isAnalyzerOpen && (
        <motion.button 
           initial={{ scale: 0, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           exit={{ scale: 0, opacity: 0 }}
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
           onClick={handleOpenAnalyzer}
           className="absolute top-4 left-16 bg-white/80 backdrop-blur-md shadow-xl border border-white/20 z-[400] py-2 px-6 rounded-full hover:bg-white text-gray-700 flex items-center gap-2 font-bold text-sm tracking-tight transition-all duration-300"
           aria-label="Abrir Radar de Oportunidades"
        >
           <div className="bg-blue-600 p-1 rounded-full">
            <Radar className="text-white w-3 h-3 animate-pulse" />
           </div>
           <span>Radar de Oportunidades</span>
        </motion.button>
      )}
      </AnimatePresence>

      {/* Analyzer Drawer - LEFT aligned */}
      <AnimatePresence>
      {isAnalyzerOpen && (
        <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-4 left-16 z-[500] w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[calc(100%-2rem)]"
        >
             <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-700/80 to-indigo-800/80 backdrop-blur-lg text-white">
                <div className="flex items-center gap-2">
                    <Radar className="w-5 h-5 animate-pulse" />
                    <h3 className="font-bold text-sm uppercase tracking-widest" id="radar-title">Radar de Mercado</h3>
                </div>
                <button onClick={() => setIsAnalyzerOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors" aria-label="Cerrar radar">
                    <X size={16} aria-hidden="true" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 bg-white/50">
                <button 
                    onClick={() => setActiveTab('radar')}
                    className={`flex-1 py-3 text-[10px] uppercase tracking-wider font-bold border-b-2 transition-colors ${activeTab === 'radar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:bg-gray-50'}`}
                >
                    Tendencias
                </button>
                <button 
                    onClick={() => setActiveTab('my-zones')}
                    className={`flex-1 py-3 text-[10px] uppercase tracking-wider font-bold border-b-2 transition-colors ${activeTab === 'my-zones' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:bg-gray-50'}`}
                >
                    Mis Alertas
                </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
                {activeTab === 'radar' ? (
                    <>
                        {/* Radar Content */}
                         <p className="text-[10px] text-blue-700 mb-5 bg-blue-50/50 p-2.5 rounded-xl border border-blue-200/50 font-medium leading-relaxed">
                            <span className="font-bold">✨ Tip:</span> Haz click en cualquier punto del mapa para analizar el valor promedio de la zona.
                        </p>

                        {/* Radius Slider */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Radio de Impacto</label>
                                <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-lg">{radius} km</span>
                            </div>
                            <input 
                                type="range" 
                                min="0.5" 
                                max="10" 
                                step="0.5" 
                                value={radius} 
                                onChange={(e) => setRadius(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium">
                                <span>500m</span>
                                <span>10km</span>
                            </div>
                        </div>

                        {/* Results */}
                        {loadingStats ? (
                            <div className="flex flex-col items-center justify-center py-10">
                                <div className="relative">
                                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                                    <Radar className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 animate-pulse" />
                                </div>
                                <span className="text-[10px] font-bold text-blue-600 mt-4 uppercase tracking-widest">Analizando Mercado</span>
                            </div>
                        ) : stats ? (
                             <div className="space-y-4 relative">
                                {!user && stats.count > 0 && (
                                    <div className="absolute inset-0 z-20 backdrop-blur-md bg-white/30 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-white/50 shadow-lg">
                                        <div className="bg-indigo-600 p-3 rounded-full mb-4 shadow-xl shadow-indigo-500/30">
                                            <TrendingUp className="text-white w-6 h-6" />
                                        </div>
                                        <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Análisis Premium</p>
                                        <p className="text-[10px] text-gray-600 mb-6 font-medium leading-relaxed">Únete a nuestra comunidad de inversionistas para desbloquear los precios exactos de esta zona.</p>
                                        <Link href="/login" className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95">
                                            Acceder Gratis
                                        </Link>
                                    </div>
                                )}
                                
                                {stats.count > 0 ? (
                                    <>
                                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group">
                                            <div className="relative z-10">
                                                <p className="text-[10px] font-bold text-blue-100 uppercase mb-1 tracking-widest">Valor Promedio</p>
                                                <h4 className="text-2xl font-black">
                                                    ${stats.averagePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </h4>
                                                <div className="flex items-center gap-1.5 mt-2">
                                                    <Building2 size={12} className="text-blue-200" />
                                                    <p className="text-[10px] text-blue-100 font-medium">
                                                        Basado en {stats.count} propiedades
                                                    </p>
                                                </div>
                                            </div>
                                            <Radar className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform duration-700" />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
                                                <p className="text-[10px] text-gray-700 font-bold uppercase mb-1">Precio m²</p>
                                                <p className="text-sm font-black text-gray-900">
                                                    ${stats.averagePriceM2.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </p>
                                            </div>
                                            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
                                                <p className="text-[10px] text-gray-700 font-bold uppercase mb-1">Rango Zona</p>
                                                <p className="text-[10px] font-black text-gray-700 mt-1">
                                                    ${(stats.minPrice/1000).toFixed(0)}k - ${(stats.maxPrice/1000).toFixed(0)}k
                                                </p>
                                            </div>
                                        </div>

                                        {/* Neighborhood Health (Real Estate Expert Insight) */}
                                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-tight">Análisis de Zona</h4>
                                                <p className="text-[10px] text-emerald-600 font-medium">Zona en alta demanda • Plusvalía +4.2%</p>
                                            </div>
                                            <div className="bg-emerald-500 p-2 rounded-full text-white shadow-lg shadow-emerald-500/30">
                                                <TrendingUp size={14} />
                                            </div>
                                        </div>

                                        {/* Save Zone CTA - Only if logged in */}
                                        {user && (
                                            <div className="mt-6 flex gap-2 pt-4 border-t border-gray-100">
                                                <input 
                                                    type="text"
                                                    placeholder="Nombre de la zona..."
                                                    value={newZoneName}
                                                    onChange={(e) => setNewZoneName(e.target.value)}
                                                    className="flex-1 text-xs border border-gray-200 bg-gray-50/50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                                                />
                                                <button 
                                                    onClick={handleCreateZone}
                                                    disabled={creatingZone || !newZoneName.trim()}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1 active:scale-95"
                                                    aria-label="Guardar Zona"
                                                >
                                                    {creatingZone ? <Loader2 className="animate-spin w-3 h-3" /> : <Save className="w-3 h-3" />}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-10 px-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <Radar size={32} className="mx-auto text-gray-200 mb-3" />
                                        <p className="text-xs font-medium text-gray-500">Mueve el radar para encontrar datos de mercado en esta zona.</p>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </>
                ) : (
                    <div className="space-y-4">
                        {/* My Zones List */}
                         {!user ? (
                            <div className="text-center py-12 px-6">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserCircle size={32} className="text-gray-300" />
                                </div>
                                <p className="text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Acceso Restringido</p>
                                <p className="text-xs text-gray-500 leading-relaxed">Registra tu cuenta para monitorear zonas de inversión y recibir alertas de oportunidad.</p>
                                <Link href="/login" className="mt-6 inline-block w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all">Iniciar Sesión</Link>
                            </div>
                         ) : loadingZones ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="animate-spin text-blue-500 mb-2" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Sincronizando zonas...</p>
                            </div>
                        ) : zones.length > 0 ? (
                            zones.map(zone => (
                                <motion.div 
                                    key={zone.id} 
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 hover:shadow-md transition-all duration-300 group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div onClick={() => handleSelectZone(zone)} className="cursor-pointer flex-1">
                                            <h4 className="font-black text-gray-800 text-sm tracking-tight group-hover:text-blue-600 transition-colors uppercase">{zone.name}</h4>
                                            <div className="flex items-center gap-3 mt-1.5 font-bold">
                                                <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <Radar size={10} /> {zone.radius} km
                                                </span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteZone(zone.id)}
                                            className="text-gray-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                                            aria-label={`Eliminar zona ${zone.name}`}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {/* History Stats Snapshot */}
                                    {zone.last_history ? (
                                        <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center group-hover:bg-blue-50 transition-colors">
                                            <div>
                                                <p className="text-[9px] text-gray-700 font-bold uppercase mb-0.5">Precio Hoy</p>
                                                <p className="text-xs font-black text-gray-900">${zone.last_history.avg_price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] text-gray-700 font-bold uppercase mb-0.5">Precio m²</p>
                                                <p className="text-xs font-black text-gray-900">${zone.last_history.avg_m2_price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-center gap-2">
                                            <History size={12} className="text-gray-300 animate-spin-slow" />
                                            <p className="text-[10px] text-gray-400 font-bold uppercase italic tracking-tighter">
                                                Calibrando datos históricos...
                                            </p>
                                        </div>
                                    )}
                                    
                                    <div className="flex gap-2 mt-4">
                                        <button 
                                            onClick={() => handleSelectZone(zone)}
                                            className="flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-1 active:scale-95"
                                        >
                                            Ver Mapa
                                        </button>
                                        <Link 
                                            href={`/zone-stats/${zone.id}`}
                                            className="flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-1 active:scale-95"
                                        >
                                            Insights
                                        </Link>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-10 px-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <Radar size={32} className="mx-auto text-gray-200 mb-3" />
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Cero Zonas</p>
                                <p className="text-[10px] text-gray-500 leading-relaxed font-medium">Guarda tu primera zona para monitorear oportunidades automáticamente.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
      )}
      </AnimatePresence>

      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          padding: 0;
          overflow: hidden;
          border-radius: 1.25rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        .leaflet-container {
            font-family: inherit;
        }
        .animate-spin-slow {
            animation: spin 3s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function LocateControl({ autoLocate = false }: { autoLocate?: boolean }) {
  const map = useMapEvents({
    locationfound(e) {
      map.flyTo(e.latlng, 15);
      L.circle(e.latlng, { radius: e.accuracy / 2, color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.2 }).addTo(map);
      L.circleMarker(e.latlng, { radius: 6, color: 'white', fillColor: '#2563eb', fillOpacity: 1, weight: 2 }).addTo(map);
    },
    locationerror(e) {
        // Only alert if manually triggered or if critical. For auto-locate, maybe silent fail or console warn is better to avoid annoying popups if denied previously.
        console.warn('Location access denied or error.');
        if (!autoLocate) toast.error('No pudimos acceder a tu ubicación. Por favor revisa los permisos.');
    }
  });

  useEffect(() => {
      if (autoLocate) {
          map.locate({ setView: true, maxZoom: 14 });
      }
  }, [autoLocate, map]);

  return (
    <button 
        onClick={() => map.locate()}
        className="absolute bottom-20 right-4 z-[400] bg-white/80 backdrop-blur-lg p-2.5 rounded-2xl shadow-xl border border-white/20 text-blue-600 hover:bg-white transition-all active:scale-90"
        title="Mi Ubicación"
    >
        <MapPin className="w-5 h-5" />
    </button>
  );
}
