import { motion } from 'framer-motion';
import { Search, Megaphone, ArrowRight } from 'lucide-react';

interface InitialChoiceProps {
  onSelect: (mode: 'buy' | 'sell') => void;
}

export default function InitialChoice({ onSelect }: InitialChoiceProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
          ¿Cuál es tu objetivo hoy?
        </h2>
        <p className="text-gray-500 text-lg">
          Personalizaremos las herramientas según tus necesidades.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option 1: Buy/Invest */}
        <motion.button
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('buy')}
          className="group relative bg-white border border-gray-200 rounded-3xl p-8 hover:border-blue-500 hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
             <Search size={120} className="text-blue-600" />
          </div>

          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Search size={28} />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-3">Registrar potencial compra</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-6 group-hover:text-gray-600">
            Analiza la rentabilidad, riesgos y potencial de una propiedad antes de tomar una decisión de inversión.
          </p>
          
          <span className="inline-flex items-center text-blue-600 font-bold text-sm">
            Comenzar Análisis <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </span>
        </motion.button>

        {/* Option 2: Sell */}
        <motion.button
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('sell')}
          className="group relative bg-white border border-gray-200 rounded-3xl p-8 hover:border-indigo-500 hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
        >
           <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
             <Megaphone size={120} className="text-indigo-600" />
          </div>

          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Megaphone size={28} />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-3">Publicar propiedad para venta</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-6 group-hover:text-gray-600">
            Calcula el precio óptimo y prepara tu inmueble para ser listado ante miles de inversores calificados.
          </p>
          
          <span className="inline-flex items-center text-indigo-600 font-bold text-sm">
            Listar Propiedad <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </span>
        </motion.button>
      </div>
    </div>
  );
}
