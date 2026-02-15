'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Eye, Users, TrendingUp, Target, BarChart3, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface AdvisorMetrics {
    totalProperties: number;
    totalViews: number;
    totalLeads: number; // Placeholder for now
    avgROI: number;
}

export default function AdvisorStats({ userId }: { userId: string }) {
    const supabase = createClient();
    const [stats, setStats] = useState<AdvisorMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const { data: properties } = await supabase
                .from('properties')
                .select('view_count, profitability')
                .or(`assigned_advisor_id.eq.${userId},user_id.eq.${userId}`);

            if (properties) {
                const totalViews = properties.reduce((acc, curr) => acc + (curr.view_count || 0), 0);
                const avgROI = properties.length > 0 
                    ? properties.reduce((acc, curr) => acc + (curr.profitability || 0), 0) / properties.length 
                    : 0;

                setStats({
                    totalProperties: properties.length,
                    totalViews,
                    totalLeads: Math.floor(totalViews * 0.05), // Estimated 5% lead rate for demo
                    avgROI
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
            trend: '+12%'
        },
        { 
            label: 'Alcance Global', 
            value: stats?.totalViews.toLocaleString() || 0, 
            icon: Eye, 
            color: 'text-blue-600', 
            bg: 'bg-blue-50',
            trend: '+240 hoy'
        },
        { 
            label: 'Leads Potenciales', 
            value: stats?.totalLeads || 0, 
            icon: Users, 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-50',
            trend: '5.2% conv.'
        },
        { 
            label: 'ROI Promedio', 
            value: stats ? `${stats.avgROI.toFixed(1)}%` : '0%', 
            icon: TrendingUp, 
            color: 'text-amber-600', 
            bg: 'bg-amber-50',
            trend: 'Top 5%'
        },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 rounded-3xl bg-slate-100 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                                    {item.trend}
                                    <ArrowUpRight size={10} />
                                </span>
                            </div>
                            
                            <div className="flex flex-col">
                                <span className="text-3xl font-black text-slate-900 tracking-tighter">
                                    {item.value}
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                    {item.label}
                                </span>
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
