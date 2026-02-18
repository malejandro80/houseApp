'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, TrendingUp, ShieldAlert, BadgeDollarSign } from 'lucide-react';

const suggestions = [
  {
    id: 1,
    icon: BadgeDollarSign,
    title: "La Regla del 1%",
    description: "Una propiedad es potencialmente rentable si la renta mensual bruta es cercana al 1% del precio de compra. ¡Úsalo como filtro rápido!",
    color: "bg-indigo-50 text-indigo-600"
  },
  {
    id: 2,
    icon: TrendingUp,
    title: "Plusvalía vs. Cashflow",
    description: "En zonas consolidadas el retorno por renta suele ser menor (3-5%), pero la seguridad y plusvalía son mayores. Define tu estrategia.",
    color: "bg-purple-50 text-purple-600"
  },
  {
    id: 3,
    icon: ShieldAlert,
    title: "Riesgos Ocultos",
    description: "Un precio muy bajo puede esconder problemas legales o estructurales. Revisa siempre la matriz de riesgos en el paso 3.",
    color: "bg-red-50 text-red-600"
  },
  {
    id: 4,
    icon: Lightbulb,
    title: "Tip de Negociación",
    description: "Usa el 'Cap Rate' calculado para justificar tu oferta. Si el mercado da 6% y la propiedad 4%, pide un descuento.",
    color: "bg-yellow-50 text-yellow-600"
  }
];

export default function SuggestionsSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % suggestions.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full flex flex-col justify-center">
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-100 p-8 h-[400px]">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Lightbulb size={120} />
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                <span className="w-8 h-1 bg-indigo-500 rounded-full"></span>
                Consejos de Inversión
            </h3>

            <div className="relative h-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                    >
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-sm ${suggestions[currentIndex].color}`}>
                            {(() => {
                                const Icon = suggestions[currentIndex].icon;
                                return <Icon size={28} />;
                            })()}
                        </div>
                        
                        <h4 className="text-2xl font-extrabold text-gray-900 mb-4 leading-tight">
                            {suggestions[currentIndex].title}
                        </h4>
                        
                        <p className="text-gray-700 text-lg leading-relaxed">
                            {suggestions[currentIndex].description}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Dots */}
            <div className="absolute bottom-6 left-8 flex gap-2">
                {suggestions.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            idx === currentIndex ? 'w-8 bg-indigo-600' : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    </div>
  );
}
