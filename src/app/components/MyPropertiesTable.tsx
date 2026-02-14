'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { calculateProfitabilityForList, getHealthLabel } from '@/lib/financial-utils';
import { Building2, MapPin, TrendingUp, DollarSign, Calendar, ChevronLeft, ChevronRight, ArrowUpDown, Filter, Edit2, Trash2, Target, Map as MapIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { publishProperty, deleteProperty } from '@/app/actions/property';
import { toast } from 'sonner';

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
  area_total: number;
  area_built: number;
  assigned_advisor_id: string | null;
  assigned_advisor?: {
    full_name: string | null;
    verification_status: string;
  } | null;
}

const PAGE_SIZE = 10;

export default function MyPropertiesTable({ userId }: { userId: string }) {
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<'profitability' | 'created_at' | 'sale_price' | 'price_m2'>('profitability');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<string>('all');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

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
        `, { count: 'exact' })
        .eq('user_id', userId);

      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }

      const { data, count, error } = await query
        .order(sortBy === 'price_m2' ? 'sale_price' : sortBy, { ascending: sortOrder === 'asc' })
        .range(from, to);

      if (error) {
        console.error('Error fetching properties:', error);
      } else {
        setProperties(data as SavedProperty[]);
        if (count !== null) setTotalCount(count);
      }
      setLoading(false);
    };

    fetchProperties();
  }, [userId, supabase, page, sortBy, sortOrder, filterType]);

  const handlePublish = async (propertyId: string) => {
    setPublishingId(propertyId);
    try {
        const result = await publishProperty(propertyId);
        if (result.error === 'SUBSCRIPTION_REQUIRED') {
            if (confirm('Debes tener una membresía activa para publicar. ¿Deseas ver los planes?')) {
                router.push('/pricing');
            }
        } else if (result.error) {
            toast.error('Error al publicar la propiedad');
        } else {
            // Reload to show changes (assigned advisor etc)
            window.location.reload();
        }
    } catch (e) {
        console.error(e);
        toast.error('Error inesperado');
    } finally {
        setPublishingId(null);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (loading && properties.length === 0) return <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2"><div className="animate-spin h-5 w-5 border-2 border-indigo-500 rounded-full border-t-transparent"></div> Cargando tus propiedades...</div>;

  if (!loading && properties.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-12 bg-white rounded-3xl border border-gray-100 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="h-10 w-10 text-blue-600 animate-pulse" />
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">Tu portafolio comienza aquí</h3>
        <p className="text-gray-700 max-w-md mx-auto mb-8 font-bold">
            Analiza tu primera inversión o publica tu propiedad para encontrar al comprador ideal. HouseApp te guía en cada paso.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
                onClick={() => router.push('/calculator')}
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-700 !text-white font-black rounded-2xl hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
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
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters and Controls */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Left: Filter */}
          <div className="relative w-full sm:w-64 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
            </div>
            <select 
              className="block w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-white cursor-pointer appearance-none"
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            >
              <option value="all">Todas las propiedades</option>
              <option value="house">Casas</option>
              <option value="apartment">Apartamentos</option>
              <option value="land">Lotes / Terrenos</option>
              <option value="commercial">Locales Comerciales</option>
              <option value="warehouse">Bodegas</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronRight className="h-4 w-4 text-gray-400 rotate-90" />
            </div>
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
                      <option value="profitability">Mayor Rentabilidad</option>
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

      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Propiedad</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ubicación</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Registrado</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Precio Venta</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Alquiler Est.</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Rentabilidad</th>
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
                              <div className="h-full w-full rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                  <Building2 className="h-5 w-5" />
                              </div>
                          )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{property.title || 'Propiedad sin título'}</div>
                        <div className="text-xs text-gray-500 capitalize">{property.type}</div>
                        
                        {/* Status Tags */}
                        {property.is_listed ? (
                            <div className="mt-1 flex items-center gap-2">
                                <span className="px-2 inline-flex text-[10px] leading-4 font-semibold rounded-full bg-green-100 text-green-800">
                                    En Venta
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
                                    {property.purpose === 'sale' ? 'Publicar Ahora' : 'Vender con Éxito'}
                                </>
                            )}
                        </button>
                             </div>
                        )}
                        
                        {/* Edit / Delete Actions */}
                        <div className="mt-2 flex items-center gap-2">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/my-properties/${property.id}/edit`);
                                }}
                                className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                title="Editar"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button 
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if(confirm('¿Estás seguro de eliminar esta propiedad?')) {
                                        await deleteProperty(property.id);
                                        // Simple reload or state update. Since it's server action with revalidatePath, 
                                        // router.refresh() might be needed or just refetch.
                                        // For now let's use window.location.reload() to be sure or filter local state
                                        setProperties(prev => prev.filter(p => p.id !== property.id));
                                    }
                                }}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                title="Eliminar"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => router.push(`/my-properties/${property.id}`)}>
                    <div className="flex items-center text-sm text-gray-700">
                      <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-500" aria-hidden="true" />
                      <span className="truncate max-w-[150px]">{property.address}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => router.push(`/my-properties/${property.id}`)}>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <span className="capitalize">{timeAgo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 cursor-pointer" onClick={() => router.push(`/my-properties/${property.id}`)}>
                    <div>
                        ${property.sale_price.toLocaleString()}
                        <div className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                            ${(property.sale_price / (property.area_total || property.area_built || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}/m²
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 cursor-pointer" onClick={() => router.push(`/my-properties/${property.id}`)}>
                    ${property.rent_price.toLocaleString()}/mes
                  </td>
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
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
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
    </div>
  );
}
