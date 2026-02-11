import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Building2, MapPin, BedDouble, Bath, Car, Maximize, DollarSign, Calendar } from 'lucide-react';
import { calculateProfitabilityForList, getHealthLabel } from '@/lib/financial-utils';
import PropertyMapWrapper from '@/app/components/PropertyMapWrapper';

interface PropertyDetail {
  id: number;
  title: string | null;
  address: string;
  type: string;
  m2: number;
  rooms: number;
  bathrooms: number;
  has_garage: boolean;
  sale_price: number;
  rent_price: number;
  images: string[] | null;
  cover_image: string | null;
  contact_phone: string | null;
  created_at: string;
  lat?: number;
  lon?: number;
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: property, error } = await supabase
    .from('datahouse')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !property) {
    notFound();
  }

  const p = property as PropertyDetail;
  const { netReturn, health } = calculateProfitabilityForList(p.sale_price, p.rent_price);
  const healthStyle = getHealthLabel(health);

  // Combine cover image and other images for gallery
  let allImages = p.images || [];
  if (p.cover_image && !allImages.includes(p.cover_image)) {
    allImages = [p.cover_image, ...allImages];
  }
  // If no images at all, use placeholder
  const hasImages = allImages.length > 0;

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      {/* Header / Navigation */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link href="/my-properties" className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900 truncate">
            {p.title || p.address}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-96 md:h-[500px]">
           {/* Main Image */}
           <div className={`relative rounded-2xl overflow-hidden shadow-lg ${hasImages ? (allImages.length > 1 ? 'md:col-span-3' : 'md:col-span-4') : 'md:col-span-4 bg-gray-200 flex items-center justify-center'}`}>
                {hasImages ? (
                    <Image 
                        src={allImages[0]} 
                        alt="Vista principal" 
                        fill 
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="flex flex-col items-center text-gray-400">
                        <Building2 size={64} />
                        <span className="mt-2 text-sm">Sin imágenes disponibles</span>
                    </div>
                )}
           </div>

           {/* Secondary Images (Side Column) */}
           {allImages.length > 1 && (
               <div className="hidden md:flex flex-col gap-4 h-full">
                   {allImages.slice(1, 4).map((img, idx) => (
                       <div key={idx} className="relative flex-1 rounded-xl overflow-hidden shadow">
                           <Image 
                               src={img} 
                               alt={`Vista ${idx + 2}`} 
                               fill 
                               className="object-cover hover:scale-110 transition-transform duration-500"
                           />
                       </div>
                   ))}
                   {allImages.length > 4 && (
                       <div className="relative flex-1 rounded-xl overflow-hidden shadow bg-gray-900 flex items-center justify-center text-white font-bold cursor-pointer hover:bg-gray-800 transition-colors">
                           +{allImages.length - 4} fotos
                       </div>
                   )}
               </div>
           )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Key Info Cards */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Building2 className="text-blue-600" />
                        Detalles de la Propiedad
                    </h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
                            <BedDouble className="w-6 h-6 text-gray-500 mb-2" />
                            <span className="text-xl font-bold text-gray-900">{p.rooms}</span>
                            <span className="text-xs text-gray-500">Habitaciones</span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
                            <Bath className="w-6 h-6 text-gray-500 mb-2" />
                            <span className="text-xl font-bold text-gray-900">{p.bathrooms}</span>
                            <span className="text-xs text-gray-500">Baños</span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
                            <Maximize className="w-6 h-6 text-gray-500 mb-2" />
                            <span className="text-xl font-bold text-gray-900">{p.m2}</span>
                            <span className="text-xs text-gray-500">m²</span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
                            <Car className={`w-6 h-6 mb-2 ${p.has_garage ? 'text-blue-500' : 'text-gray-300'}`} />
                            <span className="text-xl font-bold text-gray-900">{p.has_garage ? 'Sí' : 'No'}</span>
                            <span className="text-xs text-gray-500">Garage</span>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <span className="text-sm text-gray-500 block mb-1">Dirección</span>
                            <div className="flex items-start gap-2 text-gray-900 font-medium">
                                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                                {p.address}
                            </div>
                        </div>
                        <div>
                             <span className="text-sm text-gray-500 block mb-1">Tipo</span>
                             <span className="capitalize px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
                                {p.type === 'house' ? 'Casa' : p.type === 'apartment' ? 'Apartamento' : p.type}
                             </span>
                        </div>
                         {p.contact_phone && (
                            <div className="md:col-span-2">
                                <span className="text-sm text-gray-500 block mb-1">Contacto</span>
                                <span className="text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                                    {p.contact_phone}
                                </span>
                            </div>
                         )}
                    </div>
                </div>

                {/* Map Section */}
                {(p.lat && p.lon) && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                         <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <MapPin className="text-blue-600" />
                            Ubicación
                        </h2>
                        <PropertyMapWrapper lat={p.lat} lng={p.lon} title={p.title || p.address} />
                    </div>
                )}
            </div>

            {/* Right Column: Financials */}
            <div className="space-y-6">
                
                {/* Price Card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
                    <p className="text-blue-100 text-sm mb-1">Precio de Venta</p>
                    <h3 className="text-3xl font-bold mb-6">${p.sale_price.toLocaleString()}</h3>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                            <span className="flex items-center gap-2 text-sm"><DollarSign size={16}/> Alquiler Estimado</span>
                            <span className="font-bold">${p.rent_price.toLocaleString()}/mes</span>
                        </div>
                        <div className={`flex items-center justify-between p-3 rounded-lg backdrop-blur-sm bg-white text-${healthStyle.color.split('-')[1]}-600`}>
                             <span className="flex items-center gap-2 text-sm font-medium">Retorno Neto Est.</span>
                             <span className="font-bold text-lg">{netReturn.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                {/* Health Badge */}
                <div className={`p-4 rounded-xl border flex items-center gap-4 ${healthStyle.bg} ${healthStyle.borderColor}`}>
                     <div className={`p-2 rounded-full bg-white ${healthStyle.color}`}>
                         {/* Icon could go here if managed dynamically */}
                         <Calendar className="w-6 h-6" /> 
                     </div>
                     <div>
                         <p className={`font-bold ${healthStyle.color}`}>{healthStyle.text}</p>
                         <p className="text-xs text-gray-600 mt-0.5">Basado en reglas de inversión estándar</p>
                     </div>
                </div>

                <div className="text-xs text-center text-gray-400">
                    Agregado el {new Date(p.created_at).toLocaleDateString()}
                </div>

            </div>
        </div>

      </div>
    </main>
  );
}
