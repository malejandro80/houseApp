'use client';
import { motion } from 'framer-motion';
import { Check, DollarSign, Home, ShieldAlert, User as UserIcon } from 'lucide-react';

export default function CalculatorStepper({ step, purpose = 'investment' }: { step: number, purpose?: 'sale' | 'investment' }) {
  const steps = [
    { id: 1, label: "Básico", icon: DollarSign },
    { id: 2, label: "Detalles Físicos", icon: Home },
    { id: 3, label: "Riesgo Legal", icon: ShieldAlert },
  ];

  if (purpose === 'investment') {
    steps.push({ id: 4, label: "Contacto", icon: UserIcon });
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 mb-8 w-full relative overflow-hidden">
        {/* Background Decorative */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10">
           
            <div className="flex justify-between items-center relative max-w-3xl mx-auto px-4">
                
                {/* Connecting Line Container */}
                <div className="absolute left-0 right-0 top-5 h-1 bg-transparent -z-20 flex items-center px-4">
                    <div className="w-full h-1 bg-gray-100 rounded-full absolute" />
                    <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out absolute left-0" 
                        style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                    />
                </div>

                {steps.map((s) => {
                    const isCompleted = step > s.id;
                    const isCurrent = step === s.id;
                    const Icon = s.icon;

                    return (
                        <div key={s.id} className="flex flex-col items-center gap-2 relative group">
                            <motion.div 
                                initial={false}
                                animate={{ 
                                    scale: isCurrent ? 1.1 : 1,
                                    backgroundColor: isCurrent || isCompleted ? '#2563eb' : '#ffffff',
                                    borderColor: isCurrent || isCompleted ? '#2563eb' : '#e5e7eb'
                                }}
                                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center relative z-10 shadow-sm transition-colors duration-300
                                    ${isCurrent || isCompleted ? 'text-white shadow-blue-200 shadow-lg' : 'text-gray-400 bg-white'}`}
                            >
                                {isCompleted ? (
                                    <Check size={18} className="font-bold" />
                                ) : (
                                    <Icon size={18} />
                                )}
                                
                                {/* Pulse Effect for Current */}
                                {isCurrent && (
                                    <span className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping" />
                                )}
                            </motion.div>
                            
                            <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-blue-600' : 'text-gray-500'}`}>
                                {s.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
}
