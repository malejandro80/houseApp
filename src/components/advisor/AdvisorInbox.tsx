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
    Loader2,
    Calendar
} from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';

import { 
    getAdvisorLeads,
    getUserInquiries,
    scheduleVisit,
    markLeadAsRead,
    getLeadMessages,
    sendChatMessage
} from '@/app/actions/leads';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

import { LeadMessage } from '@/common/types/leads';
import CalendlyLikeModal from '@/components/shared/CalendlyLikeModal';

interface AdvisorInboxProps {
    mode?: 'advisor' | 'user';
}

export default function AdvisorInbox({ mode = 'advisor' }: AdvisorInboxProps) {
    const searchParams = useSearchParams();
    const [messages, setMessages] = useState<LeadMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeId, setActiveId] = useState<string | null>(searchParams.get('id'));
    const [searchQuery, setSearchQuery] = useState('');
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [advisorReply, setAdvisorReply] = useState('');
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
    const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const lastTypingTimeRef = React.useRef<number>(0);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const supabase = createClient();

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

    React.useEffect(() => {
        if (!activeId) return;

        const currentMessage = messages.find(m => m.id === activeId);
        if (currentMessage && currentMessage.hasNew) {
            // Optimistically update UI
            setMessages(prev => prev.map(m => m.id === activeId ? { ...m, hasNew: false, status: mode === 'advisor' ? 'replied' : 'sent' } : m));

            // Inform server
            markLeadAsRead(activeId).catch(err => console.error("Could not mark as read", err));
        }

        // Fetch chat messages
        getLeadMessages(activeId).then(setChatMessages);
    }, [activeId, messages, mode]);

    // Abstraction of the socket connection
    const { emitEvent: _emitSocketEvent } = useSocket('realtime_inbox', (event: any) => {
        const { type, payload } = event;
        switch (type) {
            case 'NEW_MESSAGE':
                const newMsg = payload;
                if (newMsg.sender_id === currentUserId || newMsg.receiver_id === currentUserId) {
                    if (newMsg.lead_id === activeId) {
                        setChatMessages((prev) => {
                            const existingIdx = prev.findIndex(m => m.id === newMsg.id || (m.sender_id === newMsg.sender_id && m.message === newMsg.message && Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 10000));
                            if (existingIdx >= 0) {
                                const copy = [...prev];
                                copy[existingIdx] = newMsg;
                                // Clear typing indicator when message arrives
                                setIsTyping(prevTyping => ({ ...prevTyping, [newMsg.lead_id]: false }));
                                return copy;
                            }
                            // Clear typing indicator when message arrives
                            setIsTyping(prevTyping => ({ ...prevTyping, [newMsg.lead_id]: false }));
                            return [...prev, newMsg];
                        });
                        if (activeId && newMsg.receiver_id === currentUserId) {
                            markLeadAsRead(activeId).catch(() => {});
                        }
                    } else {
                        fetchData();
                    }
                }
                break;
            case 'TYPING':
                if (payload.sender_id !== currentUserId && payload.lead_id === activeId) {
                    setIsTyping(prev => ({ ...prev, [payload.lead_id]: true }));
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => {
                        setIsTyping(prev => ({ ...prev, [payload.lead_id]: false }));
                    }, 3000);
                }
                break;
            case 'NEW_NOTIFICATION':
                fetchData();
                break;
            default:
                console.log('Unknown socket event type:', type);
        }
    });

    React.useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
    }, [supabase]);

    const handleSendMessage = async () => {
        if (!advisorReply.trim() || !activeId) return;

        const currentActiveMessage = messages.find(m => m.id === activeId);
        
        const optimisticMessage = {
            id: `temp-${Date.now()}`,
            lead_id: activeId,
            sender_id: currentUserId,
            receiver_id: mode === 'advisor' ? currentActiveMessage?.sender_id : currentActiveMessage?.receiver_id,
            message: advisorReply.trim(),
            created_at: new Date().toISOString(),
            isOptimistic: true // UI flag
        };
        setChatMessages(prev => [...prev, optimisticMessage]);
        setAdvisorReply(''); // Clear input immediately

        try {
            // Background HTTP DB Mutation
            await sendChatMessage(activeId, optimisticMessage.message);
        } catch (error: any) {
            // Revert on failure
            console.error('Failed sending message', error);
            setChatMessages(prev => prev.filter(m => m.id !== optimisticMessage.id)); // rollback
            toast.error("Error al enviar el mensaje", {
                description: "Verifica tu conexión y vuelve a intentarlo.",
                icon: <AlertCircle size={14} className="text-red-500" />
            });
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

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
                        filteredMessages.map((msg) => {
                            const isUnread = msg.status === 'new' || (mode === 'user' && msg.status === 'replied');
                            return (
                                <div 
                                    key={msg.id}
                                    onClick={() => setActiveId(msg.id)}
                                    className={`p-5 border-b cursor-pointer transition-all relative group ${
                                        activeId === msg.id 
                                        ? 'bg-white border-transparent shadow-[4px_0_24px_-4px_rgba(0,0,0,0.05)] z-10' 
                                        : isUnread
                                            ? 'bg-indigo-50/50 border-indigo-100 hover:bg-white'
                                            : 'bg-transparent border-slate-100 hover:bg-white'
                                    }`}
                                >
                                    {activeId === msg.id && (
                                        <motion.div layoutId="activeMsg" className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full" />
                                    )}
                                    
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[13px] font-black tracking-tight ${isUnread ? 'text-slate-900' : 'text-slate-600'}`}>
                                                {msg.senderName}
                                            </span>
                                            {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]"></span>}
                                        </div>
                                        <span className={`text-[10px] font-bold ${isUnread ? 'text-indigo-600' : 'text-slate-400'}`}>{msg.timestamp}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 mb-2.5">
                                        <Building2 size={12} className={isUnread ? "text-indigo-400" : "text-slate-400"} />
                                        <span className={`text-[10px] font-bold truncate max-w-[200px] uppercase tracking-wider ${isUnread ? 'text-indigo-900' : 'text-slate-500'}`}>
                                            {msg.propertyTitle}
                                        </span>
                                    </div>
                                    
                                    <p className={`text-xs line-clamp-2 leading-relaxed pr-2 ${isUnread ? 'text-slate-600 font-bold' : 'text-slate-400'}`}>
                                        {msg.message}
                                    </p>

                                    {msg.status === 'replied' && (
                                        <div className="mt-3 flex items-center gap-1.5 text-[9px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 w-fit px-2 py-1 rounded-md">
                                            <CheckCircle2 size={10} />
                                            {mode === 'advisor' ? 'Respondido' : 'Nueva Respuesta'}
                                        </div>
                                    )}
                                    {msg.status === 'sent' && (
                                        <div className="mt-3 flex items-center gap-1.5 text-[9px] text-blue-500 font-black uppercase tracking-widest bg-blue-50 w-fit px-2 py-1 rounded-md">
                                            <Clock size={10} />
                                            Enviado
                                        </div>
                                    )}
                                </div>
                            );
                        })
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
                            <div className="flex-1 p-8 overflow-y-auto space-y-6 custom-scrollbar flex flex-col">
                                {/* Initial Inquiry */}
                                <div className="flex flex-col gap-2 max-w-2xl">
                                    <div className="bg-slate-100 p-5 rounded-3xl rounded-tl-none border border-slate-200 shadow-sm shadow-slate-200/20">
                                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                            {activeMessage.message}
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-bold pl-2">{activeMessage.timestamp}</span>
                                </div>

                                {/* Dynamic DB Messages */}
                                {chatMessages.map(msg => {
                                    const isMine = msg.sender_id === currentUserId;
                                    const isAgendarCitaMsg = msg.message.includes('me gustaría invitarte a conocer la propiedad. Por favor haz clic en el botón');
                                    
                                    return (
                                        <div key={msg.id} className={`flex flex-col gap-2 max-w-2xl ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
                                            <div className={`p-5 rounded-3xl shadow-sm ${
                                                isMine 
                                                ? 'bg-indigo-600 rounded-tr-none text-white shadow-indigo-600/20' 
                                                : 'bg-slate-100 rounded-tl-none border border-slate-200 text-slate-700 shadow-slate-200/20'
                                            }`}>
                                                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                                                    {msg.message}
                                                </p>
                                                
                                                {/* INJECT CTA IF IT PINGS FOR AN APPOINTMENT */}
                                                {isAgendarCitaMsg && mode === 'user' && (
                                                    <button 
                                                        onClick={() => setIsScheduleModalOpen(true)}
                                                        className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                                                    >
                                                        <Calendar size={16} />
                                                        Agendar Cita Ahora
                                                    </button>
                                                )}
                                                {isAgendarCitaMsg && mode === 'advisor' && (
                                                    <div className="mt-4 w-full py-3 bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                                        <Calendar size={16} />
                                                        Invitación Enviada
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-bold px-2 whitespace-nowrap">
                                                {new Date(msg.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} • {isMine ? 'Enviado' : 'Recibido'}
                                            </span>
                                        </div>
                                    );
                                })}
                                
                                {activeId && isTyping[activeId] && (
                                    <div className="flex flex-col gap-2 max-w-2xl self-start items-start animate-pulse">
                                        <div className="p-4 px-5 bg-slate-100 rounded-3xl rounded-tl-none border border-slate-200 text-slate-500 shadow-sm flex items-center gap-2">
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                            <span className="text-xs font-medium ml-1">Escribiendo...</span>
                                        </div>
                                    </div>
                                )}
                                
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Box */}
                            <div className="p-6 p-t-0 p-b-10 bg-white border-t border-slate-100">
                                <div className="relative group flex flex-col gap-2">
                                    <div className="flex justify-between items-center px-4 pt-2">
                                        {mode === 'advisor' ? (
                                            <button 
                                                onClick={() => setAdvisorReply(`Hola ${activeMessage.senderName.split(' ')[0]}, me gustaría invitarte a conocer la propiedad. Por favor haz clic en el botón 'Agendar Cita' para agendar el recorrido.`)}
                                                className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1.5"
                                            >
                                                <Calendar size={12} /> Solicitar Cita
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => setIsScheduleModalOpen(true)}
                                                className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1.5"
                                            >
                                                <Calendar size={12} /> Agendar Cita
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <textarea 
                                            value={advisorReply}
                                            onChange={(e) => {
                                                setAdvisorReply(e.target.value);
                                                if (activeId && currentUserId) {
                                                    const now = Date.now();
                                                    if (now - lastTypingTimeRef.current > 2000) {
                                                        _emitSocketEvent('TYPING', { sender_id: currentUserId, lead_id: activeId });
                                                        lastTypingTimeRef.current = now;
                                                    }
                                                }
                                            }}
                                            placeholder="Escribe tu mensaje..."
                                            className="w-full p-6 pb-16 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                                            rows={3}
                                            onKeyDown={(e) => {
                                                if(e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                        />
                                        <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                            <button 
                                                onClick={handleSendMessage}
                                                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                                                <Send size={16} />
                                                ENVIAR
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {mode === 'advisor' ? (
                                    <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                                        Tip: Una respuesta rápida aumenta el 40% las posibilidades de cierre
                                    </p>
                                ) : (
                                    <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                                        Responde a tu asesor o programa una visita
                                    </p>
                                )}
                            </div>
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

            {/* Calendly Modal Implementation */}
            {activeMessage && (
                <CalendlyLikeModal
                    isOpen={isScheduleModalOpen}
                    onClose={() => setIsScheduleModalOpen(false)}
                    agentName={mode === 'advisor' ? 'ti' : activeMessage.senderName}
                    propertyName={activeMessage.propertyTitle}
                    existingDate={activeMessage.scheduledDate}
                    advisorId={activeMessage.advisorId}
                    onSchedule={async (date) => {
                        try {
                            await scheduleVisit(activeMessage.id, date);
                        } catch (err) {
                            console.error("Error setting appointment:", err);
                        }
                    }}
                />
            )}
        </div>
    );
}
