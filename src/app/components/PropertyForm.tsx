'use client';

import { useState, useMemo, Dispatch, SetStateAction } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, MapPin, DollarSign, AlertTriangle, CheckCircle, 
  ArrowRight, ArrowLeft, Save, Upload, X, Loader2, Home, Briefcase, Warehouse, LandPlot, User as UserIcon
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { propertyFormSchema, PropertyFormData } from '@/lib/schemas/propertySchema';
import Image from 'next/image';
import NumberInput from './NumberInput';
import PhoneInput from './PhoneInput';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { updateProperty } from '@/app/actions/property';

interface ImageItem {
  id: string;
  url: string;
  file?: File;
}

function SortableImage({ id, url, onRemove, isFirst }: { id: string; url: string; onRemove: () => void; isFirst: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners} 
        className={`aspect-square relative rounded-xl overflow-hidden border-2 transition-all group ${
            isDragging ? 'border-indigo-500 shadow-2xl scale-105 opacity-50' : 'border-gray-100'
        } ${isFirst ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
    >
      <Image src={url} alt="preview" fill className="object-cover" />
      
      {isFirst && (
        <div className="absolute top-0 left-0 right-0 bg-indigo-600 text-white text-[10px] font-bold py-1.5 px-3 flex items-center gap-1.5 shadow-sm">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          FOTO DE PORTADA
        </div>
      )}

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 shadow-lg z-20 hover:scale-110 active:scale-95"
      >
        <X size={14} />
      </button>

      {!isDragging && (
          <div className="absolute bottom-2 left-2 p-1 bg-white/50 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-0.5">
                  <div className="w-1 h-1 bg-gray-600 rounded-full" />
                  <div className="w-1 h-1 bg-gray-600 rounded-full" />
                  <div className="w-1 h-1 bg-gray-600 rounded-full" />
              </div>
          </div>
      )}
    </div>
  );
}

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
  const [images, setImages] = useState<ImageItem[]>(
    initialData?.images?.map((url: string, index: number) => ({ 
        id: `existing-${index}-${url}`, 
        url 
    })) || []
  );
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const supabase = createClient();
  const router = useRouter();
  
  const { register, handleSubmit, watch, setValue, control, formState: { errors }, reset, trigger } = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema) as any,
    defaultValues: initialData ? {
      title: initialData.title || '',
      type: initialData.type || 'house',
      salePrice: initialData.sale_price || 0,
      rentPrice: initialData.rent_price || 0,
      areaTotal: initialData.area_total || 0,
      areaBuilt: initialData.area_built || 0,
      address: initialData.address || '',
      neighborhood: initialData.neighborhood || undefined,
      latitude: initialData.lat || undefined,
      longitude: initialData.lon || undefined,
      age: initialData.age || 0,
      physicalCondition: initialData.physical_condition || 3,
      
      // Top level columns (previously in metadata)
      rooms: initialData.bedrooms ?? undefined,
      bathrooms: initialData.bathrooms ?? undefined,
      parking: initialData.parking ?? undefined,
      amenities: initialData.metadata?.amenities || [],
      landUse: initialData.metadata?.land_use || undefined,
      topography: initialData.metadata?.topography || undefined,
      frontage: initialData.metadata?.frontage ?? undefined,
      footTraffic: initialData.metadata?.foot_traffic || undefined,
      floorResistance: initialData.metadata?.floor_resistance ?? undefined,
      ceilingHeight: initialData.metadata?.ceiling_height ?? undefined,
      loadingDocks: initialData.metadata?.loading_docks ?? undefined,
      power: initialData.metadata?.power ?? undefined,

      // Risk
      legalStatus: initialData.legal_status || 'deed_ready',
      riskZone: initialData.risk_factors?.risk_zone || false,
      roadAffectation: initialData.risk_factors?.road_affectation || false,
      taxDebt: initialData.risk_factors?.tax_debt || 0,
      heritage: initialData.risk_factors?.heritage || false,
      acceptedListingTerms: initialData?.accepted_listing_terms || false,
      
      // Owner (from isolated table)
      ownerName: initialData.property_owners?.full_name || '',
      ownerPhone: initialData.property_owners?.phone || '',
      ownerEmail: initialData.property_owners?.email || '',

    } : {
      title: '',
      type: 'house',
      salePrice: 0,
      rentPrice: 0,
      areaTotal: 0,
      areaBuilt: 0,
      address: '',
      legalStatus: 'deed_ready',
      riskZone: false,
      roadAffectation: false,
      heritage: false,
      acceptedListingTerms: false,
      amenities: [],
      age: 0,
      physicalCondition: 3
    }
  });

  const propertyType = watch('type');
  const salePrice = watch('salePrice');
  const rentPrice = watch('rentPrice');
  const latitude = watch('latitude');
  const longitude = watch('longitude');

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
    
    if (images.length + newFiles.length > 5) {
        toast.warning('Máximo 5 imágenes');
        return;
    }

    const newItems: ImageItem[] = newFiles.map((file, idx) => ({
        id: `new-${Date.now()}-${idx}-${file.name}`,
        url: URL.createObjectURL(file),
        file
    }));

    setImages(prev => [...prev, ...newItems]);
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // State for step transition buffering
  const [isValidating, setIsValidating] = useState(false);

  const onFormError = (errs: any) => {
    console.error('Validation Errors:', errs);
    const firstError = Object.values(errs)[0] as any;
    toast.error(`Error de validación: ${firstError?.message || 'Revisa los campos'}`);
  };

  const onSubmit = async (data: PropertyFormData) => {
    const maxSteps = purpose === 'investment' ? 4 : 3;
    if (step < maxSteps) return;

    if (!user) {
        toast.error('Debes iniciar sesión');
        return;
    }
    
    setIsUploading(true);
    const promise = (async () => {
        // 1. Upload/Process all images in the CURRENT order
        const finalImages: string[] = [];
        
        for (const item of images) {
            if (item.file) {
                // Upload NEW image
                const fileName = `${user.id}/${Date.now()}_${item.file.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('property-images')
                    .upload(fileName, item.file);
                
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('property-images')
                    .getPublicUrl(fileName);
                
                finalImages.push(publicUrl);
            } else {
                // Keep EXISTING image
                finalImages.push(item.url);
            }
        }

        if (isEditMode && initialData) {
            // 1. Update Owner if investment
            let currentOwnerId = initialData.owner_id;
            
            if (purpose === 'investment' && (data.ownerName || data.ownerPhone || data.ownerEmail)) {
                if (currentOwnerId) {
                    // Update existing owner record
                    const { error: ownerError } = await supabase
                        .from('property_owners')
                        .update({
                            full_name: data.ownerName,
                            phone: data.ownerPhone,
                            email: data.ownerEmail,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', currentOwnerId);
                    
                    if (ownerError) throw ownerError;
                } else {
                    // Create new owner record if it didn't exist
                    const { data: newOwner, error: ownerError } = await supabase
                        .from('property_owners')
                        .insert({
                            full_name: data.ownerName,
                            phone: data.ownerPhone,
                            email: data.ownerEmail,
                            created_by: user.id
                        })
                        .select()
                        .single();
                    
                    if (ownerError) throw ownerError;
                    currentOwnerId = newOwner.id;
                }
            } else if (purpose === 'sale') {
                currentOwnerId = null;
            }

            // 2. UPDATE Property
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
                physical_condition: data.physicalCondition,
                bedrooms: data.rooms,
                bathrooms: data.bathrooms,
                parking: data.parking,
                owner_id: currentOwnerId,
                
                // Metadata
                metadata: {
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
                accepted_listing_terms: data.acceptedListingTerms,
                images: finalImages,
                cover_image: finalImages[0] || null
            };

            const result = await updateProperty(initialData.id, updatePayload);
            if (result.error) throw new Error(result.error);

        } else {
            // INSERT
            let ownerId = null;

            if (purpose === 'investment' && data.ownerName) {
                const { data: owner, error: ownerError } = await supabase
                    .from('property_owners')
                    .insert({
                        full_name: data.ownerName,
                        phone: data.ownerPhone,
                        email: data.ownerEmail,
                        created_by: user.id
                    })
                    .select()
                    .single();
                
                if (ownerError) {
                    console.error('Owner error:', ownerError);
                    throw ownerError;
                }
                ownerId = owner.id;
            }

            const riskFactors = {
                risk_zone: data.riskZone,
                road_affectation: data.roadAffectation,
                tax_debt: data.taxDebt,
                heritage: data.heritage
            };

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
                purpose: purpose, 
                is_listed: false,
                bedrooms: data.rooms,
                bathrooms: data.bathrooms,
                parking: data.parking,
                owner_id: ownerId,
                
                // Top-level custom columns
                age: data.age,
                physical_condition: data.physicalCondition,
                legal_status: data.legalStatus,
                risk_factors: riskFactors,

                // Metadata (for items without top-level columns)
                metadata: {
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

                accepted_listing_terms: purpose === 'sale' ? data.acceptedListingTerms : true,
                images: finalImages,
                cover_image: finalImages[0] || null
            });

            if (error) {
                console.error('Supabase Insert Error:', error);
                throw error;
            }

        }

        // Redirect to list
        router.push('/my-properties');
        router.refresh();
    })();

    toast.promise(promise, {
        loading: isEditMode ? 'Actualizando propiedad...' : 'Guardando propiedad...',
        success: () => {
            setIsUploading(false);
            return isEditMode ? 'Propiedad actualizada con éxito' : 'Propiedad guardada con éxito';
        },
        error: (err) => {
            setIsUploading(false);
            console.error('Error detail:', err);
            return err.message || 'Error al procesar la propiedad';
        },
    });

    try {
        await promise;
    } catch (e) {
        // Handled by toast.promise
    }
  };

  const nextStep = async () => {
    if (isValidating) return;
    setIsValidating(true);
    
    let fields: (keyof PropertyFormData)[] = [];
    if (step === 1) {
        fields = ['title', 'type', 'salePrice', 'address'];
        if (purpose === 'investment') {
            fields.push('rentPrice');
        }
    } else if (step === 2) {
        fields = [
            'areaTotal', 'areaBuilt', 'age', 'physicalCondition', 
            'rooms', 'bathrooms', 'parking', 'amenities', 
            'landUse', 'topography', 'frontage', 'footTraffic', 
            'floorResistance', 'ceilingHeight', 'loadingDocks', 'power'
        ];
    } else if (step === 3) {
        fields = ['legalStatus', 'riskZone', 'roadAffectation', 'taxDebt', 'heritage', 'acceptedListingTerms'];
    }

    const maxStep = purpose === 'investment' ? 4 : 3;
    const isValid = await trigger(fields);
    
    // Debug: Log errors if not valid
    if (!isValid) {
        const fieldErrors = fields.filter(f => errors[f]);
        console.log('Step validation failed for:', fieldErrors, errors);
        const errorMessages = fieldErrors.map(f => {
            const error = (errors as any)[f];
            return `${f}: ${error?.message || 'inválido'}`;
        }).join(', ');
        toast.error(`Revisa los campos: ${errorMessages}`);
    }

    // Add small delay to prevent double-click accidental submission of next step
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (isValid) {
        setStep(s => Math.min(s + 1, maxStep));
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
      <form onSubmit={handleSubmit(onSubmit, onFormError)} className="p-6">
        <AnimatePresence mode="wait">
          {/* STEP 1: BASIC INFO */}
          {step === 1 && (
            <motion.div
              key="step-1"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Título del Anuncio</label>
                  <input {...register('title')} className="w-full text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej. Casa en El Poblado" />
                  {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Tipo de Inmueble</label>
                  <select {...register('type')} className="w-full text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none">
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
                      <NumberInput {...field} placeholder="0" className="w-full text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
                    )}
                  />
                  {errors.salePrice && <p className="text-red-500 text-xs">{errors.salePrice.message}</p>}
                </div>
                {purpose === 'investment' && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Renta Estimada Mensual ($)</label>
                    <Controller
                      name="rentPrice"
                      control={control}
                      render={({ field }) => (
                        <NumberInput {...field} placeholder="0" className="w-full text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
                      )}
                    />
                  </div>
                )}
              </div>

              {purpose === 'investment' && grossYield > 0 && (
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
                <LocationPicker 
                  initialLat={latitude}
                  initialLng={longitude}
                  onLocationSelect={(lat, lng) => {
                    setValue('latitude', lat);
                    setValue('longitude', lng);
                  }} 
                />
              </div>
            </motion.div>
          )}

          {/* STEP 2: DETAILS */}
          {step === 2 && (
            <motion.div
              key="step-2"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
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
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-gray-600">Condición Física</label>
                    <Controller
                      name="physicalCondition"
                      control={control}
                      render={({ field }) => {
                        const val = field.value || 3;
                        let label = "Buen estado";
                        let color = "text-yellow-600";
                        if (val === 1) { label = "⚠️ Para demoler"; color = "text-red-600"; }
                        else if (val === 2) { label = "🟠 Regular / Remodelar"; color = "text-orange-600"; }
                        else if (val === 3) { label = "🟡 Buen estado"; color = "text-yellow-600"; }
                        else if (val === 4) { label = "🟢 Muy bueno"; color = "text-emerald-600"; }
                        else if (val === 5) { label = "✨ Propiedad nueva"; color = "text-indigo-600"; }

                        return (
                          <div className="flex flex-col items-end">
                            <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</span>
                          </div>
                        );
                      }}
                    />
                  </div>
                  <Controller
                    name="physicalCondition"
                    control={control}
                    render={({ field }) => (
                      <div className="px-2">
                        <input 
                          type="range" 
                          min="1" 
                          max="5" 
                          step="1" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-black px-1">
                          <span>RUINA</span>
                          <span>NUEVO</span>
                        </div>
                      </div>
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
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900">Fotografías</h4>
                    <p className="text-xs text-gray-500">Arrastra para reordenar. La primera será la foto de portada.</p>
                  </div>
                  <span className="text-xs font-medium text-gray-400">{images.length} / 5</span>
                </div>

                <DndContext
                  id="dnd-property-images"
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
                    <SortableContext
                      items={images.map(img => img.id)}
                      strategy={rectSortingStrategy}
                    >
                      {images.map((img, index) => (
                        <SortableImage
                          key={img.id}
                          id={img.id}
                          url={img.url}
                          onRemove={() => removeImage(img.id)}
                          isFirst={index === 0}
                        />
                      ))}
                    </SortableContext>

                    {images.length < 5 && (
                      <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-indigo-400 transition-all group">
                        <div className="p-3 bg-gray-50 rounded-full group-hover:bg-indigo-50 transition-colors">
                          <Upload className="text-gray-400 group-hover:text-indigo-500 transition-colors" size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-indigo-500 mt-2">SUBIR FOTO</span>
                        <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                      </label>
                    )}
                  </div>
                </DndContext>
              </div>
            </motion.div>
          )}

          {/* STEP 3: RISK */}
          {step === 3 && (
            <motion.div
              key="step-3"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
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
                    <input type="checkbox" {...register('heritage')} className="w-5 h-5 text-indigo-600 rounded" />
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

                {purpose === 'sale' && (
                  <div className="pt-6 border-t border-gray-100">
                    <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 mb-4">
                      <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <CheckCircle size={14} /> Términos de Publicación
                      </h4>
                      <p className="text-[10px] text-indigo-700 leading-relaxed font-medium">
                        Al publicar esta propiedad, certificas que la información es verídica y que tienes autorización legal para promocionarla. HouseApp se reserva el derecho de verificar la documentación y remover anuncios que no cumplan con nuestras políticas de transparencia.
                      </p>
                    </div>
                    <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer border-2 border-transparent hover:border-indigo-200 transition-all group">
                      <div className="mt-0.5">
                        <input
                          type="checkbox"
                          {...register('acceptedListingTerms')}
                          className="w-5 h-5 text-indigo-600 rounded-md border-gray-300 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">Acepto los términos y condiciones de publicación</span>
                        <p className="text-[10px] text-gray-500 mt-1">Habilita la visibilidad en el mapa público y permite que otros usuarios te contacten.</p>
                      </div>
                    </label>
                    {errors.acceptedListingTerms && <p className="text-red-500 text-xs mt-1">{errors.acceptedListingTerms.message}</p>}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 4: OWNER CONTACT (Only for Investment) */}
          {step === 4 && purpose === 'investment' && (
            <motion.div
              key="step-4"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-6"
            >
              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <UserIcon size={20}/>
                  </div>
                  <h4 className="font-bold text-indigo-900">Datos de Contacto del Dueño</h4>
                </div>
                <p className="text-xs text-indigo-600/80 leading-relaxed font-medium">Esta información es privada y solo se usará para tu gestión personal de la negociación.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Nombre Completo</label>
                  <input
                    {...register('ownerName')}
                    className="w-full text-gray-900 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Teléfono / WhatsApp</label>
                  <Controller
                    name="ownerPhone"
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        {...field}
                        placeholder="(300) 000-0000"
                        className="w-full text-gray-900 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Correo Electrónico (Opcional)</label>
                  <input
                    {...register('ownerEmail')}
                    className="w-full text-gray-900 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
                    placeholder="correo@ejemplo.com"
                  />
                  {errors.ownerEmail && <p className="text-red-500 text-xs mt-1 font-medium">{errors.ownerEmail.message}</p>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONTROLS */}
        <div className="flex justify-between mt-8 pt-4 border-t">
          {step > 1 ? (
            <button type="button" onClick={prevStep} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg flex items-center gap-2">
              <ArrowLeft size={16} /> Atrás
            </button>
          ) : <div />}
          
          {step < (purpose === 'investment' ? 4 : 3) ? (
            <button type="button" onClick={nextStep} disabled={isValidating} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-lg disabled:opacity-50">
              {isValidating ? <Loader2 className="animate-spin" size={16}/> : <>Siguiente <ArrowRight size={16} /></>}
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={isUploading} 
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 group"
            >
              <span className="flex items-center gap-2">
                {isUploading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} className="group-hover:scale-110 transition-transform" />
                )}
                <span>{isEditMode ? 'Actualizar Propiedad' : 'Guardar Propiedad'}</span>
              </span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
