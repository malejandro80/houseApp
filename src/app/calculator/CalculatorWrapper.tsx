'use client';

import { useState } from 'react';
import PropertyForm from "@/app/components/PropertyForm";
import SuggestionsSlider from "@/app/components/SuggestionsSlider";
import CalculatorStepper from "@/app/components/CalculatorStepper";
import InitialChoice from "./InitialChoice";
import { User } from '@supabase/supabase-js';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CalculatorWrapper({ user }: { user: User }) {
  const [step, setStep] = useState(0); // Start at 0 for Initial Choice
  const [mode, setMode] = useState<'buy' | 'sell' | null>(null);

  const handleModeSelect = (selectedMode: 'buy' | 'sell') => {
      setMode(selectedMode);
      setStep(1);
  };

  if (step === 0) {
      return (
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 min-h-[600px] flex items-center justify-center">
              <InitialChoice onSelect={handleModeSelect} />
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        
        {/* Homogenized Header */}
        <div className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                    {mode === 'buy' ? 'Nuevo Análisis' : 'Nueva Venta'}
                </h1>
                <p className="text-gray-500 mt-2 font-medium">
                    {mode === 'buy' ? 'Evalúa tu próxima oportunidad de inversión.' : 'Registra tu propiedad para la venta.'}
                </p>
            </div>
            <div className="flex items-center gap-4">
                {/* Refined Purpose Switcher */}
                <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Propósito</span>
                    <div className="bg-gray-100/80 backdrop-blur-sm p-1 rounded-xl flex items-center relative border border-gray-200/50 shadow-inner">
                        <button 
                            onClick={() => setMode('sell')}
                            className={`relative z-10 px-5 py-1.5 text-xs font-bold transition-all duration-300 ${mode === 'sell' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Venta
                        </button>
                        <button 
                            onClick={() => setMode('buy')}
                            className={`relative z-10 px-5 py-1.5 text-xs font-bold transition-all duration-300 ${mode === 'buy' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Inversión
                        </button>
                        
                        {/* Active Background Pill */}
                        <motion.div 
                            layoutId="activePillCalculator"
                            initial={false}
                            animate={{ x: mode === 'sell' ? 0 : '100.5%' }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-gray-900 rounded-lg shadow-md border border-white/10"
                        />
                    </div>
                </div>

                <div className="h-10 w-px bg-gray-200 mx-2 self-end mb-1" />

                <Link 
                  href="/my-properties"
                  className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all shadow-sm w-fit"
                >
                  <ArrowLeft size={18} />
                  Volver a mis propiedades
                </Link>
            </div>
        </div>

        {/* Full Width Stepper */}
        <CalculatorStepper step={step} purpose={mode === 'buy' ? 'investment' : 'sale'} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
             {/* Left Column: Suggestions (Sticky) */}
             <div className="hidden lg:block lg:col-span-4 sticky top-24 space-y-8">
                 <SuggestionsSlider />
                 
                 <div className="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl text-white shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="relative z-10">
                        <h4 className="font-bold text-lg mb-2">¿Necesitas Valuación Certificada?</h4>
                        <p className="text-blue-100 text-sm mb-4 leading-relaxed">Nuestros peritos pueden validar tu análisis antes de que ofertes.</p>
                        <button className="w-full py-2.5 bg-white text-blue-700 font-bold rounded-xl text-sm hover:bg-blue-50 transition-colors shadow-sm">
                            Contactar Asesor
                        </button>
                    </div>
                    {/* Decorative */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-700"></div>
                 </div>
             </div>

             {/* Right Column: Calculator Form */}
             <div className="lg:col-span-8">
                 <PropertyForm 
                    user={user} 
                    step={step} 
                    setStep={setStep} 
                    purpose={mode === 'buy' ? 'investment' : 'sale'}
                 />
             </div>
        </div>
    </div>
  );
}
