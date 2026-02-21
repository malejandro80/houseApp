'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Eye, Users, TrendingUp, Target, BarChart3, ArrowUpRight, DollarSign, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface AdvisorMetrics {
    totalProperties: number;
    activeListings: number;
    ingresosBrutos: number;
    ingresosRealizados: number;
    currentXp: number;
    currentTier: string;
    avgROI: number;
}

export default function AdvisorStats({ userId }: { userId: string }) {
    const supabase = createClient();
    const [stats, setStats] = useState<AdvisorMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            // Get properties where the advisor manages leads
            const { data: leads } = await supabase
                .from('leads')
                .select('property_id')
                .eq('advisor_id', userId);
            
            const leadPropertyIds = leads ? Array.from(new Set(leads.map(l => l.property_id).filter(Boolean))) : [];
            
            let orQuery = `assigned_advisor_id.eq.${userId},user_id.eq.${userId}`;
            if (leadPropertyIds.length > 0) {
                orQuery += `,id.in.(${leadPropertyIds.join(',')})`;
            }

            const [{ data: properties, error }, { data: metricsData }] = await Promise.all([
                supabase
                    .from('properties')
                    .select('*')
                    .or(orQuery),
                supabase
                    .from('advisor_metrics')
                    .select('current_xp, current_tier')
                    .eq('advisor_id', userId)
                    .maybeSingle()
            ]);

            if (error) {
                console.error('Error fetching advisor stats:', error);
            }

            if (properties) {
                const avgROI = properties.length > 0 
                    ? properties.reduce((acc, curr) => acc + (curr.profitability || 0), 0) / properties.length 
                    : 0;
                const activeListings = properties.filter(p => p.is_listed).length;
                
                const ingresosBrutos = properties
                    .filter(p => p.is_listed)
                    .reduce((acc, curr) => acc + (curr.sale_price || 0), 0) * 0.01;

                const ingresosRealizados = properties
                    .reduce((acc, curr) => acc + (curr.closed_price || 0), 0) * 0.01;

                // Simulated total leads
                const totalViews = (properties.length * 85) + (activeListings * 155);

                setStats({
                    totalProperties: properties.length,
                    activeListings,
                    ingresosBrutos,
                    ingresosRealizados,
                    currentXp: metricsData?.current_xp || 0,
                    currentTier: metricsData?.current_tier || 'ROOKIE',
                    avgROI
                });
            } else if (metricsData) {
                // If there are no properties but there are metrics
                setStats({
                    totalProperties: 0,
                    activeListings: 0,
                    ingresosBrutos: 0,
                    ingresosRealizados: 0,
                    currentXp: metricsData.current_xp || 0,
                    currentTier: metricsData.current_tier || 'ROOKIE',
                    avgROI: 0
                });
            }
            setLoading(false);
        };

        fetchStats();
    }, [userId, supabase]);

    const items = [
        { 
            label: 'Unidades Gestionadas', 
            value: stats?.totalProperties || 0, 
            icon: Target, 
            color: 'text-indigo-600', 
            bg: 'bg-indigo-50',
            trend: stats ? `${stats.activeListings} activas` : '0 activas',
            isSpecial: true
        },
        { 
            label: 'Ingresos Realizados', 
            value: stats ? `$${stats.ingresosRealizados.toLocaleString('es-CO', { maximumFractionDigits: 0 })}` : '$0', 
            icon: DollarSign, 
            color: 'text-blue-600', 
            bg: 'bg-blue-50',
            trend: stats ? `Brutos: $${stats.ingresosBrutos >= 1000000 ? (stats.ingresosBrutos / 1000000).toFixed(1) + 'M' : stats.ingresosBrutos.toLocaleString('es-CO', { maximumFractionDigits: 0 })}` : 'Brutos: $0',
            isSpecial: false
        },
        { 
            label: 'Nivel de Asesor', 
            value: stats?.currentTier || 'ROOKIE', 
            icon: Award, 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-50',
            trend: stats ? `${stats.currentXp} XP` : '0 XP',
            isSpecial: false,
            isLevelCard: true
        }
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 rounded-3xl bg-slate-100 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => {
                const Icon = item.icon;
                return (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative group overflow-hidden bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500"
                    >
                        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                            <Icon size={80} />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-2xl ${item.bg} ${item.color} shadow-inner`}>
                                    <Icon size={20} />
                                </div>
                                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${item.bg} ${item.color} flex items-center gap-1`}>
                                    {item.isSpecial ? (
                                        <>
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-0.5 animate-pulse" />
                                            {item.trend}
                                        </>
                                    ) : (
                                        <>
                                            {item.trend}
                                            <ArrowUpRight size={10} />
                                        </>
                                    )}
                                </span>
                            </div>
                            
                            <div className="flex flex-col">
                                <span className="text-3xl font-black text-slate-900 tracking-tighter">
                                    {item.value}
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                    {item.label}
                                </span>
                                
                                {item.isLevelCard && stats && (
                                    <div className="mt-3">
                                        <div className="w-full bg-slate-100 rounded-full h-1 mb-1 overflow-hidden shadow-inner">
                                            <div 
                                                className="bg-emerald-500 h-1 rounded-full transition-all duration-1000" 
                                                style={{ width: `${stats.currentTier === 'DIAMOND' ? 100 : Math.min(100, (stats.currentXp / (stats.currentTier === 'ROOKIE' ? 5000 : 10000)) * 100)}%` }}
                                            />
                                        </div>
                                        <div className="text-[8px] text-slate-400 font-bold uppercase text-right tracking-tighter mt-1">
                                            {stats.currentTier === 'DIAMOND' 
                                                ? 'Nivel Máximo' 
                                                : `Faltan ${stats.currentTier === 'ROOKIE' ? 5000 - stats.currentXp : 10000 - stats.currentXp} XP para el siguiente nivel`}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Dynamic accent line */}
                        <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-700 ${item.color.replace('text', 'bg')}`} />
                    </motion.div>
                );
            })}
        </div>
    );
}
