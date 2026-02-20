'use client';

import { useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    Filter, 
    MoreVertical, 
    MessageSquare, 
    Building2, 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    Send,
    Phone,
    Mail,
    User,
    ChevronRight,
    SearchX,
    Loader2
} from 'lucide-react';

import { 
    getAdvisorLeads,
    getUserInquiries
} from '@/app/actions/leads';
import { toast } from 'sonner';

import { LeadMessage } from '@/common/types/leads';

interface AdvisorInboxProps {
    mode?: 'advisor' | 'user';
}

export default function AdvisorInbox({ mode = 'advisor' }: AdvisorInboxProps) {
    const searchParams = useSearchParams();
    const [messages, setMessages] = useState<LeadMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeId, setActiveId] = useState<string | null>(searchParams.get('id'));
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        try {
            const data = mode === 'advisor' 
                ? await getAdvisorLeads() 
                : await getUserInquiries();
            
            setMessages(data as any);
            if (data.length > 0 && !activeId) {
                setActiveId(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
            toast.error('Error al cargar los mensajes');
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const activeMessage = messages.find(m => m.id === activeId);

    const filteredMessages = messages.filter(m => 
        m.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col lg:flex-row h-[700px] bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl shadow-slate-200/50">
            {/* Sidebar List */}
            <div className="w-full lg:w-96 flex flex-col border-r border-slate-100 bg-slate-50/50">
                <div className="p-6 border-b border-slate-100 bg-white">
                    <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                        {mode === 'advisor' ? 'Mensajes' : 'Mis Consultas'}
                        <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                            {messages.filter(m => m.status === 'new' || (mode === 'user' && m.status === 'replied')).length}
                        </span>
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder={mode === 'advisor' ? "Buscar en mensajes..." : "Buscar mis consultas..."} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                            <Loader2 className="animate-spin" size={32} />
                            <p className="text-xs font-bold uppercase tracking-widest">Cargando leads...</p>
                        </div>
                    ) : filteredMessages.length > 0 ? (
                        filteredMessages.map((msg) => (
                            <div 
                                key={msg.id}
                                onClick={() => setActiveId(msg.id)}
                                className={`p-4 border-b border-slate-100 cursor-pointer transition-all hover:bg-white relative group ${activeId === msg.id ? 'bg-white' : ''}`}
                            >
                                {activeId === msg.id && (
                                    <motion.div layoutId="activeMsg" className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full" />
                                )}
                                
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[13px] font-black ${msg.hasNew ? 'text-slate-900' : 'text-slate-600'}`}>
                                        {msg.senderName}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold">{msg.timestamp}</span>
                                </div>
                                
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Building2 size={10} className="text-slate-400" />
                                    <span className="text-[10px] text-slate-500 font-bold truncate max-w-[200px] uppercase tracking-wider">{msg.propertyTitle}</span>
                                </div>
                                
                                <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed">
                                    {msg.message}
                                </p>

                                {msg.status === 'replied' && (
                                    <div className="mt-2 flex items-center gap-1 text-[9px] text-emerald-600 font-black uppercase tracking-widest">
                                        <CheckCircle2 size={10} />
                                        {mode === 'advisor' ? 'Respondido' : 'Nueva Respuesta'}
                                    </div>
                                )}
                                {msg.status === 'sent' && (
                                    <div className="mt-2 flex items-center gap-1 text-[9px] text-blue-500 font-black uppercase tracking-widest">
                                        <Clock size={10} />
                                        Enviado
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center flex flex-col items-center gap-4">
                            <SearchX className="text-slate-200" size={48} />
                            <p className="text-slate-400 text-sm font-medium">No se encontraron mensajes</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col bg-white">
                <AnimatePresence mode="wait">
                    {activeMessage ? (
                        <motion.div 
                            key={activeMessage.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col h-full"
                        >
                            {/* Message Header */}
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg">
                                        {activeMessage.senderName[0]}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-slate-900">{activeMessage.senderName}</h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                <Mail size={12} />
                                                {activeMessage.senderEmail}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest border-l border-slate-200 pl-3">
                                                <Phone size={12} />
                                                {activeMessage.senderPhone}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button className="p-3 hover:bg-slate-50 rounded-xl text-slate-400">
                                    <MoreVertical size={20} />
                                </button>
                            </div>

                            {/* Property Reference */}
                            <div className="p-4 bg-slate-50/50 flex items-center justify-between px-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-400">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Interés en:</span>
                                        <span className="text-xs font-black text-slate-900">{activeMessage.propertyTitle}</span>
                                    </div>
                                </div>
                                <button className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors">
                                    Ver Propiedad
                                    <ChevronRight size={12} />
                                </button>
                            </div>

                            {/* Conversation */}
                            <div className="flex-1 p-8 overflow-y-auto space-y-6">
                                <div className="flex flex-col gap-2 max-w-2xl">
                                    <div className="bg-slate-100 p-5 rounded-3xl rounded-tl-none border border-slate-200 shadow-sm shadow-slate-200/20">
                                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                            {activeMessage.message}
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-bold pl-2">{activeMessage.timestamp}</span>
                                </div>

                                {activeMessage.status === 'replied' && (
                                    <div className="flex flex-col items-end gap-2 text-right">
                                        <div className="bg-indigo-600 p-5 rounded-3xl rounded-tr-none text-white shadow-xl shadow-indigo-600/20">
                                            <p className="text-sm font-medium leading-relaxed">
                                                Hola {activeMessage.senderName.split(' ')[0]}, ¡con gusto! El sábado a las 10 AM estaré esperándote en la propiedad. ¿Te parece bien?
                                            </p>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-bold pr-2">Ayer • Respondido</span>
                                    </div>
                                )}
                            </div>

                            {/* Reply Box - Only for Advisor */}
                            {mode === 'advisor' ? (
                                <div className="p-6 p-t-0 p-b-10 bg-white">
                                    <div className="relative group">
                                        <textarea 
                                            placeholder="Escribe tu respuesta comercial..."
                                            className="w-full p-6 pb-16 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                                            rows={4}
                                        />
                                        <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                            <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                                                <Send size={16} />
                                                RESPONDER AHORA
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                                        Tip: Una respuesta rápida aumenta el 40% las posibilidades de cierre
                                    </p>
                                </div>
                            ) : (
                                <div className="p-8 bg-indigo-50/50 border-t border-indigo-100 flex items-center justify-center gap-3">
                                    <AlertCircle className="text-indigo-600" size={16} />
                                    <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                                        Tu asesor revisará este mensaje y te responderá por este medio
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                                <MessageSquare size={40} />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 mb-2">
                                {mode === 'advisor' ? 'Selecciona un lead' : 'Selecciona un mensaje'}
                            </h4>
                            <p className="text-slate-400 text-sm max-w-xs font-medium">
                                {mode === 'advisor' 
                                    ? 'Haz clic en un mensaje de la izquierda para comenzar la gestión comercial.' 
                                    : 'Aquí podrás ver el historial de tus consultas y las respuestas de nuestros asesores.'}
                            </p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
