'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import dynamic from 'next/dynamic';
import { Building2, MapPin, BedDouble, Bath, Car, DollarSign, Calculator, AlertCircle, Upload, X, Star, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import FinancialDashboard from './FinancialDashboard';
import Tooltip from './Tooltip';
import { usePropertyProfitability } from '../hooks/usePropertyProfitability';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';

// Define Zod Schema
const propertySchema = z.object({
  title: z.string().optional(),
  contactPhone: z.string().optional(),
  propertyType: z.string().min(1, 'Selecciona un tipo de propiedad'),
  location: z.string().min(3, 'La ubicación es requerida (mín. 3 caracteres)'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  landArea: z.coerce.number().min(0, 'Debe ser mayor o igual a 0'),
  bedrooms: z.coerce.number().min(0, 'Debe ser mayor o igual a 0'),
  bathrooms: z.coerce.number().min(0, 'Debe ser mayor o igual a 0'),
  hasGarage: z.boolean().optional(),
  purchasePrice: z.coerce.number().min(1, 'El precio debe ser mayor a 0'),
  estimatedRent: z.coerce.number().min(1, 'El alquiler debe ser mayor a 0'),
  ibi: z.coerce.number().min(0).default(0),
  community: z.coerce.number().min(0).default(0),
  insurance: z.coerce.number().min(0).default(0),
  vacancyMonths: z.coerce.number().min(0).max(12, 'Máximo 12 meses').default(0),
});

type PropertyFormData = z.infer<typeof propertySchema>;

export default function PropertyForm({ user }: { user: User | null }) {
  const supabase = createClient();
  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue, 
    formState: { errors } 
  } = useForm({
    resolver: zodResolver(propertySchema),
    defaultValues: {
        ibi: 0,
        community: 0,
        insurance: 0,
        vacancyMonths: 0,
        hasGarage: false
    }
  });

  const { result, calculateProfitability, resetResult } = usePropertyProfitability();
  const [isExpertMode, setIsExpertMode] = useState(false);
  
  // Image handling state
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    
    // Validate total images
    if (selectedImages.length + newFiles.length > 5) {
      alert('Máximo 5 imágenes permitidas');
      return;
    }

    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    
    setSelectedImages(prev => [...prev, ...newFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const newImages = [...selectedImages];
    const newPreviews = [...previewUrls];
    
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(newPreviews[index]);
    
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setSelectedImages(newImages);
    setPreviewUrls(newPreviews);
    
    // Adjust cover index if needed
    if (index === coverIndex) {
      setCoverIndex(0);
    } else if (index < coverIndex) {
      setCoverIndex(prev => prev - 1);
    }
  };

  const setCover = (index: number) => {
    setCoverIndex(index);
  };

  // Dynamically import LocationPicker to avoid SSR issues with Leaflet
  const LocationPicker = useMemo(() => dynamic(
    () => import('./LocationPicker'),
    { 
      loading: () => <p className="p-4 text-center text-gray-500">Cargando mapa...</p>,
      ssr: false 
    }
  ), []);

  const onLocationSelect = (lat: number, lng: number) => {
    setValue('latitude', lat);
    setValue('longitude', lng);
  };

  const onSubmit = async (data: PropertyFormData) => {
    calculateProfitability({
      purchasePrice: Number(data.purchasePrice),
      estimatedRent: Number(data.estimatedRent),
      expenses: {
        ibi: Number(data.ibi),
        community: Number(data.community),
        insurance: Number(data.insurance),
        vacancyMonths: Number(data.vacancyMonths),
      }
    });

    setIsUploading(true);
    try {
      if (user) {
        // Upload images first
        const uploadedUrls: string[] = [];
        
        for (const file of selectedImages) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('property-images')
            .getPublicUrl(filePath);

          uploadedUrls.push(publicUrl);
        }

        // Determine cover image
        let coverImageUrl = null;
        if (uploadedUrls.length > 0) {
            // If cover index is valid, use it. Otherwise use first image.
            const coverIdx = coverIndex < uploadedUrls.length ? coverIndex : 0;
            coverImageUrl = uploadedUrls[coverIdx];
        }

        const dataToSave =  {
              type: data.propertyType,
              address: data.location,
              lat: data.latitude,
              lon: data.longitude,
              m2: Number(data.landArea),
              rooms: Number(data.bedrooms),
              bathrooms: Number(data.bathrooms),
              has_garage: data.hasGarage || false,
              sale_price: Number(data.purchasePrice),
              rent_price: Number(data.estimatedRent),
              title: data.title || null,
              contact_phone: data.contactPhone || null,
              user_id: user.id, // Associate property with logged-in user
              images: uploadedUrls,
              cover_image: coverImageUrl
            }
       
        const { error } = await supabase
          .from('datahouse')
          .insert([dataToSave]);

        if (error) {
          console.error('Error saving data to Supabase:', error);
          alert('Error al guardar la propiedad. Por favor intenta de nuevo.');
        } else {
          console.log('Data saved successfully to Supabase');
          // Reset form and images
          reset();
          setSelectedImages([]);
          setPreviewUrls([]);
          setCoverIndex(0);
          alert('Propiedad guardada exitosamente!');
        }
      }
    } catch (err) {
      console.error('Unexpected error saving data:', err);
      alert('Ocurrió un error inesperado.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    reset();
    resetResult();
    setSelectedImages([]);
    setPreviewUrls([]);
    setCoverIndex(0);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 sm:p-6 text-white">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Calculator className="w-5 h-5 sm:w-6 sm:h-6" />
          Estimadora de Inversiones
        </h2>
        <p className="text-blue-100 mt-1">Descubre si esta propiedad hará crecer tu dinero.</p>
      </div>

      <div className="p-4 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          
          {user && (
            <>
            <div className="space-y-4 sm:space-y-6 mb-6 pb-6 border-b border-gray-100">
               <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                 Información Básica
               </h3>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Title (Optional) */}
                <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-700">Título (Opcional)</label>
                 <input
                   type="text"
                   {...register('title')}
                   placeholder="Ej. Casa moderna en centro histórico"
                   className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900"
                 />
               </div>

                {/* Contact Phone (Optional) */}
                <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-700">Teléfono de Contacto (Opcional)</label>
                 <input
                   type="tel"
                   {...register('contactPhone')}
                   placeholder="+52 555 123 4567"
                   className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900"
                 />
               </div>
            </div>
          </div>
          

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Property Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Building2 className="w-4 h-4 text-gray-500" />
                Tipo de Propiedad
              </label>
              <select
                {...register('propertyType')}
                className={`w-full rounded-lg border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900 ${errors.propertyType ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="house">Casa</option>
                <option value="apartment">Apartamento</option>
                <option value="commercial">Local Comercial</option>
                <option value="land">Terreno</option>
              </select>
              {errors.propertyType && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={12} className="mr-1"/>{errors.propertyType.message}</p>}
            </div>

             {/* Location */}
             <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-500" />
                Ubicación
              </label>
              <input
                type="text"
                {...register('location')}
                placeholder="Ej. Centro de la ciudad"
                className={`w-full rounded-lg border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900 ${errors.location ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.location && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={12} className="mr-1"/>{errors.location.message}</p>}
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
             <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                 <ImageIcon className="w-5 h-5 text-blue-600" />
                 Imágenes de la Propiedad
             </h3>
             <p className="text-sm text-gray-500">
                 Sube hasta 5 fotos. La imagen marcada con estrella será la portada.
             </p>
             
             {/* Upload Area */}
             <div className="flex flex-col gap-4">
                 {selectedImages.length < 5 && (
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                <p className="text-sm text-gray-500 font-semibold">Haz clic para subir imágenes</p>
                                <p className="text-xs text-gray-500">PNG, JPG (Máx. 5)</p>
                            </div>
                            <input 
                                type="file" 
                                className="hidden" 
                                multiple 
                                accept="image/*"
                                onChange={handleImageChange}
                                disabled={selectedImages.length >= 5}
                            />
                        </label>
                    </div>
                 )}

                 {/* Previews Grid */}
                 {previewUrls.length > 0 && (
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                         <AnimatePresence>
                         {previewUrls.map((url, index) => (
                             <motion.div 
                                key={url} // Use URL as key
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                layout
                                className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all ${index === coverIndex ? 'border-yellow-400 ring-2 ring-yellow-400 ring-offset-2' : 'border-gray-200'}`}
                             >
                                 <Image 
                                     src={url} 
                                     alt={`Preview ${index}`} 
                                     fill 
                                     className="object-cover"
                                 />
                                 
                                 {/* Overlay Actions */}
                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                     <div className="flex justify-end">
                                         <button
                                             type="button"
                                             onClick={() => removeImage(index)}
                                             className="p-1 bg-white/90 rounded-full text-red-500 hover:bg-white transition-colors"
                                             title="Eliminar"
                                         >
                                             <X size={14} />
                                         </button>
                                     </div>
                                     <div className="flex justify-center">
                                         <button
                                             type="button"
                                             onClick={() => setCover(index)}
                                             className={`p-1.5 rounded-full backdrop-blur-sm transition-all ${index === coverIndex ? 'bg-yellow-400 text-white' : 'bg-white/30 text-white hover:bg-yellow-400'}`}
                                             title={index === coverIndex ? "Portada actual" : "Establecer como portada"}
                                         >
                                             <Star size={16} fill={index === coverIndex ? "currentColor" : "none"} />
                                         </button>
                                     </div>
                                 </div>
                                 
                                 {index === coverIndex && (
                                     <div className="absolute top-2 left-2 bg-yellow-400 text-xs font-bold px-2 py-0.5 rounded-md shadow-sm text-white">
                                         PORTADA
                                     </div>
                                 )}
                             </motion.div>
                         ))}
                         </AnimatePresence>
                     </div>
                 )}
             </div>
          </div>

          {/* Map Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gray-500" />
              Seleccionar Ubicación en Mapa
            </label>
            <div className="h-[300px] w-full border border-gray-300 rounded-lg overflow-hidden relative z-0">
                <LocationPicker onLocationSelect={onLocationSelect} />
            </div>
            {/* Hidden Inputs for Zod Registration */}
            <input type="hidden" {...register('latitude')} />
            <input type="hidden" {...register('longitude')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
             {/* Land Area */}
             <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Superficie Terreno</label>
              <div className="relative">
                <input
                  type="number"
                  {...register('landArea')}
                  className={`w-full rounded-lg border p-2.5 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900 ${errors.landArea ? 'border-red-500' : 'border-gray-300'}`}
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">m²</span>
              </div>
              {errors.landArea && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={12} className="mr-1"/>{errors.landArea.message}</p>}
            </div>

            {/* Garage */}
            <div className="flex items-center space-x-3 pt-8">
                <input
                    type="checkbox"
                    id="hasGarage"
                    {...register('hasGarage')}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="hasGarage" className="text-sm font-medium text-gray-700 flex items-center gap-1 select-none cursor-pointer">
                    <Car className="w-4 h-4 text-gray-500" />
                    Tiene Garage
                </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Bedrooms */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <BedDouble className="w-4 h-4 text-gray-500" />
                Habitaciones
              </label>
              <input
                type="number"
                {...register('bedrooms')}
                className={`w-full rounded-lg border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900 ${errors.bedrooms ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.bedrooms && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={12} className="mr-1"/>{errors.bedrooms.message}</p>}
            </div>

            {/* Bathrooms */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Bath className="w-4 h-4 text-gray-500" />
                Baños
              </label>
              <input
                type="number"
                {...register('bathrooms')}
                className={`w-full rounded-lg border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900 ${errors.bathrooms ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.bathrooms && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={12} className="mr-1"/>{errors.bathrooms.message}</p>}
            </div>
          </div>
            </>
          )}

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Datos Financieros
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Precio de Compra</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                        <input
                            type="number"
                            {...register('purchasePrice')}
                            className={`w-full rounded-lg border p-2.5 pl-7 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 text-gray-900 ${errors.purchasePrice ? 'border-red-500' : 'border-gray-300'}`}
                        />
                    </div>
                    {errors.purchasePrice && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={12} className="mr-1"/>{errors.purchasePrice.message}</p>}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Alquiler Mensual Estimado</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                        <input
                            type="number"
                            {...register('estimatedRent')}
                            className={`w-full rounded-lg border p-2.5 pl-7 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 text-gray-900 ${errors.estimatedRent ? 'border-red-500' : 'border-gray-300'}`}
                        />
                    </div>
                    {errors.estimatedRent && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={12} className="mr-1"/>{errors.estimatedRent.message}</p>}
                </div>
            </div>

          </div>

            {/* Expert Mode Toggle */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-6">
               <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Modo Experto</span>
                  <Tooltip text="Desglosa gastos detallados (IBI, comunidad, seguros) para un cálculo de retorno neto preciso." />
               </div>
               <button
                  type="button"
                  onClick={() => setIsExpertMode(!isExpertMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isExpertMode ? 'bg-indigo-600' : 'bg-gray-200'}`}
               >
                  <span
                    className={`${
                      isExpertMode ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
               </button>
            </div>

            {/* Expert Inputs */}
            <AnimatePresence>
            {isExpertMode && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-gray-50 p-4 rounded-lg border border-gray-100 mt-4 overflow-hidden"
                >
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            IBI / Predial (Anual)
                            <Tooltip text="Impuesto anual obligatorio. Ej: $200-$800/año." />
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                            <input
                                type="number"
                                {...register('ibi')}
                                className="w-full rounded-lg border-gray-300 border p-2.5 pl-7 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            Comunidad (Mensual)
                            <Tooltip text="Cuota de mantenimiento. Ej: $50-$150/mes." />
                        </label>
                        <div className="relative">
                             <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                            <input
                                type="number"
                                {...register('community')}
                                className="w-full rounded-lg border-gray-300 border p-2.5 pl-7 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            Seguro Hogar (Anual)
                            <Tooltip text="Protección contra daños. Ej: $200-$400/año." />
                        </label>
                        <div className="relative">
                             <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                            <input
                                type="number"
                                {...register('insurance')}
                                className="w-full rounded-lg border-gray-300 border p-2.5 pl-7 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            Vacancia (Meses/Año)
                            <Tooltip text="Meses sin inquilino. Ej: 1 mes/año es estándar." />
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            {...register('vacancyMonths')}
                            className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                </motion.div>
            )}
            </AnimatePresence>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors order-2 sm:order-1"
            >
              Limpiar
            </button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg hover:shadow-xl order-1 sm:order-2"
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </span>
              ) : (
                'Calcular y Guardar'
              )}
            </motion.button>
          </div>
        </form>

        {result && (
          <FinancialDashboard result={result} />
        )}
      </div>
    </div>
  );
}
