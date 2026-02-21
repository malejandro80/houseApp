'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, X, ChevronRight, CheckCircle2 } from 'lucide-react';

interface CalendlyLikeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSchedule: (date: Date) => Promise<void>;
    agentName?: string;
    propertyName?: string;
}

export default function CalendlyLikeModal({ isOpen, onClose, onSchedule, agentName = 'El Asesor', propertyName = 'la propiedad' }: CalendlyLikeModalProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Generate next 14 days
    const today = startOfToday();
    const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

    // Fake available times
    const availableTimes = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

    const handleConfirm = async () => {
        if (!selectedDate || !selectedTime) return;

        setIsSubmitting(true);
        try {
            // Merge date and time
            const [hours, minutes] = selectedTime.split(':').map(Number);
            const finalDate = new Date(selectedDate);
            finalDate.setHours(hours, minutes, 0, 0);

            await onSchedule(finalDate);
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setTimeout(() => setIsSuccess(false), 500);
            }, 2000);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm sm:p-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative"
                >
                    <button 
                        onClick={onClose} 
                        className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors z-10"
                    >
                        <X size={20} />
                    </button>

                    {isSuccess ? (
                        <div className="w-full flex flex-col items-center justify-center p-16 text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6"
                            >
                                <CheckCircle2 size={48} />
                            </motion.div>
                            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">¡Visita Agendada!</h2>
                            <p className="text-slate-500 font-medium max-w-sm">
                                Tu cita con {agentName} para ver {propertyName} ha sido confirmada exitosamente.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Left Panel: Info */}
                            <div className="w-full md:w-1/3 bg-slate-50 p-8 md:p-10 border-r border-slate-100 flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">HouseApp Scheduler</span>
                                <h3 className="text-2xl font-black text-slate-900 leading-tight mb-4">Agenda un recorrido</h3>
                                <p className="text-slate-500 text-sm font-medium mb-8">
                                    Selecciona el día y hora para conocer {propertyName} junto a {agentName}.
                                </p>

                                <div className="space-y-4 mb-auto">
                                    <div className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                                        <Clock className="text-indigo-400" size={18} />
                                        <span>30 min</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                                        <Calendar className="text-indigo-400" size={18} />
                                        <span>Visita Presencial</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel: Calendar & Time Picker */}
                            <div className="w-full md:w-2/3 p-8 md:p-10 flex flex-col max-h-[80vh] overflow-y-auto custom-scrollbar">
                                <h4 className="text-sm font-black text-slate-900 mb-6 flex items-center justify-between">
                                    <span>Selecciona un Día</span>
                                    {selectedDate && <span className="text-indigo-600">{format(selectedDate, 'EEEE, d MMMM', { locale: es })}</span>}
                                </h4>
                                
                                {/* Date Strip */}
                                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-8">
                                    {days.map((d, i) => {
                                        const isSelected = selectedDate && isSameDay(d, selectedDate);
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => { setSelectedDate(d); setSelectedTime(null); }}
                                                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                                                    isSelected 
                                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-600/10' 
                                                    : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-wider mb-1 opacity-70">
                                                    {format(d, 'EEE', { locale: es })}
                                                </span>
                                                <span className="text-lg font-black">
                                                    {format(d, 'd')}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Time Selection */}
                                <AnimatePresence mode="wait">
                                    {selectedDate && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="border-t border-slate-100 pt-8"
                                        >
                                            <h4 className="text-sm font-black text-slate-900 mb-6">Selecciona una hora disponible</h4>
                                            
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                                                {availableTimes.map((time) => {
                                                    const isSelected = selectedTime === time;
                                                    return (
                                                        <button
                                                            key={time}
                                                            onClick={() => setSelectedTime(time)}
                                                            className={`py-4 rounded-xl text-sm font-black transition-all border-2 ${
                                                                isSelected
                                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                                                                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-600 hover:text-indigo-600'
                                                            }`}
                                                        >
                                                            {time}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <div className="flex justify-end pt-4 border-t border-slate-50">
                                                <button
                                                    disabled={!selectedTime || isSubmitting}
                                                    onClick={handleConfirm}
                                                    className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    {isSubmitting ? 'Confirmando...' : 'Confirmar Visita'} 
                                                    {!isSubmitting && <ChevronRight size={18} />}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
