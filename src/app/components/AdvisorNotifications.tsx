'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, MessageSquare, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserRole } from '@/hooks/useUserRole';

export default function AdvisorNotifications() {
    const { role } = useUserRole();
    const [isOpen, setIsOpen] = useState(false);
    
    // Static mock for now
    const hasUnread = true;
    const isExpert = role === 'asesor' || role === 'superadmin';

    if (!isExpert) return null;

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-all active:scale-95 border border-slate-100"
            >
                <Bell size={20} />
                {hasUnread && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notificaciones</span>
                                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">1 Nueva</span>
                            </div>
                            
                            <div className="max-h-96 overflow-y-auto">
                                <Link 
                                    href="/advisor/inbox"
                                    onClick={() => setIsOpen(false)}
                                    className="p-5 hover:bg-indigo-50/30 transition-colors flex gap-4 border-b border-slate-50 relative group"
                                >
                                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl h-fit">
                                        <MessageSquare size={18} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">Nuevo Lead Recibido</span>
                                            <Circle size={6} className="text-indigo-600 fill-indigo-600" />
                                        </div>
                                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
                                            Miguel Alejandro preguntó por "Apartamento de Lujo Poblado". ¡Responde pronto!
                                        </p>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Hace 10 minutos</span>
                                    </div>
                                </Link>
                            </div>

                            <Link 
                                href="/advisor/inbox"
                                onClick={() => setIsOpen(false)}
                                className="p-4 bg-slate-900 text-white text-center text-[10px] font-black uppercase tracking-[0.2em] block hover:bg-black transition-colors"
                            >
                                Ver Todo el Centro de Leads
                            </Link>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
