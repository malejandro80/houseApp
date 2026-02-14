'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Building2, MapPin, BedDouble, Bath, Car, Maximize, DollarSign, Calendar, Phone, Mail, MessageCircle, ShieldAlert, BadgeCheck, Pencil, User, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import PropertyMapWrapper from '@/app/components/PropertyMapWrapper';
import { calculateProfitabilityForList, getHealthLabel } from '@/lib/financial-utils';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface PropertyDetail {
  id: string;
  title: string | null;
  address: string;
  type: string;
  m2: number;
  rooms: number;
  bathrooms: number;
  parking: number;
  age: number;
  physicalCondition: number;
  sale_price: number;
  rent_price: number;
  images: string[] | null;
  cover_image: string | null;
  created_at: string;
  purpose: 'investment' | 'sale';
  isOwner: boolean;
  lat?: number;
  lon?: number;
  legalStatus?: string;
  riskFactors?: any;
  amenities?: string[];
  owner?: {
    full_name: string;
    phone: string;
    email: string;
  } | null;
  assigned_advisor?: {
    full_name: string;
  } | null;
}

const LEGAL_STATUS_LABELS: Record<string, string> = {
  'deed_ready': 'Escritura al Día (Sin Problemas)',
  'possession': 'Posesión / Sin Escritura',
  'legal_issue': 'En Proceso de Sucesión / Remate'
};

const PHYSICAL_CONDITION_LABELS: Record<number, { label: string, color: string, dot: string }> = {
  1: { label: 'Para demoler', color: 'text-red-600', dot: 'bg-red-600' },
  2: { label: 'Regular / Remodelar', color: 'text-orange-600', dot: 'bg-orange-600' },
  3: { label: 'Buen estado', color: 'text-yellow-600', dot: 'bg-yellow-600' },
  4: { label: 'Muy bueno', color: 'text-emerald-600', dot: 'bg-emerald-600' },
  5: { label: 'Propiedad nueva', color: 'text-blue-600', dot: 'bg-blue-600' }
};

export default function PropertyDetailClient({ property: p, user }: { property: PropertyDetail, user: SupabaseUser | null }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const isLightboxOpen = selectedImageIndex !== null;

  const { netReturn, health } = calculateProfitabilityForList(p.sale_price, p.rent_price);
  const healthStyle = getHealthLabel(health);

  // Combine cover image and other images for gallery
  let allImages = p.images || [];
  if (p.cover_image && !allImages.includes(p.cover_image)) {
    allImages = [p.cover_image, ...allImages];
  }
  const hasImages = allImages.length > 0;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') setSelectedImageIndex(null);
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'ArrowRight') handleNextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, selectedImageIndex]);

  const handleNextImage = () => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex + 1) % allImages.length);
  };

  const handlePrevImage = () => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex - 1 + allImages.length) % allImages.length);
  };

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

  return (
    <motion.div 
      className="min-h-screen bg-slate-50 pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Property Header Actions */}
      <motion.div variants={itemVariants} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/my-properties" 
              className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-600 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all active:scale-95 group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                {p.title || p.address}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-black text-white bg-slate-900 px-2 py-0.5 rounded uppercase tracking-widest">
                  {p.purpose === 'investment' ? 'Inversión' : 'Venta'}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin size={10} />
                  {p.address}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {p.isOwner ? (
                <Link 
                    href={`/my-properties/${p.id}/edit`}
                    className="flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                >
                    <Pencil size={18} />
                    <span>Editar Propiedad</span>
                </Link>
            ) : (
                <button className="flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
                    <Phone size={18} />
                    <span>Contactar Asesor</span>
                </button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Image Gallery */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4 h-96 md:h-[500px]">
           {/* Main Image */}
           <div 
                onClick={() => hasImages && setSelectedImageIndex(0)}
                className={`relative rounded-2xl overflow-hidden shadow-lg cursor-pointer group ${hasImages ? (allImages.length > 1 ? 'md:col-span-3' : 'md:col-span-4') : 'md:col-span-4 bg-gray-200 flex items-center justify-center'}`}
            >
                {hasImages ? (
                    <>
                        <Image 
                            src={allImages[0]} 
                            alt="Vista principal" 
                            fill 
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            priority
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Maximize className="text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300" size={48} />
                        </div>
                    </>
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
                        <div 
                            key={idx} 
                            onClick={() => setSelectedImageIndex(idx + 1)}
                            className="relative flex-1 rounded-xl overflow-hidden shadow cursor-pointer group"
                        >
                            <Image 
                                src={img} 
                                alt={`Vista ${idx + 2}`} 
                                fill 
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </div>
                    ))}
                    {allImages.length > 4 && (
                        <div 
                            onClick={() => setSelectedImageIndex(4)}
                            className="relative flex-1 rounded-xl overflow-hidden shadow bg-gray-900 flex items-center justify-center text-white font-bold cursor-pointer hover:bg-gray-800 transition-colors group"
                        >
                            <span className="relative z-10">+{allImages.length - 4} fotos</span>
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                        </div>
                    )}
                </div>
           )}
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Details */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
                
                {/* Key Info Cards */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Building2 className="text-blue-600" />
                        Detalles de la Propiedad
                    </h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <BedDouble className="w-6 h-6 text-slate-400 mb-2" />
                            <span className="text-xl font-black text-slate-900">{p.rooms}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Habitaciones</span>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <Bath className="w-6 h-6 text-slate-400 mb-2" />
                            <span className="text-xl font-black text-slate-900">{p.bathrooms}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Baños</span>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <Maximize className="w-6 h-6 text-slate-400 mb-2" />
                            <span className="text-xl font-black text-slate-900">{p.m2}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">m²</span>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <Car className={`w-6 h-6 mb-2 ${p.parking > 0 ? 'text-indigo-500' : 'text-slate-300'}`} />
                            <span className="text-xl font-black text-slate-900">{p.parking}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Parqueaderos</span>
                        </motion.div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div>
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Ubicación</span>
                                <div className="flex items-start gap-2 text-gray-900 font-medium">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                    <span className="text-sm">{p.address}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Tipo de Activo</span>
                                <span className="capitalize px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-black ring-1 ring-blue-100">
                                    {p.type === 'house' ? 'Casa' : p.type === 'apartment' ? 'Apartamento' : p.type}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Condición Física</span>
                                <div className="flex items-center gap-2">
                                     <div className={`w-3 h-3 rounded-full ${PHYSICAL_CONDITION_LABELS[p.physicalCondition]?.dot || 'bg-gray-400'}`} />
                                     <span className={`text-sm font-bold ${PHYSICAL_CONDITION_LABELS[p.physicalCondition]?.color || 'text-gray-900'}`}>
                                        {PHYSICAL_CONDITION_LABELS[p.physicalCondition]?.label || `Nivel ${p.physicalCondition}/5`}
                                     </span>
                                </div>
                            </div>
                        </div>

                        {(p.legalStatus || p.riskFactors) && (
                            <div className="mt-8 p-4 bg-red-50/50 rounded-2xl border border-red-100">
                                <h4 className="text-xs font-black text-red-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <ShieldAlert size={14} /> Información Legal y Riesgo
                                </h4>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                     {p.legalStatus && (
                                         <div className="flex flex-col">
                                             <span className="text-[10px] text-red-600 font-bold uppercase">Estatus Jurídico</span>
                                             <span className="text-sm font-black text-gray-900">
                                                {LEGAL_STATUS_LABELS[p.legalStatus] || p.legalStatus}
                                             </span>
                                         </div>
                                     )}
                                     {p.riskFactors && (
                                         <div className="flex flex-wrap gap-2">
                                             {p.riskFactors.risk_zone && (
                                                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-black border border-red-200">
                                                    ⚠️ Zona de Alto Riesgo
                                                </span>
                                             )}
                                             {p.riskFactors.road_affectation && (
                                                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-black border border-red-200">
                                                    🛣️ Afección Vial
                                                </span>
                                             )}
                                             {p.riskFactors.heritage && (
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black border border-blue-200">
                                                    🏛️ Patrimonio Arquitectónico
                                                </span>
                                             )}
                                         </div>
                                     )}
                                </div>
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
            </motion.div>

            {/* Right Column: Financials */}
            <motion.div variants={itemVariants} className="space-y-6">
                
                {/* Price Card */}
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg"
                >
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
                </motion.div>

                {/* Health Badge */}
                <div className={`p-4 rounded-xl border flex items-center gap-4 ${healthStyle.bg} ${healthStyle.borderColor}`}>
                     <div className={`p-2 rounded-full bg-white ${healthStyle.color}`}>
                         <BadgeCheck className="w-6 h-6" /> 
                     </div>
                     <div>
                         <p className={`font-bold ${healthStyle.color}`}>{healthStyle.text}</p>
                         <p className="text-xs text-gray-600 mt-0.5">Basado en reglas de inversión estándar</p>
                     </div>
                </div>

                {/* Owner/Investment Action Card */}
                {p.purpose === 'investment' && p.owner && (
                    <motion.div 
                        variants={itemVariants}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6"
                    >
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Información del Dueño</h4>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 border border-indigo-200">
                                <User size={24} />
                            </div>
                            <div>
                                <p className="font-black text-gray-900 leading-none">{p.owner.full_name}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wider">Propietario</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                             <a 
                                href={`https://wa.me/${p.owner.phone}`}
                                target="_blank"
                                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black transition-all shadow-lg active:scale-95"
                             >
                                <MessageCircle size={18} />
                                WhatsApp Directo
                             </a>
                             <a 
                                href={`tel:${p.owner.phone}`}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-black hover:bg-gray-50 transition-all active:scale-95"
                             >
                                <Phone size={18} />
                                Llamar al Dueño
                             </a>
                             <a 
                                href={`mailto:${p.owner.email}`}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-500 rounded-xl text-xs font-bold hover:text-slate-700 transition-all text-center"
                             >
                                <Mail size={14} />
                                {p.owner.email}
                             </a>
                        </div>
                    </motion.div>
                )}

                {/* Advisor Card for public properties */}
                {p.purpose === 'sale' && !p.isOwner && (
                    <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 text-center">
                         <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-indigo-100">
                            <User className="text-indigo-600" size={32} />
                         </div>
                         <h4 className="font-black text-slate-900 mb-1">{p.assigned_advisor?.full_name || 'Experto Local'}</h4>
                         <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest mb-6 px-4">Asesor Asignado</p>
                         <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
                            Contactar Asesor
                         </button>
                    </div>
                )}

                <div className="text-xs text-center text-gray-400">
                    Agregado el {new Date(p.created_at).toLocaleDateString()}
                </div>

            </motion.div>
        </div>
      </div>

      {/* Fullscreen Lightbox Slider */}
      <AnimatePresence>
        {isLightboxOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center select-none"
            >
                {/* Controls */}
                <button 
                    onClick={() => setSelectedImageIndex(null)}
                    className="absolute top-6 right-6 z-[110] p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
                >
                    <X size={24} />
                </button>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-4">
                    <button 
                        onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                        className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 border border-white/10"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="px-6 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10 text-white text-sm font-black">
                        {selectedImageIndex! + 1} / {allImages.length}
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                        className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 border border-white/10"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Main Image Slider */}
                <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-12 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedImageIndex}
                            initial={{ opacity: 0, scale: 0.9, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, x: -20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="relative w-full max-w-5xl h-full flex items-center justify-center"
                        >
                            <img 
                                src={allImages[selectedImageIndex!]} 
                                alt="Propiedad vista completa"
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Background click to close */}
                <div 
                    className="absolute inset-0 cursor-zoom-out" 
                    onClick={() => setSelectedImageIndex(null)}
                />
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
