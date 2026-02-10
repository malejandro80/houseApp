'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import dynamic from 'next/dynamic';
import { Building2, MapPin, BedDouble, Bath, Car, DollarSign, Calculator } from 'lucide-react';
import FinancialDashboard from './FinancialDashboard';
import Tooltip from './Tooltip';
import { useState } from 'react';
import { usePropertyProfitability } from '../hooks/usePropertyProfitability';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

type PropertyFormData = {
  propertyType: string;
  landArea: number; // in sq meters
  location: string;
  bedrooms: number;
  bathrooms: number;
  hasGarage: boolean;
  purchasePrice: number;
  estimatedRent: number;
  latitude?: number;
  longitude?: number;
  ibi: number;
  community: number;
  insurance: number;
  vacancyMonths: number;
};

export default function PropertyForm({ user }: { user: User | null }) {
  const supabase = createClient();
  const { register, handleSubmit, reset, setValue, watch } = useForm<PropertyFormData>({
    defaultValues: {
        ibi: 0,
        community: 0,
        insurance: 0,
        vacancyMonths: 0
    }
  });
  const { result, calculateProfitability, resetResult } = usePropertyProfitability();
  const [isExpertMode, setIsExpertMode] = useState(false);

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

    try {
      if (user) {
        const dataToSave =  {
              type: data.propertyType,
              address: data.location,
              lat: data.latitude,
              lon: data.longitude,
              m2: Number(data.landArea),
              rooms: Number(data.bedrooms),
              bathrooms: Number(data.bathrooms),
              has_garage: data.hasGarage,
              sale_price: Number(data.purchasePrice),
              rent_price: Number(data.estimatedRent),
            }
        console.log('Saving data to Supabase:', dataToSave);
        const { error } = await supabase
          .from('datahouse')
          .insert([dataToSave]);

        if (error) {
          console.error('Error saving data to Supabase:', error);
          // Optional: Add UI feedback here if requested
        } else {
          console.log('Data saved successfully to Supabase');
        }
      }
    } catch (err) {
      console.error('Unexpected error saving data:', err);
    }
  };

  const handleReset = () => {
    reset();
    resetResult();
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 sm:p-6 text-white">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Calculator className="w-5 h-5 sm:w-6 sm:h-6" />
          Estimador de Rentabilidad
        </h2>
        <p className="text-blue-100 mt-1">Calcula si una propiedad es una buena inversión.</p>
      </div>

      <div className="p-4 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          
          {user && (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Property Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Building2 className="w-4 h-4 text-gray-500" />
                Tipo de Propiedad
              </label>
              <select
                {...register('propertyType', { required: true })}
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900"
              >
                <option value="house">Casa</option>
                <option value="apartment">Apartamento</option>
                <option value="commercial">Local Comercial</option>
                <option value="land">Terreno</option>
              </select>
            </div>

             {/* Location */}
             <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-500" />
                Ubicación
              </label>
              <input
                type="text"
                {...register('location', { required: true })}
                placeholder="Ej. Centro de la ciudad"
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900"
              />
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
            <div className="grid grid-cols-2 gap-4">
                <input 
                    type="text" 
                    placeholder="Latitud" 
                    readOnly 
                    {...register('latitude')}
                    className="bg-gray-50 text-xs p-2 rounded border border-gray-200 text-gray-500"
                />
                <input 
                    type="text" 
                    placeholder="Longitud" 
                    readOnly 
                    {...register('longitude')}
                    className="bg-gray-50 text-xs p-2 rounded border border-gray-200 text-gray-500"
                />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
             {/* Land Area */}
             <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Metros Cuadrados (m²)</label>
              <input
                type="number"
                {...register('landArea', { required: true, min: 0 })}
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900"
              />
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
                {...register('bedrooms', { required: true, min: 0 })}
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900"
              />
            </div>

            {/* Bathrooms */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Bath className="w-4 h-4 text-gray-500" />
                Baños
              </label>
              <input
                type="number"
                {...register('bathrooms', { required: true, min: 0 })}
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900"
              />
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
                    <label className="text-sm font-medium text-gray-700">Precio de Compra ($)</label>
                    <input
                        type="number"
                        {...register('purchasePrice', { required: true, min: 1 })}
                        className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 text-gray-900"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Alquiler Estimado Mensual ($)</label>
                    <input
                        type="number"
                        {...register('estimatedRent', { required: true, min: 1 })}
                        className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 text-gray-900"
                    />
                </div>
            </div>

          </div>

            {/* Expert Mode Toggle */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-6">
               <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Modo Experto</span>
                  <Tooltip text="Activa para incluir gastos detallados. Ejemplo: IBI, comunidad y seguros para un cálculo de retorno neto más preciso." />
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
            {isExpertMode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-gray-50 p-4 rounded-lg border border-gray-100 animate-fade-in-down mt-4">
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            IBI (Anual)
                            <Tooltip text="Impuesto anual obligatorio sobre la propiedad. Ejemplo: $150 - $800/año dependiendo la zona." />
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                            <input
                                type="number"
                                {...register('ibi', { min: 0 })}
                                className="w-full rounded-lg border-gray-300 border p-2.5 pl-7 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            Comunidad (Mensual)
                            <Tooltip text="Cuota mensual de mantenimiento. Ejemplo: $30 - $150/mes si hay elevador o vigilancia." />
                        </label>
                        <div className="relative">
                             <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                            <input
                                type="number"
                                {...register('community', { min: 0 })}
                                className="w-full rounded-lg border-gray-300 border p-2.5 pl-7 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            Seguro Hogar (Anual)
                            <Tooltip text="Protección contra daños. Ejemplo: $150 - $400/año." />
                        </label>
                        <div className="relative">
                             <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                            <input
                                type="number"
                                {...register('insurance', { min: 0 })}
                                className="w-full rounded-lg border-gray-300 border p-2.5 pl-7 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            Vacancia (Meses/Año)
                            <Tooltip text="Tiempo promedio sin inquilino. Ejemplo: 1 mes al año es conservador." />
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            {...register('vacancyMonths', { min: 0, max: 12 })}
                            className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                </div>
            )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors order-2 sm:order-1"
            >
              Reiniciar
            </button>
            <button
              type="submit"
              className="w-full sm:w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg hover:shadow-xl transform active:scale-95 duration-200 order-1 sm:order-2"
            >
              Calcular Rentabilidad
            </button>
          </div>
        </form>

        {result && (
          <FinancialDashboard result={result} />
        )}
      </div>
    </div>
  );
}
