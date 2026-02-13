import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Building2, TrendingUp, MapPin, Layers, X, Radar, DollarSign, Loader2, Save, Trash2, History, UserCircle, Mail } from 'lucide-react';
import { calculateProfitabilityForList, getHealthLabel } from '@/lib/financial-utils';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { getZoneStats, ZoneStats } from '@/app/actions/get-zone-stats';
import { getUserZones, createZone, deleteZone, Zone } from '@/app/actions/zone-actions';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@supabase/supabase-js';
import { getAdvisorContact } from '@/app/actions/contact';

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
};

function MapController({ onMapClick }: { onMapClick: (center: L.LatLng) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function PropertiesMap({ properties, user }: PropertiesMapProps) {
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
      alert('Error creating zone');
    } finally {
      setCreatingZone(false);
    }
  };

  const handleDeleteZone = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta zona?')) return;
    try {
      await deleteZone(id);
      await loadZones();
    } catch (error) {
      alert('Error deleting zone');
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
          alert('Esta propiedad no tiene un asesor asignado aún.');
          return;
      }
      
      setContactingId(propertyId);
      try {
          const contact = await getAdvisorContact(advisorId);
          if (contact.email) {
              window.location.href = `mailto:${contact.email}?subject=Interés en propiedad ${propertyId}&body=Hola, estoy interesado en recibir más información sobre esta propiedad.`;
          } else {
              alert('No se encontró información de contacto para este asesor.');
          }
      } catch (e) {
          console.error(e);
          alert('Error al contactar asesor.');
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
        
        <MapController onMapClick={handleMapClick} />
        <LocateControl autoLocate={!user} />

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
                    <div className="mb-2">
                      <h3 className="font-bold text-gray-900 leading-tight text-sm mb-0.5 line-clamp-1">
                        {property.title || 'Propiedad sin nombre'}
                      </h3>
                      <span className="text-xs text-gray-500 capitalize flex items-center gap-1">
                         <Building2 size={10} /> {property.type}
                      </span>
                    </div>

                    {/* Profitability Hero */}
                    <div className="bg-gray-50 rounded-lg p-2 mb-3 text-center border border-gray-100">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Retorno Neto (ROI)</p>
                        <div className={`text-lg font-extrabold flex items-center justify-center gap-1 ${healthStyle.color}`}>
                            <TrendingUp size={16} />
                            {netReturn.toFixed(1)}%
                        </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                        <p className="text-[10px] text-gray-400">Precio Venta</p>
                        <p className="font-semibold text-gray-700 text-sm">
                            ${(property.sale_price / 1000).toFixed(0)}k
                        </p>
                        </div>
                        <div>
                        <p className="text-[10px] text-gray-400">Renta Est.</p>
                        <p className="font-semibold text-gray-700 text-sm">
                            ${property.rent_price.toLocaleString()}
                        </p>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-1.5 text-xs text-gray-500 mb-3">
                        <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                        <span className="truncate leading-tight block w-full">{property.address}</span>
                    </div>

                    {/* Contact / Detail Action - ONLY FOR SALES */}
                    {!isInvestment && (
                        user ? (
                             <div className="mt-3 pt-2 border-t border-gray-100">
                                 <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                                    <UserCircle size={10} />
                                    Asesor: <span className="font-semibold text-gray-700">{property.assigned_advisor?.full_name?.split(' ')[0] || 'Asignado'}</span>
                                 </p>
                                 <button
                                    onClick={() => handleContactAdvisor(property.id, property.assigned_advisor_id)}
                                    disabled={contactingId === property.id}
                                    className="w-full py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1"
                                 >
                                    {contactingId === property.id ? <Loader2 className="animate-spin w-3 h-3" /> : <Mail className="w-3 h-3" />}
                                    Contactar Asesor
                                 </button>
                             </div>
                        ) : (
                            <div className="mt-3 pt-2 border-t border-gray-100">
                                <p className="text-[10px] text-gray-500 mb-1 italic text-center">
                                    Inicia sesión para contactar
                                </p>
                                <Link 
                                    href="/login" 
                                    className="block w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-center rounded text-xs font-bold transition-colors shadow-sm"
                                >
                                    Iniciar Sesión
                                </Link>
                            </div>
                        )
                    )}
                    
                    {/* Investment Notice */}
                    {isInvestment && (
                        <div className="mt-2 pt-2 border-t border-gray-100 text-center">
                             <p className="text-[10px] text-blue-600 font-semibold bg-blue-50 py-1 rounded">
                                 Solo visible para ti
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
      
      {/* Floating Action Button (Top-Left) - Only for Logged In Users */}
      <AnimatePresence>
      {!isAnalyzerOpen && user && (
        <motion.button 
           initial={{ scale: 0, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           exit={{ scale: 0, opacity: 0 }}
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
           onClick={handleOpenAnalyzer}
           className="absolute top-4 left-16 bg-white shadow-lg border border-gray-200 z-[400] py-2 px-4 rounded-full hover:bg-gray-50 text-gray-700 flex items-center gap-2 font-medium text-sm group"
        >
           <Layers className="text-blue-600 w-4 h-4" />
           <span>Radar de Precios</span>
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
            className="absolute top-4 left-16 z-[500] w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[calc(100%-2rem)]"
        >
             <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                <div className="flex items-center gap-2">
                    <Radar className="w-5 h-5" />
                    <h3 className="font-bold text-sm">Radar de Zona</h3>
                </div>
                <button onClick={() => setIsAnalyzerOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                    <X size={16} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                <button 
                    onClick={() => setActiveTab('radar')}
                    className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors ${activeTab === 'radar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                >
                    Análisis Rápido
                </button>
                <button 
                    onClick={() => setActiveTab('my-zones')}
                    className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors ${activeTab === 'my-zones' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                >
                    Mis Zonas
                </button>
            </div>
            
            <div className="p-4 overflow-y-auto">
                {activeTab === 'radar' ? (
                    <>
                        {/* Radar Content */}
                         <p className="text-xs text-gray-500 mb-4 bg-blue-50 p-2 rounded border border-blue-100">
                            <span className="font-bold">Click en el mapa</span> para definir el centro del análisis.
                        </p>

                        {/* Radius Slider */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-gray-700">Radio de búsqueda</label>
                                <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{radius} km</span>
                            </div>
                            <input 
                                type="range" 
                                min="0.5" 
                                max="10" 
                                step="0.5" 
                                value={radius} 
                                onChange={(e) => setRadius(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                <span>500m</span>
                                <span>10km</span>
                            </div>
                        </div>

                         {/* Save Zone CTA - Only if logged in */}
                         {user ? (
                             <div className="mb-6 flex gap-2">
                                <input 
                                   type="text"
                                   placeholder="Nombre para guardar zona..."
                                   value={newZoneName}
                                   onChange={(e) => setNewZoneName(e.target.value)}
                                   className="flex-1 text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button 
                                   onClick={handleCreateZone}
                                   disabled={creatingZone || !newZoneName.trim()}
                                   className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                   {creatingZone ? <Loader2 className="animate-spin w-3 h-3" /> : <Save className="w-3 h-3" />}
                                   Guardar
                                </button>
                           </div>
                         ) : (
                             <p className="text-xs text-center text-gray-500 mb-6 italic">Inicia sesión para guardar zonas</p>
                         )}

                        {/* Results */}
                        {loadingStats ? (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                <Loader2 className="w-6 h-6 animate-spin mb-2 text-blue-500" />
                                <span className="text-xs">Calculando...</span>
                            </div>
                        ) : stats ? (
                             <div className="space-y-4">
                                {stats.count > 0 ? (
                                    <>
                                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center">
                                            <p className="text-[10px] text-blue-600 font-semibold uppercase mb-1">Precio Promedio</p>
                                            <h4 className="text-xl font-bold text-gray-900">
                                                ${stats.averagePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </h4>
                                            <p className="text-[10px] text-gray-500 mt-1">
                                                {stats.count} propiedades en {radius}km
                                            </p>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-center">
                                                <p className="text-[10px] text-gray-500 mb-1">Precio m²</p>
                                                <p className="text-sm font-bold text-gray-900">
                                                    ${stats.averagePriceM2.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </p>
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-center">
                                                <p className="text-[10px] text-gray-500 mb-1">Rango</p>
                                                <p className="text-[10px] font-bold text-gray-900 mt-1">
                                                    ${(stats.minPrice/1000).toFixed(0)}k - ${(stats.maxPrice/1000).toFixed(0)}k
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-4 text-gray-400">
                                        <p className="text-xs">No hay propiedades en este radio. Haz click en otra zona.</p>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </>
                ) : (
                    <div className="space-y-4">
                        {/* My Zones List */}
                         {!user ? (
                            <div className="text-center py-8 text-gray-400">
                                <p className="text-sm font-medium mb-1">Inicia sesión</p>
                                <p className="text-xs">Para ver y gestionar tus zonas guardadas.</p>
                            </div>
                         ) : loadingZones ? (
                            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-500" /></div>
                        ) : zones.length > 0 ? (
                            zones.map(zone => (
                                <motion.div 
                                    key={zone.id} 
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div onClick={() => handleSelectZone(zone)} className="cursor-pointer flex-1">
                                            <h4 className="font-bold text-gray-800 text-sm">{zone.name}</h4>
                                            <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                                <Radar className="w-3 h-3" /> Radio: {zone.radius} km
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteZone(zone.id)}
                                            className="text-gray-400 hover:text-red-500 p-1"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {/* History Stats Snapshot */}
                                    {zone.last_history ? (
                                        <div className="bg-white rounded border border-gray-100 p-2 grid grid-cols-2 gap-2 mt-2">
                                            <div>
                                                <p className="text-[10px] text-gray-400">Precio Prom.</p>
                                                <p className="text-xs font-semibold">${zone.last_history.avg_price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400">Precio m²</p>
                                                <p className="text-xs font-semibold">${zone.last_history.avg_m2_price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-gray-400 italic mt-1 flex items-center gap-1">
                                            <History size={10} /> Sin historial (se calcula a la 1am)
                                        </p>
                                    )}
                                    
                                    <div className="flex gap-2 mt-2">
                                        <button 
                                            onClick={() => handleSelectZone(zone)}
                                            className="flex-1 py-1.5 text-[10px] font-bold text-blue-600 border border-blue-200 rounded hover:bg-blue-50 flex items-center justify-center gap-1"
                                        >
                                            <MapPin size={12} />
                                            Ver Mapa
                                        </button>
                                        <Link 
                                            href="/zone-stats"
                                            className="flex-1 py-1.5 text-[10px] font-bold text-gray-600 border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center gap-1"
                                        >
                                            <TrendingUp size={12} />
                                            Estadísticas
                                        </Link>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <p className="text-sm font-medium mb-1">No tienes zonas guardadas</p>
                                <p className="text-xs">Crea una zona en la pestaña "Análisis Rápido" para monitorear precios.</p>
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
          border-radius: 0.75rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        .leaflet-container {
            font-family: inherit;
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
        if (!autoLocate) alert('No pudimos acceder a tu ubicación. Por favor revisa los permisos.');
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
        className="absolute bottom-20 right-4 z-[400] bg-white p-2 rounded-lg shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
        title="Mi Ubicación"
    >
        <MapPin className="w-5 h-5 text-blue-600" />
    </button>
  );
}
