'use client';

import { useState } from 'react';
import PropertyForm from "@/app/components/PropertyForm";
import CalculatorStepper from "@/app/components/CalculatorStepper";
import { User } from '@supabase/supabase-js';

export default function EditWrapper({ user, property }: { user: User, property: any }) {
  const [step, setStep] = useState(1); // Start at step 1 for editing
  
  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Editar Propiedad</h1>
            <p className="text-gray-500">Actualiza la información de tu análisis o venta.</p>
        </div>

        {/* Full Width Stepper */}
        <CalculatorStepper step={step} />

        <div className="mt-8">
             <PropertyForm 
                user={user} 
                step={step} 
                setStep={setStep} 
                purpose={property.purpose}
                initialData={property}
                isEditMode={true}
             />
        </div>
    </div>
  );
}
