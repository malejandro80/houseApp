'use client';

import { useState, useMemo, Dispatch, SetStateAction } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, MapPin, DollarSign, AlertTriangle, CheckCircle, 
  ArrowRight, ArrowLeft, Save, Upload, X, Loader2, Home, Briefcase, Warehouse, LandPlot 
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { propertyFormSchema, PropertyFormData } from '@/lib/schemas/propertySchema';
import Image from 'next/image';
import NumberInput from './NumberInput';
import { useRouter } from 'next/navigation';

import { updateProperty } from '@/app/actions/property';

export default function PropertyForm({ 
    user, 
    step, 
    setStep, 
    purpose = 'investment',
    initialData = null,
    isEditMode = false
}: { 
    user: User | null, 
    step: number, 
    setStep: Dispatch<SetStateAction<number>>, 
    purpose?: 'sale' | 'investment',
    initialData?: any,
    isEditMode?: boolean
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>(initialData?.images || []);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  
  const supabase = createClient();
  const router = useRouter();
  
  const { register, handleSubmit, watch, setValue, control, formState: { errors }, reset, trigger } = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema) as any,
    defaultValues: initialData ? {
      title: initialData.title,
      type: initialData.type,
      salePrice: initialData.sale_price,
      rentPrice: initialData.rent_price,
      areaTotal: initialData.area_total,
      areaBuilt: initialData.area_built,
      address: initialData.address,
      neighborhood: initialData.neighborhood,
      latitude: initialData.lat,
      longitude: initialData.lon,
      age: initialData.age,
      stratum: initialData.stratum,
      
      // Metadata
      rooms: initialData.metadata?.rooms,
      bathrooms: initialData.metadata?.bathrooms,
      parking: initialData.metadata?.parking,
      amenities: initialData.metadata?.amenities,
      landUse: initialData.metadata?.land_use,
      topography: initialData.metadata?.topography,
      frontage: initialData.metadata?.frontage,
      footTraffic: initialData.metadata?.foot_traffic,
      floorResistance: initialData.metadata?.floor_resistance,
      ceilingHeight: initialData.metadata?.ceiling_height,
      loadingDocks: initialData.metadata?.loading_docks,
      power: initialData.metadata?.power,

      // Risk
      legalStatus: initialData.legal_status,
      riskZone: initialData.risk_factors?.risk_zone,
      roadAffectation: initialData.risk_factors?.road_affectation,
      taxDebt: initialData.risk_factors?.tax_debt,
      heritage: initialData.risk_factors?.heritage

    } : {
      type: 'house',
      legalStatus: 'deed_ready',
      riskZone: false,
      roadAffectation: false,
      heritage: false
    }
  });

  const propertyType = watch('type');
  const salePrice = watch('salePrice');
  const rentPrice = watch('rentPrice');

  // Calculate Gross Yield
  const grossYield = useMemo(() => {
    if (!salePrice || !rentPrice) return 0;
    return ((rentPrice * 12) / salePrice) * 100;
  }, [salePrice, rentPrice]);

  const LocationPicker = useMemo(() => dynamic(
    () => import('./LocationPicker'),
    { ssr: false, loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" /> }
  ), []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    
    // Simple limit check
    if (selectedImages.length + newFiles.length > 5) {
        alert('Máximo 5 imágenes');
        return;
    }

    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setSelectedImages([...selectedImages, ...newFiles]);
    setPreviewUrls([...previewUrls, ...newPreviews]);
  };

  // State for step transition buffering
  const [isValidating, setIsValidating] = useState(false);

  const onSubmit = async (data: PropertyFormData) => {
    if (step < 3) return;

    if (!user) {
        alert('Debes iniciar sesión');
        return;
    }
    
    setIsUploading(true);
    try {
        // 1. Upload NEW Images
        const uploadedUrls: string[] = [];
        for (const file of selectedImages) {
            const fileName = `${user.id}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('property-images')
                .upload(fileName, file);
            
            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from('property-images')
                    .getPublicUrl(fileName);
                uploadedUrls.push(publicUrl);
            }
        }
        
        // Combine old images (if provided in initialData) with new ones
        // For simplicity in this edit flow, we are just appending new ones. 
        // A full implementation would allow deleting existing images.
        const finalImages = [...(initialData?.images || []), ...uploadedUrls];

        if (isEditMode && initialData) {
            // UPDATE
            const updatePayload = {
                title: data.title,
                type: data.type,
                sale_price: data.salePrice,
                rent_price: data.rentPrice,
                area_total: data.areaTotal,
                area_built: data.areaBuilt,
                address: data.address,
                neighborhood: data.neighborhood,
                lat: data.latitude,
                lon: data.longitude,
                age: data.age,
                stratum: data.stratum,
                
                // Metadata
                metadata: {
                    rooms: data.rooms,
                    bathrooms: data.bathrooms,
                    parking: data.parking,
                    amenities: data.amenities,
                    land_use: data.landUse,
                    topography: data.topography,
                    frontage: data.frontage,
                    foot_traffic: data.footTraffic,
                    floor_resistance: data.floorResistance,
                    ceiling_height: data.ceilingHeight,
                    loading_docks: data.loadingDocks,
                    power: data.power
                },

                // Risk
                legal_status: data.legalStatus,
                risk_factors: {
                    risk_zone: data.riskZone,
                    road_affectation: data.roadAffectation,
                    tax_debt: data.taxDebt,
                    heritage: data.heritage
                },
                
                images: finalImages,
                cover_image: finalImages[0] || null
            };

            const result = await updateProperty(initialData.id, updatePayload);
            if (result.error) throw new Error(result.error);
            
            router.push('/my-properties');
            router.refresh();

        } else {
            // INSERT (Existing Logic)
            const { error } = await supabase.from('properties').insert({
                user_id: user.id,
                title: data.title,
                type: data.type,
                sale_price: data.salePrice,
                rent_price: data.rentPrice,
                area_total: data.areaTotal,
                area_built: data.areaBuilt,
                address: data.address,
                neighborhood: data.neighborhood,
                lat: data.latitude,
                lon: data.longitude,
                age: data.age,
                stratum: data.stratum,
                purpose: purpose, 
                is_listed: false,
                
                // Metadata
                metadata: {
                    rooms: data.rooms,
                    bathrooms: data.bathrooms,
                    parking: data.parking,
                    amenities: data.amenities,
                    land_use: data.landUse,
                    topography: data.topography,
                    frontage: data.frontage,
                    foot_traffic: data.footTraffic,
                    floor_resistance: data.floorResistance,
                    ceiling_height: data.ceilingHeight,
                    loading_docks: data.loadingDocks,
                    power: data.power
                },

                // Risk
                legal_status: data.legalStatus,
                risk_factors: {
                    risk_zone: data.riskZone,
                    road_affectation: data.roadAffectation,
                    tax_debt: data.taxDebt,
                    heritage: data.heritage
                },
                
                images: finalImages,
                cover_image: finalImages[0] || null
            });

            if (error) throw error;

            // Redirect to list
            router.push('/my-properties');
            reset();
            setStep(1);
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar la propiedad');
    } finally {
        setIsUploading(false);
    }
  };

  const nextStep = async () => {
    if (isValidating) return;
    setIsValidating(true);
    
    let fields: (keyof PropertyFormData)[] = [];
    if (step === 1) {
        fields = ['title', 'salePrice', 'rentPrice', 'address'];
    } else if (step === 2) {
        fields = ['areaTotal', 'areaBuilt', 'age', 'stratum'];
    }

    const isValid = await trigger(fields);
    
    // Add small delay to prevent double-click accidental submission of next step
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (isValid) {
        setStep(s => Math.min(s + 1, 3));
    }
    setIsValidating(false);
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const variants = {
    enter: { x: 20, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      
      <form onSubmit={handleSubmit(onSubmit, (e) => console.log('Validation Errors:', e))} className="p-6">
            
            {/* STEP 1: BASIC INFO */}
            {step === 1 && (
                <motion.div
                    key="step1"
                    variants={variants}
                    initial="enter"
                    animate="center"
                    className="space-y-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-600">Título del Anuncio</label>
                            <input {...register('title')} className="w-full text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Casa en El Poblado" />
                            {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-600">Tipo de Inmueble</label>
                            <select {...register('type')} className="w-full text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="house">Casa</option>
                                <option value="apartment">Apartamento</option>
                                <option value="commercial">Local Comercial</option>
                                <option value="land">Lote / Terreno</option>
                                <option value="warehouse">Bodega / Galpón</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-600">Precio de Venta ($)</label>
                            <Controller
                                name="salePrice"
                                control={control}
                                render={({ field }) => (
                                    <NumberInput {...field} placeholder="0" className="w-full text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                                )}
                            />
                             {errors.salePrice && <p className="text-red-500 text-xs">{errors.salePrice.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-600">Renta Estimada Mensual ($)</label>
                            <Controller
                                name="rentPrice"
                                control={control}
                                render={({ field }) => (
                                    <NumberInput {...field} placeholder="0" className="w-full text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
                                )}
                            />
                        </div>
                    </div>

                    {/* Gross Yield Display */}
                    {(grossYield > 0) && (
                        <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-green-800 text-sm">Yield Bruto Estimado</h4>
                                <p className="text-xs text-green-600">Rentabilidad anual antes de gastos</p>
                            </div>
                            <span className="text-2xl font-extrabold text-green-700">{grossYield.toFixed(2)}%</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-600">Dirección Exacta</label>
                        <input {...register('address')} className="w-full text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Calle 123 #45-67" />
                        {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
                    </div>

                    <div className="h-64 border rounded-lg overflow-hidden relative">
                         <LocationPicker onLocationSelect={(lat, lng) => {
                             setValue('latitude', lat);
                             setValue('longitude', lng);
                         }} />
                         <input type="hidden" {...register('latitude')} />
                         <input type="hidden" {...register('longitude')} />
                    </div>
                </motion.div>
            )}

            {/* STEP 2: DETAILS */}
            {step === 2 && (
                <motion.div
                    key="step2"
                    variants={variants}
                    initial="enter"
                    animate="center"
                    className="space-y-6"
                >
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-600">Área Total (m²)</label>
                            <Controller
                                name="areaTotal"
                                control={control}
                                render={({ field }) => (
                                    <NumberInput {...field} placeholder="0" className="w-full text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg p-2.5 outline-none" />
                                )}
                            />
                            {errors.areaTotal && <p className="text-red-500 text-xs">{errors.areaTotal.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-600">Área Construida (m²)</label>
                            <Controller
                                name="areaBuilt"
                                control={control}
                                render={({ field }) => (
                                    <NumberInput {...field} placeholder="0" className="w-full text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg p-2.5 outline-none" />
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-600">Antigüedad (Años)</label>
                            <Controller
                                name="age"
                                control={control}
                                render={({ field }) => (
                                    <NumberInput {...field} placeholder="0" className="w-full text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg p-2.5 outline-none" />
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-600">Estrato (1-6)</label>
                            <Controller
                                name="stratum"
                                control={control}
                                render={({ field }) => (
                                    <NumberInput {...field} placeholder="3" className="w-full text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg p-2.5 outline-none" min={1} max={6} />
                                )}
                            />
                        </div>
                    </div>

                    {/* Dynamic Fields based on Type */}
                    {(propertyType === 'house' || propertyType === 'apartment') && (
                        <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-100">
                            <h4 className="font-semibold text-gray-700 flex items-center gap-2"><Home size={16}/> Detalles Residenciales</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-600">Habitaciones</label>
                                    <Controller name="rooms" control={control} render={({ field }) => <NumberInput {...field} placeholder="0" className="w-full text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg p-2" />} />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-600">Baños</label>
                                    <Controller name="bathrooms" control={control} render={({ field }) => <NumberInput {...field} placeholder="0" className="w-full text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg p-2" />} />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-600">Parqueaderos</label>
                                    <Controller name="parking" control={control} render={({ field }) => <NumberInput {...field} placeholder="0" className="w-full text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg p-2" />} />
                                </div>
                            </div>
                        </div>
                    )}

                    {propertyType === 'commercial' && (
                        <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-100">
                             <h4 className="font-semibold text-gray-700 flex items-center gap-2"><Briefcase size={16}/> Comercial</h4>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-600">Frente (mts)</label>
                                    <Controller name="frontage" control={control} render={({ field }) => <NumberInput {...field} placeholder="0" className="w-full text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg p-2" />} />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-600">Tráfico Peatonal</label>
                                    <select {...register('footTraffic')} className="w-full text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg p-2">
                                        <option value="high">Alto</option>
                                        <option value="medium">Medio</option>
                                        <option value="low">Bajo</option>
                                    </select>
                                </div>
                             </div>
                        </div>
                    )}
                    
                    {/* Image Upload */}
                    <div className="border-t pt-4">
                         <h4 className="font-semibold text-gray-800 mb-2">Fotografías</h4>
                         <div className="grid grid-cols-5 gap-2 mb-2">
                             {previewUrls.map((url, i) => (
                                 <div key={i} className="aspect-square relative rounded-lg overflow-hidden border">
                                     <Image src={url} alt="preview" fill className="object-cover" />
                                 </div>
                             ))}
                             {previewUrls.length < 5 && (
                                 <label className="aspect-square flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                                     <Upload className="text-gray-400" />
                                     <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                 </label>
                             )}
                         </div>
                    </div>
                </motion.div>
            )}

            {/* STEP 3: RISK */}
            {step === 3 && (
                <motion.div
                    key="step3"
                    variants={variants}
                    initial="enter"
                    animate="center"
                    className="space-y-6"
                >
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                         <h4 className="font-bold text-red-800 flex items-center gap-2"><AlertTriangle size={18}/> Matriz de Riesgo</h4>
                         <p className="text-xs text-red-600 mt-1">Estos factores impactan directamente la valoración final.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-600 block mb-1">Estatus Jurídico</label>
                            <select {...register('legalStatus')} className="w-full text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="deed_ready">Escritura al Día (Sin Problemas)</option>
                                <option value="possession">Posesión / Sin Escritura</option>
                                <option value="legal_issue">En Proceso de Sucesión / Remate</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" {...register('riskZone')} className="w-5 h-5 text-red-600 rounded" />
                                <span className="text-sm font-medium text-gray-700">Zona de Alto Riesgo (Cerro, Inundación)</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" {...register('roadAffectation')} className="w-5 h-5 text-red-600 rounded" />
                                <span className="text-sm font-medium text-gray-700">Afectación Vial (Planes de ampliación)</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" {...register('heritage')} className="w-5 h-5 text-blue-600 rounded" />
                                <span className="text-sm font-medium text-gray-700">Patrimonio Arquitectónico (Limitaciones)</span>
                            </label>
                        </div>

                        <div>
                             <label className="text-sm font-semibold text-gray-600 block mb-1">Deuda Predial / Servicios ($)</label>
                             <Controller
                                name="taxDebt"
                                control={control}
                                render={({ field }) => (
                                    <NumberInput {...field} placeholder="0" className="w-full text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg p-2.5 outline-none" />
                                )}
                            />
                        </div>
                    </div>
                </motion.div>
            )}

        {/* CONTROLS */}
        <div className="flex justify-between mt-8 pt-4 border-t">
            {step > 1 ? (
                <button type="button" onClick={prevStep} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg flex items-center gap-2">
                    <ArrowLeft size={16} /> Atrás
                </button>
            ) : <div />}
            
            {step < 3 ? (
                <button type="button" onClick={nextStep} disabled={isValidating} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg disabled:opacity-50">
                    {isValidating ? <Loader2 className="animate-spin" size={16}/> : <>Siguiente <ArrowRight size={16} /></>}
                </button>
            ) : (
                <button type="submit" disabled={isUploading} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-lg disabled:opacity-50">
                    {isUploading ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                    {isEditMode ? 'Actualizar Propiedad' : 'Guardar Propiedad'}
                </button>
            )}
        </div>
      </form>
    </div>
  );
}
