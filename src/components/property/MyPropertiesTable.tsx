'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { calculateProfitabilityForList, getHealthLabel } from '@/lib/financial-utils';
import { Building2, MapPin, TrendingUp, DollarSign, Calendar, ChevronLeft, ChevronRight, ArrowUpDown, Filter, Edit2, Trash2, Target, Map as MapIcon, MoreVertical, ExternalLink, Eye, Share2, PauseCircle, PlayCircle, AlertTriangle, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { publishProperty, deleteProperty, pauseProperty } from '@/app/actions/property';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { logClientError } from '@/lib/logger-client';

interface SavedProperty {
  id: string;
  title: string | null;
  address: string;
  type: string;
  purpose: 'sale' | 'investment';
  sale_price: number;
  rent_price: number;
  profitability: number;
  created_at: string;
  cover_image: string | null;
  is_listed: boolean;
  listing_status?: string;
  area_total: number;
  area_built: number;
  view_count: number;
  assigned_advisor_id: string | null;
  assigned_advisor?: {
    full_name: string | null;
    verification_status: string;
  } | null;
}

const PAGE_SIZE = 10;

export default function MyPropertiesTable({ 
  userId, 
  viewMode = 'owner' 
}: { 
  userId: string, 
  viewMode?: 'owner' | 'advisor' 
}) {
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<'profitability' | 'created_at' | 'sale_price' | 'price_m2' | 'view_count'>(viewMode === 'advisor' ? 'created_at' : 'profitability');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPurpose, setFilterPurpose] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);
  
  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      confirmText: string;
      cancelText: string;
      type: 'danger' | 'info';
      onConfirm: () => Promise<void>;
  }>({
      isOpen: false,
      title: '',
      message: '',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      type: 'info',
      onConfirm: async () => {},
  });
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('properties')
        .select(`
            *,
            assigned_advisor:assigned_advisor_id (
                full_name,
                verification_status
            )
        `, { count: 'exact' });

      if (viewMode === 'advisor') {
        const { data: leads } = await supabase
            .from('leads')
            .select('property_id')
            .eq('advisor_id', userId);
        
        const leadPropertyIds = leads ? Array.from(new Set(leads.map(l => l.property_id).filter(Boolean))) : [];
        let orQuery = `assigned_advisor_id.eq.${userId},user_id.eq.${userId}`;
        if (leadPropertyIds.length > 0) {
            orQuery += `,id.in.(${leadPropertyIds.join(',')})`;
        }
        query = query.or(orQuery);
      } else {
        query = query.eq('user_id', userId);
      }

      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }

      if (filterPurpose !== 'all') {
        query = query.eq('purpose', filterPurpose);
      }

      const trimmedSearch = debouncedSearchQuery.trim();
      if (trimmedSearch) {
          // Ignoramos puntuación y acentos. Cambiamos vocales por "_" (comodín SQL a nivel de caracter)
          // para soportar búsquedas insensibles a tildes directo en Supabase ilike sin requerir extensiones.
          const cleanTextSearch = trimmedSearch
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
              .replace(/[aeiou]/gi, '_')
              .replace(/[^\w\s_]/gi, ' ')
              .trim()
              .replace(/\s+/g, '%');
          const numericQuery = parseFloat(trimmedSearch.replace(/[^0-9.-]+/g,""));
          let textSearch = `title.ilike.%${cleanTextSearch}%,address.ilike.%${cleanTextSearch}%`;
          
          if (!isNaN(numericQuery) && trimmedSearch.match(/\d/)) {
              textSearch += `,sale_price.eq.${numericQuery}`;
          }
          // Supabase allows chaining multiple filters but they act as ANDs. To do an OR across multiple columns we use .or()
          // We have to be careful if we already have an .or() for advisor assignments. The safest way is to chain them.
          query = query.or(textSearch);
      }

      const orderByColumn = sortBy === 'price_m2' ? 'sale_price' : sortBy;
      const { data, count, error } = await query
        .order(orderByColumn, { ascending: sortOrder === 'asc' })
        .range(from, to);

      if (error) {
        logClientError(error, 'MyPropertiesTable.fetchProperties', userId);
      } else {
        const propertiesData = data as SavedProperty[];
        
        // Fetch views if advisor
        if (viewMode === 'advisor' && propertiesData.length > 0) {
            const propertyIds = propertiesData.map(p => p.id);
            const { data: eventsData, error: eventsError } = await supabase
                .from('property_events')
                .select('property_id')
                .eq('event_type', 'view')
                .in('property_id', propertyIds);
                
            if (!eventsError && eventsData) {
                // Count occurrences
                const counts: Record<string, number> = {};
                eventsData.forEach(ev => {
                    counts[ev.property_id] = (counts[ev.property_id] || 0) + 1;
                });
                // Attach to property
                propertiesData.forEach(p => {
                    p.view_count = counts[p.id] || 0;
                });
            }
        }

        setProperties(propertiesData);
        if (count !== null) setTotalCount(count);
      }
      setLoading(false);
    };

    fetchProperties();
  }, [userId, supabase, page, sortBy, sortOrder, filterType, filterPurpose, debouncedSearchQuery]);

  const handlePublish = async (propertyId: string) => {
    setPublishingId(propertyId);
    try {
        const result = await publishProperty(propertyId);
        if (result.error === 'SUBSCRIPTION_REQUIRED') {
            if (confirm('Debes tener una membresía activa para publicar. ¿Deseas ver los planes?')) {
                router.push('/pricing');
            }
        } else if (result.error) {
            logClientError(result.error, 'MyPropertiesTable.handlePublish', userId, { propertyId });
        } else {
            // Reload to show changes (assigned advisor etc)
            window.location.reload();
        }
    } catch (e) {
        logClientError(e, 'MyPropertiesTable.handlePublish', userId, { propertyId });
    } finally {
        setPublishingId(null);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      {/* Filters and Controls */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Left: Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative group w-full sm:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Buscar (nombre, zona, precio)..."
                className="block w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-white uppercase tracking-tight"
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                }}
              />
            </div>

            <div className="relative group w-full sm:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              <select 
                className="block w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-white cursor-pointer appearance-none uppercase tracking-tight"
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              >
                <option value="all">Tipo de Propiedad</option>
                <option value="house">Casas</option>
                <option value="apartment">Apartamentos</option>
                <option value="land">Lotes / Terrenos</option>
                <option value="commercial">Locales Comerciales</option>
                <option value="warehouse">Bodegas</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <ChevronRight size={12} className="text-slate-400 rotate-90" />
              </div>
            </div>

            {viewMode !== 'advisor' && (
              <div className="relative group w-full sm:w-48">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Target className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </div>
                <select 
                  className="block w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-white cursor-pointer appearance-none uppercase tracking-tight"
                  value={filterPurpose}
                  onChange={(e) => { setFilterPurpose(e.target.value); setPage(1); }}
                >
                  <option value="all">Propósito</option>
                  <option value="sale">En Venta</option>
                  <option value="investment">Para Inversión</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <ChevronRight size={12} className="text-slate-400 rotate-90" />
                </div>
              </div>
            )}
          </div>

          {/* Right: Sort Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-sm font-medium text-gray-500 whitespace-nowrap hidden sm:block">Ordenar por:</span>
              
              <div className="flex items-center gap-2 w-full sm:w-auto bg-gray-50 p-1 rounded-xl border border-gray-200">
                  <select 
                      className="block w-full sm:w-48 bg-transparent border-0 py-1.5 pl-3 pr-8 text-gray-700 text-sm focus:ring-0 cursor-pointer font-medium"
                      value={sortBy}
                      onChange={(e) => { setSortBy(e.target.value as any); setPage(1); }}
                  >
                      {viewMode === 'advisor' ? (
                          <option value="created_at">Más Recientes</option>
                      ) : (
                          <option value="profitability">Mayor Rentabilidad</option>
                      )}
                      <option value="created_at">Más Recientes</option>
                      <option value="sale_price">Precio de Venta</option>
                      <option value="price_m2">Precio por m²</option>
                  </select>
                  
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>

                  <button 
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className={`p-1.5 rounded-lg transition-all ${sortOrder === 'asc' ? 'bg-indigo-100 text-indigo-600 rotate-180' : 'hover:bg-gray-200 text-gray-500'}`}
                    title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
                  >
                      <ArrowUpDown className="h-4 w-4" />
                  </button>
              </div>
          </div>

        </div>
      </div>

      {loading && properties.length === 0 ? (
        <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2"><div className="animate-spin h-5 w-5 border-2 border-indigo-500 rounded-full border-t-transparent"></div> Cargando tus propiedades...</div>
      ) : !loading && properties.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-12 bg-white rounded-3xl border border-gray-100 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="h-10 w-10 text-indigo-600 animate-pulse" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">
              {debouncedSearchQuery || filterType !== 'all' || filterPurpose !== 'all' ? 'No se encontraron resultados' : 'Tu portafolio comienza aquí'}
          </h3>
          <p className="text-gray-700 max-w-md mx-auto mb-8 font-bold">
              {debouncedSearchQuery || filterType !== 'all' || filterPurpose !== 'all' 
                  ? 'Intenta ajustar tus filtros o término de búsqueda para encontrar lo que buscas.' 
                  : 'Analiza tu primera inversión o publica tu propiedad para encontrar al comprador ideal. HouseApp te guía en cada paso.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                  onClick={() => router.push('/calculator')}
                  className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 !text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Analizar Inversión
              </button>
              <button 
                  onClick={() => router.push('/map')}
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 font-bold rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
              >
                  <MapIcon className="mr-2 h-5 w-5" />
                  Explorar el Mercado
              </button>
          </div>
        </motion.div>
      ) : (
        <>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
        <table className="min-w-full divide-y divide-slate-200 bg-white">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="w-[30%] px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Propiedad</th>
              <th scope="col" className="w-[20%] px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Ubicación</th>
              <th scope="col" className="w-[15%] px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Registrado</th>
              <th scope="col" className="w-[15%] px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Precio Venta</th>
              {viewMode !== 'advisor' && (
                <>
                  <th scope="col" className="w-[10%] px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Rentabilidad</th>
                </>
              )}
              {viewMode === 'advisor' && (
                <th scope="col" className="w-[10%] px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Vistas</th>
              )}
              <th scope="col" className="w-[10%] px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {properties.map((property, index) => {
              const netReturn = property.profitability || 0;
              const { health } = calculateProfitabilityForList(property.sale_price, property.rent_price); // Keep health for color logic for now
              const healthStyle = getHealthLabel(health);
              const timeAgo = formatDistanceToNow(new Date(property.created_at), { addSuffix: true, locale: es });

              return (
                <motion.tr 
                  key={property.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  // onClick={() => router.push(`/my-properties/${property.id}`)} // Disable row click if interfering with button, or handle propagation
                  className="hover:bg-gray-50 transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => router.push(`/my-properties/${property.id}`)}>
                    <div className="flex items-center">
                      <div className="relative h-10 w-10 flex-shrink-0">
                          {property.cover_image ? (
                              <Image 
                                  src={property.cover_image} 
                                  alt={property.title || 'Propiedad'} 
                                  fill
                                  className="object-cover rounded-full"
                              />
                          ) : (
                              <div className="h-full w-full rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                  <Building2 className="h-5 w-5" />
                              </div>
                          )}
                      </div>
                      <div className="ml-4 overflow-hidden">
                        <div className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{property.title || 'Propiedad sin título'}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{property.type}</div>
                        
                        {/* Status Tags */}
                        {property.is_listed ? (
                            <div className="mt-1 flex items-center gap-2">
                                <span className="px-2 inline-flex text-[10px] leading-4 font-semibold rounded-full bg-green-100 text-green-800">
                                    Activa
                                </span>
                                {property.assigned_advisor ? (
                                    <span className="text-[10px] text-gray-500">
                                        • Asesor: {property.assigned_advisor.full_name?.split(' ')[0]}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-yellow-600">
                                        • Buscando asesor...
                                    </span>
                                )}
                            </div>
                        ) : property.listing_status === 'paused' ? (
                            <div className="mt-1 flex items-center gap-2">
                                <span className="px-2 inline-flex text-[10px] leading-4 font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                    Pausada
                                </span>
                            </div>
                        ) : (
                             <div className="mt-1 flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePublish(property.id);
                                    }}
                                    disabled={publishingId === property.id}
                                    className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 hover:bg-indigo-100 transition-colors font-medium flex items-center gap-1"
                                >
                                    {publishingId === property.id ? '...' : (
                                        <>
                                            {property.purpose === 'sale' ? 'Publicar Venta' : 'Publicar Inversión'}
                                        </>
                                    )}
                                </button>
                             </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => router.push(`/my-properties/${property.id}`)}>
                    <div className="flex items-center text-xs font-bold text-slate-600">
                      <MapPin className="flex-shrink-0 mr-2 h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      <span className="truncate max-w-[180px]">{property.address}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => router.push(`/my-properties/${property.id}`)}>
                    <div className="flex items-center text-xs font-bold text-slate-400">
                      <Calendar className="flex-shrink-0 mr-2 h-3.5 w-3.5 text-slate-300" />
                      <span className="capitalize">{timeAgo}</span>
                    </div>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-right cursor-pointer" onClick={() => router.push(`/my-properties/${property.id}`)}>
                    <div>
                        <div className="text-sm font-black text-slate-900">${property.sale_price.toLocaleString()}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">
                            ${(property.sale_price / (property.area_total || property.area_built || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}/m²
                        </div>
                    </div>
                  </td>
                  {viewMode !== 'advisor' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-center cursor-pointer relative" onClick={() => router.push(`/my-properties/${property.id}`)}>
                        <div className="flex flex-col items-center gap-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${healthStyle.bg} ${healthStyle.color} ${healthStyle.borderColor}`}>
                            <TrendingUp className="mr-1 h-3 w-3" />
                            {netReturn.toFixed(1)}% ({healthStyle.text})
                            </span>
                            {netReturn >= 10 && (
                                <motion.span 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-tighter flex items-center gap-1 shadow-sm shadow-amber-200/50"
                                >
                                    <span className="animate-pulse">💎</span> Oportunidad Top
                                </motion.span>
                            )}
                        </div>
                      </td>
                    </>
                  )}
                  {viewMode === 'advisor' && (
                    <td className="px-6 py-4 whitespace-nowrap text-center cursor-pointer" onClick={() => router.push(`/my-properties/${property.id}`)}>
                        <div className="flex flex-col items-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-900 text-xs font-black border border-slate-100 shadow-sm group-hover:bg-white transition-colors">
                                <Eye size={12} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                {property.view_count || 0}
                            </span>
                        </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                        {viewMode === 'advisor' && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Logic for sharing would go here
                                    toast.success('Kit de Marketing generado para ' + (property.title || property.address));
                                }}
                                className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
                                title="Marketing Push"
                            >
                                <Share2 size={16} />
                            </button>
                        )}
                        
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                const menuHeight = 220;
                                const spaceBelow = window.innerHeight - rect.bottom;
                                
                                let topPosition = rect.bottom + 8;
                                // Flip up if close to bottom edge
                                if (spaceBelow < menuHeight) {
                                    topPosition = rect.top - menuHeight;
                                }

                                setMenuPosition({ 
                                    top: topPosition, 
                                    left: rect.right - 192 
                                });
                                setOpenMenuId(property.id);
                            }}
                            className={`p-2 rounded-xl transition-all border shadow-sm ${
                                openMenuId === property.id 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' 
                                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:shadow-md'
                            }`}
                            title="Más Acciones"
                        >
                            <MoreVertical size={16} />
                        </button>
                        
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{(page - 1) * PAGE_SIZE + 1}</span> a <span className="font-medium">{Math.min(page * PAGE_SIZE, totalCount)}</span> de{' '}
                <span className="font-medium">{totalCount}</span> resultados
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                {/* Simple page indicator for now */}
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {/* Action Menu Portal - Moved outside the loop */}
      {mounted && openMenuId && menuPosition && (() => {
          const activeProperty = properties.find(p => p.id === openMenuId);
          if (!activeProperty) return null;

          return createPortal(
              <>
                  <div 
                      className="fixed inset-0 z-[100]" 
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}
                  />
                  <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="fixed w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[110] py-2 overflow-hidden text-left"
                      style={{ 
                          top: `${menuPosition.top}px`, 
                          left: `${menuPosition.left}px` 
                      }}
                  >
                      <button 
                          onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/my-properties/${activeProperty.id}`);
                              setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                          <ExternalLink size={16} className="text-slate-400" />
                          Ver Detalles
                      </button>
                      <button 
                          onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/my-properties/${activeProperty.id}/edit`);
                              setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                          <Edit2 size={16} className="text-slate-400" />
                          Editar
                      </button>
                      
                      {activeProperty.purpose === 'sale' && (
                          <button 
                              onClick={async (e) => {
                                  e.stopPropagation();
                                  if (activeProperty.is_listed) {
                                      setConfirmModal({
                                          isOpen: true,
                                          title: '¿Pausar publicación?',
                                          message: 'La propiedad dejará de ser visible para los compradores, pero podrás reactivarla en cualquier momento.',
                                          confirmText: 'Si, pausar',
                                          cancelText: 'Cancelar',
                                          type: 'info',
                                          onConfirm: async () => {
                                                try {
                                                    await pauseProperty(activeProperty.id);
                                                    setProperties(prev => prev.map(p => p.id === activeProperty.id ? { ...p, is_listed: false } : p));
                                                    toast.success('Publicación pausada exitosamente');
                                                } catch (error) {
                                                    logClientError(error, 'MyPropertiesTable.pauseProperty', userId, { propertyId: activeProperty.id });
                                                }
                                          }
                                      });
                                      setOpenMenuId(null);
                                  } else {
                                      // Activate
                                      setOpenMenuId(null); // Close menu first
                                      handlePublish(activeProperty.id);
                                  }
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                              {activeProperty.is_listed ? <PauseCircle size={16} className="text-slate-400" /> : <PlayCircle size={16} className="text-slate-400" />}
                              {activeProperty.is_listed ? 'Pausar' : 'Publicar'}
                          </button>
                      )}
                      <div className="h-px bg-slate-100 my-1 mx-2"></div>
                      <button 
                          onClick={async (e) => {
                              e.stopPropagation();
                              setConfirmModal({
                                  isOpen: true,
                                  title: '¿Eliminar propiedad?',
                                  message: 'Esta acción no se puede deshacer. Se eliminará toda la información asociada a esta propiedad.',
                                  confirmText: 'Si, eliminar',
                                  cancelText: 'Cancelar',
                                  type: 'danger',
                                  onConfirm: async () => {
                                        try {
                                            await deleteProperty(activeProperty.id);
                                            setProperties(prev => prev.filter(p => p.id !== activeProperty.id));
                                            toast.success('Propiedad eliminada');
                                        } catch (error) {
                                            logClientError(error, 'MyPropertiesTable.deleteProperty', userId, { propertyId: activeProperty.id });
                                        }
                                  }
                              });
                              setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                      >
                          <Trash2 size={16} className="text-red-400" />
                          Eliminar
                      </button>
                  </motion.div>
              </>,
              document.body
          );
      })()}

      {/* Confirmation Modal */}
      {mounted && confirmModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
             onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
                <div className="p-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmModal.type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {confirmModal.type === 'danger' ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6">
                        {confirmModal.message}
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                            className="flex-1 px-4 py-2.5 bg-gray-50 text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                            {confirmModal.cancelText}
                        </button>
                        <button 
                            onClick={async () => {
                                await confirmModal.onConfirm();
                                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                            }}
                            className={`flex-1 px-4 py-2.5 font-bold rounded-xl text-white transition-all shadow-lg active:scale-95 ${
                                confirmModal.type === 'danger' 
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                            }`}
                        >
                            {confirmModal.confirmText}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
}
