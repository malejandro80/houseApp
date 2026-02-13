'use client';

import { useState } from 'react';
import PropertyForm from "@/app/components/PropertyForm";
import SuggestionsSlider from "@/app/components/SuggestionsSlider";
import CalculatorStepper from "@/app/components/CalculatorStepper";
import InitialChoice from "./InitialChoice";
import { User } from '@supabase/supabase-js';

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
        
        {/* Full Width Stepper */}
        <CalculatorStepper step={step} />

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
