'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { calculateProfitabilityForList, getHealthLabel } from '@/lib/financial-utils';
import { Building2, MapPin, TrendingUp, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Use same type as DB or define new interface
interface SavedProperty {
  id: number;
  title: string | null;
  address: string;
  type: string;
  sale_price: number;
  rent_price: number;
  created_at: string;
  cover_image: string | null;
}

export default function MyPropertiesTable({ userId }: { userId: string }) {
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase
        .from('datahouse')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching properties:', error);
      } else {
        setProperties(data as SavedProperty[]);
      }
      setLoading(false);
    };

    fetchProperties();
  }, [userId, supabase]);

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando tus propiedades...</div>;

  if (properties.length === 0) {
    return (
      <div className="text-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No hay propiedades guardadas</h3>
        <p className="mt-1 text-sm text-gray-500">Comienza a buscar y guardar propiedades para verlas aquí.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propiedad</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Venta</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Alquiler Est.</th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rentabilidad</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {properties.map((property) => {
            const { netReturn, health } = calculateProfitabilityForList(property.sale_price, property.rent_price);
            const healthStyle = getHealthLabel(health);

            return (
              <tr 
                key={property.id} 
                onClick={() => router.push(`/my-properties/${property.id}`)}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 relative rounded-full overflow-hidden bg-blue-100 text-blue-600 flex items-center justify-center">
                      {property.cover_image ? (
                         <Image 
                            src={property.cover_image} 
                            alt={property.title || 'Propiedad'} 
                            fill
                            className="object-cover"
                         />
                      ) : (
                        <Building2 className="h-5 w-5" />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{property.title || 'Propiedad sin título'}</div>
                      <div className="text-xs text-gray-500 capitalize">{property.type}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                    <span className="truncate max-w-[150px]">{property.address}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                  ${property.sale_price.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                  ${property.rent_price.toLocaleString()}/mes
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${healthStyle.bg} ${healthStyle.color} ${healthStyle.borderColor}`}>
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {netReturn.toFixed(1)}% ({healthStyle.text})
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
