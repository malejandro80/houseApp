'use client';

import { Activity, DollarSign, Umbrella, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, BadgeDollarSign } from 'lucide-react';
import { ProfitabilityResult } from '../hooks/usePropertyProfitability';
import Tooltip from './Tooltip';

type FinancialDashboardProps = {
  result: ProfitabilityResult;
};

function GaugeChart({ value, max = 10 }: { value: number; max?: number }) {
  // Clamp value between 0 and max
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = (clampedValue / max) * 100;
  
  // Determine color based on value
  let color = '#ef4444'; // Red-500
  if (value >= 6) color = '#22c55e'; // Green-500
  else if (value >= 3) color = '#eab308'; // Yellow-500

  return (
    <div className="relative w-48 h-24 mx-auto overflow-hidden">

        
       {/* SVG Implementation for better control */}
       <svg viewBox="0 0 100 50" className="absolute top-0 left-0 w-full h-full z-20 overflow-visible">
            {/* Background Path */}
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f3f4f6" strokeWidth="12" strokeLinecap="round" />
            {/* Value Path */}
            <path 
                d="M 10 50 A 40 40 0 0 1 90 50" 
                fill="none" 
                stroke={color} 
                strokeWidth="12" 
                strokeLinecap="round" 
                strokeDasharray="126" // Approximate semi-circle length
                strokeDashoffset={126 - (126 * (percentage / 100))}
                className="transition-all duration-1000 ease-out"
            />
       </svg>

      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 mb-2 text-center">
        <span className="text-3xl font-bold text-gray-800">{value.toFixed(1)}%</span>
        <span className="block text-xs text-gray-400">Retorno Neto</span>
      </div>
    </div>
  );
}

export default function FinancialDashboard({ result }: FinancialDashboardProps) {

  const getHealthLabel = (health: typeof result.investmentHealth) => {
    switch (health) {
      case 'safe': return { text: 'Inversión Segura', color: 'text-green-600', bg: 'bg-green-50', icon: ShieldCheck };
      case 'average': return { text: 'Inversión Promedio', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: BadgeDollarSign };
      case 'risky': return { text: 'Riesgo Alto', color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle };
    }
  };

  const health = getHealthLabel(result.investmentHealth);
  const HealthIcon = health.icon;

  return (
    <div className="mt-8 space-y-6 animate-fade-in-up">
      
      {/* Section 1: Traffic Light / Gauge */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 flex flex-col items-center">
        <h3 className="text-gray-500 font-medium mb-4 uppercase tracking-wide text-xs flex items-center gap-1 relative z-30">
            Salud Financiera
            <Tooltip text="Es como un semáforo: Verde es muy bueno, Amarillo es normal y Rojo es peligroso." />
        </h3>
        
        <GaugeChart value={result.netYield} />
        
        <div className={`mt-4 px-4 py-2 rounded-full flex items-center gap-2 ${health.bg} ${health.color}`}>
          <HealthIcon size={18} />
          <span className="font-bold text-sm tracking-tight">{health.text}</span>
        </div>
      </div>

      {/* Section 2: Financial Translation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Cash Flow */}
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-30">
            <DollarSign size={40} className="text-blue-600" />
          </div>
          <div className="text-xs font-semibold text-blue-600 uppercase mb-1 flex items-center gap-1 relative z-30">
            Tu Bolsillo (Mensual)
            <Tooltip text="Es el dinero que te sobra cada mes para gastar después de pagar todo." />
          </div>
          <h4 className="text-2xl font-bold text-gray-800">
             {result.cashFlow >= 0 ? '+' : ''}${result.cashFlow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </h4>
          <p className="text-xs text-gray-500 mt-2">
            Dinero real libre tras pagar todos los gastos estimados.
          </p>
        </div>

        {/* Card 2: Resilience */}
        <div className="bg-purple-50 rounded-xl p-5 border border-purple-100 relative overflow-hidden group hover:shadow-md transition-shadow">
           <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-30">
            <Umbrella size={40} className="text-purple-600" />
          </div>
          <div className="text-xs font-semibold text-purple-600 uppercase mb-1 flex items-center gap-1 relative z-30">
            Fondo Seguridad
            <Tooltip text="Es el dinero que deberías guardar 'por si acaso' la casa se queda vacía un tiempo." />
          </div>
          <h4 className="text-2xl font-bold text-gray-800">
            ${result.emergencyFund.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </h4>
          <p className="text-xs text-gray-500 mt-2">
            Ahorro sugerido para cubrir 1 mes de vacancia.
          </p>
        </div>

        {/* Card 3: Context / Market */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 relative overflow-hidden group hover:shadow-md transition-shadow">
           <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-30">
            <Activity size={40} className="text-gray-600" />
          </div>
          <div className="text-xs font-semibold text-gray-600 uppercase mb-1 flex items-center gap-1 relative z-30">
            Vs. Mercado
            <Tooltip text="Te dice si tu inversión gana mas (+) o menos (-) dinero que otras casas en la zona." />
          </div>
          <div className="flex items-end gap-2">
             <h4 className="text-2xl font-bold text-gray-800">
                {result.comparisonVsMarket > 0 ? '+' : ''}{result.comparisonVsMarket.toFixed(1)}%
             </h4>
             <span className="mb-1">
                {result.comparisonVsMarket >= 0 ? 
                    <TrendingUp size={16} className="text-green-500" /> : 
                    <TrendingDown size={16} className="text-red-500" />
                }
             </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Rendimiento comparado con el promedio de la zona.
          </p>
        </div>

      </div>
    </div>
  );
}
