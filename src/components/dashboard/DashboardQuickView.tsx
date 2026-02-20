'use client';

import React from 'react';
import { Calendar, MessageSquare, User, MapPin, ArrowRight } from 'lucide-react';
import { Lead } from '@/common/types/leads';
import Link from 'next/link';

interface DashboardQuickViewProps {
    weeklyVisits: Lead[];
    pendingLeads: Lead[];
}

export default function DashboardQuickView({ weeklyVisits, pendingLeads }: DashboardQuickViewProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
            {/* Visitas de esta semana */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Visitas de esta semana</h3>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">Gestión de Citas</p>
                        </div>
                    </div>
                    <span className="bg-amber-100 text-amber-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                        {weeklyVisits.length} Pendientes
                    </span>
                </div>

                <div className="flex-1 space-y-4">
                    {weeklyVisits.length > 0 ? (
                        weeklyVisits.slice(0, 3).map((lead) => (
                            <div key={lead.id} className="group p-5 bg-slate-50 rounded-3xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{lead.title}</h4>
                                    <span className="text-[10px] font-black text-slate-400">{new Date(lead.updated_at).toLocaleDateString('es-CO')}</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                    <div className="flex items-center gap-1.5"><User size={12} /> {lead.client_name}</div>
                                    <div className="flex items-center gap-1.5"><MapPin size={12} /> {lead.address_reference || 'Ubicación pendiente'}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                <Calendar size={32} />
                            </div>
                            <p className="text-slate-400 text-sm font-bold">No hay visitas programadas para esta semana</p>
                        </div>
                    )}
                </div>

                <Link href="/advisor/pipeline" className="mt-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10">
                    Ir al Pipeline <ArrowRight size={14} />
                </Link>
            </div>

            {/* Leads por responder */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Leads por responder</h3>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">Nuevos Prospectos</p>
                        </div>
                    </div>
                    <span className="bg-indigo-100 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                        {pendingLeads.length} Nuevos
                    </span>
                </div>

                <div className="flex-1 space-y-4">
                    {pendingLeads.length > 0 ? (
                        pendingLeads.slice(0, 3).map((lead) => (
                            <div key={lead.id} className="group p-5 bg-slate-50 rounded-3xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{lead.title}</h4>
                                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-black rounded-full uppercase tracking-tighter">Prioridad {lead.priority}</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                                    <div className="flex items-center gap-1.5"><User size={12} /> {lead.client_name}</div>
                                    <div className="flex items-center gap-1.5 font-bold text-indigo-600">{lead.estimated_value ? `$${lead.estimated_value}M` : 'Consultar'}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                <MessageSquare size={32} />
                            </div>
                            <p className="text-slate-400 text-sm font-bold">Todos los prospectos han sido atendidos</p>
                        </div>
                    )}
                </div>

                <Link href="/advisor/pipeline" className="mt-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/10">
                    Gestionar Prospectos <ArrowRight size={14} />
                </Link>
            </div>
        </div>
    );
}
