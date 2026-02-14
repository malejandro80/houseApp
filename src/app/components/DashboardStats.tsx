'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  TrendingUp, 
  Building2, 
  DollarSign, 
  PieChart, 
  Target,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Stats {
  totalValue: number;
  averageROI: number;
  activeListings: number;
  totalProperties: number;
  investmentCount: number;
  saleCount: number;
}

export default function DashboardStats({ userId }: { userId: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await supabase
        .from('properties')
        .select('sale_price, profitability, purpose, is_listed')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      const totalValue = data.reduce((acc, curr) => acc + (curr.sale_price || 0), 0);
      const totalROI = data.reduce((acc, curr) => acc + (curr.profitability || 0), 0);
      const averageROI = data.length > 0 ? totalROI / data.length : 0;
      const activeListings = data.filter(p => p.is_listed).length;
      const investmentCount = data.filter(p => p.purpose === 'investment').length;
      const saleCount = data.filter(p => p.purpose === 'sale').length;

      setStats({
        totalValue,
        averageROI,
        activeListings,
        totalProperties: data.length,
        investmentCount,
        saleCount
      });
      setLoading(false);
    }

    fetchStats();
  }, [userId, supabase]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-white/50 animate-pulse rounded-2xl border border-gray-100 shadow-sm" />
        ))}
      </div>
    );
  }

  if (!stats || stats.totalProperties === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Portfolio Value */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white shadow-xl shadow-blue-500/5 group hover:scale-[1.02] transition-transform duration-300"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <DollarSign size={20} aria-hidden="true" />
          </div>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-wider">Portfolio</span>
        </div>
        <p className="text-gray-700 text-xs font-bold uppercase tracking-tight mb-1">Valor Total</p>
        <h3 className="text-2xl font-black text-gray-900">
          ${(stats.totalValue / 1000000).toFixed(1)}M
        </h3>
        <p className="text-[10px] text-gray-600 mt-2 flex items-center gap-1 font-medium">
          <ArrowUpRight size={10} className="text-green-600" aria-hidden="true" /> 
          Basado en {stats.totalProperties} propiedades
        </p>
      </motion.div>

      {/* ROI average */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white shadow-xl shadow-emerald-500/5 group hover:scale-[1.02] transition-transform duration-300"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <TrendingUp size={20} />
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">Desempeño</span>
        </div>
        <p className="text-gray-700 text-xs font-bold uppercase tracking-tight mb-1">Rentabilidad Media</p>
        <h3 className="text-2xl font-black text-gray-900">
          {stats.averageROI.toFixed(1)}%
        </h3>
        <p className="text-[10px] text-gray-600 mt-2 flex items-center gap-1 font-medium">
          <Target size={10} className="text-emerald-600" aria-hidden="true" /> 
          Promedio de Yield Neto
        </p>
      </motion.div>

      {/* Active Listings */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white shadow-xl shadow-indigo-500/5 group hover:scale-[1.02] transition-transform duration-300"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Building2 size={20} />
          </div>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-wider">Mercado</span>
        </div>
        <p className="text-gray-700 text-xs font-bold uppercase tracking-tight mb-1">Anuncios Activos</p>
        <h3 className="text-2xl font-black text-gray-900">
          {stats.activeListings}
        </h3>
        <p className="text-[10px] text-gray-600 mt-2 flex items-center gap-1 font-medium">
          <ShieldCheck size={10} className="text-indigo-600" aria-hidden="true" /> 
          Visibles en el mapa público
        </p>
      </motion.div>

      {/* Purpose Distribution (Mini Chart Alternative) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white shadow-xl shadow-purple-500/5 group hover:scale-[1.02] transition-transform duration-300"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <PieChart size={20} />
          </div>
          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full uppercase tracking-wider">Estrategia</span>
        </div>
        <div className="flex items-end justify-between gap-1 h-8 mb-2">
            <div className="w-full bg-gray-100 rounded-t-sm relative group/bar">
                <div 
                    className="absolute bottom-0 left-0 w-full bg-blue-500 rounded-t-sm transition-all duration-500" 
                    style={{ height: `${(stats.investmentCount / stats.totalProperties) * 100}%` }}
                />
            </div>
            <div className="w-full bg-gray-100 rounded-t-sm relative group/bar">
                <div 
                    className="absolute bottom-0 left-0 w-full bg-purple-500 rounded-t-sm transition-all duration-500" 
                    style={{ height: `${(stats.saleCount / stats.totalProperties) * 100}%` }}
                />
            </div>
        </div>
        <div className="flex justify-between text-[8px] font-bold uppercase tracking-tighter">
            <span className="text-blue-600">Inv: {stats.investmentCount}</span>
            <span className="text-purple-600">Venta: {stats.saleCount}</span>
        </div>
      </motion.div>
    </div>
  );
}
