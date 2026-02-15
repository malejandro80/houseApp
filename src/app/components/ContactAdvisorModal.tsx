'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, User as UserIcon, Phone, Mail, Building2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { submitInquiry } from '@/app/actions/leads';
import { createClient } from '@/lib/supabase/client';
import PhoneInput from './PhoneInput';

interface ContactAdvisorModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyTitle: string;
    propertyId: string;
    advisorName: string;
    advisorId: string | null;
    user: any;
}

export default function ContactAdvisorModal({ 
    isOpen, 
    onClose, 
    propertyTitle, 
    propertyId,
    advisorName, 
    advisorId,
    user 
}: ContactAdvisorModalProps) {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });

    // Pre-fill if user is logged in
    useEffect(() => {
        if (isOpen && user) {
            const fetchProfile = async () => {
                const supabase = createClient();
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();

                setFormData(prev => ({
                    ...prev,
                    name: profile?.full_name || prev.name,
                    email: user.email || prev.email
                }));
            };
            fetchProfile();
        }
    }, [isOpen, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!advisorId) {
            toast.error('Lo sentimos, esta propiedad no tiene un asesor asignado.');
            return;
        }

        setLoading(true);
        try {
            await submitInquiry({
                advisor_id: advisorId,
                property_id: propertyId,
                property_title: propertyTitle,
                client_name: formData.name,
                client_email: formData.email,
                client_phone: formData.phone,
                message: formData.message
            });
            
            setIsSubmitted(true);
            toast.success('Mensaje enviado al asesor con éxito');
        } catch (error) {
            console.error('Error in submission:', error);
            toast.error('Hubo un error al enviar tu solicitud. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100]"
                    />

                    {/* Modal */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl z-[110] overflow-hidden"
                    >
                        {!isSubmitted ? (
                            <form onSubmit={handleSubmit} className="p-8 sm:p-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                                            <MessageSquare size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Contactar Asesor</h3>
                                            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">{advisorName}</p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={onClose}
                                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-8 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Interés en:</span>
                                        <span className="text-xs font-black text-slate-900">{propertyTitle}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            required
                                            type="text" 
                                            placeholder="Tu nombre completo"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input 
                                                required
                                                type="email" 
                                                placeholder="Correo electrónico"
                                                value={formData.email}
                                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={18} />
                                            <PhoneInput 
                                                required
                                                placeholder="Teléfono móvil"
                                                value={formData.phone}
                                                onChange={(val) => setFormData({...formData, phone: val})}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <textarea 
                                            required
                                            placeholder="¿En qué podemos ayudarte? (ej. Quiero agendar una visita)"
                                            value={formData.message}
                                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                                            rows={4}
                                        />
                                    </div>
                                </div>

                                <button 
                                    disabled={loading}
                                    type="submit"
                                    className="w-full mt-8 py-4 bg-slate-900 text-white rounded-[1.5rem] text-sm font-black flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                >
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            ENVIAR SOLICITUD
                                        </>
                                    )}
                                </button>
                                
                                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6">
                                    Tus datos están protegidos por nuestra política de privacidad
                                </p>
                            </form>
                        ) : (
                            <div className="p-12 text-center flex flex-col items-center">
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6"
                                >
                                    <CheckCircle2 size={40} />
                                </motion.div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">¡Mensaje Enviado!</h3>
                                <p className="text-slate-500 font-medium mb-8">El asesor {advisorName} ha recibido tu mensaje y se pondrá en contacto contigo lo antes posible.</p>
                                <button 
                                    onClick={onClose}
                                    className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] text-sm font-black hover:bg-black transition-all"
                                >
                                    ENTENDIDO
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
