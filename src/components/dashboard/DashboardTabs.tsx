'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, 
    MessageSquare, 
    Trello, 
    ShieldCheck,
    LucideIcon
} from 'lucide-react';
import MyPropertiesTable from '@/components/property/MyPropertiesTable';
import KanbanBoard from '@/components/advisor/KanbanBoard';
import AdvisorInbox from '@/components/advisor/AdvisorInbox';

interface Tab {
    id: string;
    label: string;
    icon: LucideIcon;
    color: string;
}

const TABS: Tab[] = [
    { id: 'properties', label: 'Portafolio', icon: LayoutDashboard, color: 'indigo' },
    { id: 'pipeline', label: 'Flujo de Ventas', icon: Trello, color: 'blue' },
    { id: 'inbox', label: 'Mensajes', icon: MessageSquare, color: 'emerald' },
];

export default function DashboardTabs({ userId }: { userId: string }) {
    const [activeTab, setActiveTab] = useState('properties');

    return (
        <div className="mt-12">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-white/50 backdrop-blur-md p-1.5 rounded-[2rem] border border-slate-200 w-fit mb-12 shadow-sm">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                relative flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-wider transition-all duration-300
                                ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-900'}
                            `}
                        >
                            {isActive && (
                                <motion.div 
                                    layoutId="activeTabAdvisor"
                                    className="absolute inset-0 bg-slate-900 rounded-[1.5rem] shadow-xl shadow-slate-900/10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <Icon size={16} />
                                {tab.label}
                                {tab.id === 'inbox' && (
                                    <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse`} />
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'properties' && (
                        <div>
                            <div className="flex items-center justify-between mb-8 px-2">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Propiedades Administradas</h2>
                                    <p className="text-slate-500 text-sm font-medium mt-1">Lista completa de unidades bajo tu gestión directa.</p>
                                </div>
                            </div>
                            <MyPropertiesTable userId={userId} viewMode="advisor" />
                        </div>
                    )}

                    {activeTab === 'pipeline' && (
                        <div>
                            <div className="mb-8 px-2">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pipeline Comercial</h2>
                                <p className="text-slate-500 text-sm font-medium mt-1">Gestiona el progreso de tus clientes desde el contacto hasta el cierre.</p>
                            </div>
                            <KanbanBoard />
                        </div>
                    )}

                    {activeTab === 'inbox' && (
                        <div>
                            <div className="mb-8 px-2">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Centro de Mensajes</h2>
                                <p className="text-slate-500 text-sm font-medium mt-1">Atiende solicitudes de prospectos y programa citas de inmediato.</p>
                            </div>
                            <AdvisorInbox />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
