'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import NumberInput from './NumberInput';

export default function MiniCalculator() {
  const [price, setPrice] = useState<number | ''>('');
  const [rent, setRent] = useState<number | ''>('');
  const [yieldResult, setYieldResult] = useState<number>(0);
  const [status, setStatus] = useState<'bad' | 'ok' | 'good'>('ok');

  useEffect(() => {
    if (price && rent && Number(price) > 0) {
      const annualRent = Number(rent) * 12;
      const calculatedYield = (annualRent / Number(price)) * 100;
      setYieldResult(calculatedYield);

      if (calculatedYield < 5) setStatus('bad');
      else if (calculatedYield < 10) setStatus('ok');
      else setStatus('good');
    } else {
      setYieldResult(0);
      setStatus('ok');
    }
  }, [price, rent]);

  const getFeedback = () => {
    if (!yieldResult) return "Ingresa los valores para calcular.";
    const years = (100 / yieldResult).toFixed(1);
    
    if (status === 'bad') return `Rentabilidad Baja (<5%). Retorno menor al promedio. Recuperarías tu inversión en ${years} años.`;
    if (status === 'ok') return `Rentabilidad Moderada (5-10%). Es una inversión estándar. Recuperarías tu inversión en ${years} años.`;
    return `¡Excelente Oportunidad! (>10%). El retorno es muy atractivo. Recuperarías tu inversión en tan solo ${years} años.`;
  };

  const getColor = () => {
    if (status === 'bad') return 'text-red-500';
    if (status === 'ok') return 'text-yellow-500';
    return 'text-green-500';
  };

  const getBgColor = () => {
    if (status === 'bad') return 'bg-red-500';
    if (status === 'ok') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20 w-full max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
          <Calculator size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Calculadora Rápida</h3>
          <p className="text-xs text-gray-500">Evalúa el potencial en segundos</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Precio de Compra</label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <NumberInput
              value={price}
              onChange={(val) => setPrice(val !== undefined ? val : '')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-8 pr-4 text-gray-800 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-normal"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Renta Mensual Estimada</label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <NumberInput
              value={rent}
              onChange={(val) => setRent(val !== undefined ? val : '')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-8 pr-4 text-gray-800 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-normal"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Thermometer / Meter */}
        <div className="pt-6">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-gray-600">Yield Bruto (Anual)</span>
            <span className={`text-3xl font-black ${getColor()} transition-colors duration-500`}>
              {yieldResult.toFixed(1)}%
            </span>
          </div>
          
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden relative">
            {/* Markers */}
            <div className="absolute top-0 bottom-0 left-[33%] w-0.5 bg-white/50 z-10"></div>
            <div className="absolute top-0 bottom-0 left-[66%] w-0.5 bg-white/50 z-10"></div>
            
            <motion.div
              className={`h-full ${getBgColor()}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(yieldResult * 8, 100)}%` }} // Scale roughly: 12.5% yield fills bar
              transition={{ type: "spring", stiffness: 60 }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1 uppercase font-bold">
            <span>Bajo (&lt;5%)</span>
            <span>Moderado (5-8%)</span>
            <span>Alto (&gt;8%)</span>
          </div>
        </div>

        {/* Recommendation Box */}
        <AnimatePresence mode='wait'>
          {yieldResult > 0 && (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mt-4 p-4 rounded-xl border-l-4 ${
                status === 'bad' ? 'bg-red-50 border-red-500' : 
                status === 'ok' ? 'bg-yellow-50 border-yellow-500' : 
                'bg-green-50 border-green-500'
              }`}
            >
              <div className="flex items-start gap-3">
                {status === 'bad' && <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />}
                {status === 'ok' && <TrendingUp className="text-yellow-600 shrink-0 mt-0.5" size={18} />}
                {status === 'good' && <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} />}
                <p className={`text-sm ${
                    status === 'bad' ? 'text-red-800' : 
                    status === 'ok' ? 'text-yellow-800' : 
                    'text-green-800'
                }`}>
                  {getFeedback()}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
