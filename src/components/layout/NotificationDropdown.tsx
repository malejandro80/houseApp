'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink, X, MessageSquare, UserPlus, Calendar, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
    Notification, 
    getNotifications, 
    getUnreadNotificationsCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    clearAllNotifications 
} from '@/app/actions/notifications';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationDropdownProps {
    userId: string;
}

export default function NotificationDropdown({ userId }: NotificationDropdownProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        loadData();

        const channel = supabase
            .channel('realtime_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    const newNotif = payload.new as Notification;
                    
                    // Suppress toast and unread count if the user is currently on the notification's target page
                    const currentUrl = window.location.pathname + window.location.search;
                    const isMuted = newNotif.link_url === currentUrl && (newNotif.type === 'message' || newNotif.type === 'appointment');

                    if (isMuted) {
                        // Implicitly mark as read on the backend
                        markNotificationAsRead(newNotif.id).catch(console.error);
                        
                        // Add to dropdown history as read, but don't toast or increment count
                        setNotifications(prev => [{ ...newNotif, is_read: true }, ...prev]);
                    } else {
                        setNotifications(prev => [newNotif, ...prev]);
                        setUnreadCount(prev => prev + 1);
                        
                        // Show toast
                        toast(newNotif.title, {
                            description: newNotif.message,
                            action: newNotif.link_url ? {
                                label: 'Ver',
                                onClick: () => handleNotificationClick(newNotif)
                            } : undefined
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    const updatedNotif = payload.new as Notification;
                    setNotifications(prev => prev.map(n => n.id === updatedNotif.id ? updatedNotif : n));
                    if (updatedNotif.is_read) {
                        setUnreadCount(prev => Math.max(0, prev - 1));
                    }
                }
            )
            .subscribe();

        // Click outside listener
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            supabase.removeChannel(channel);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [userId, supabase]);

    const loadData = async () => {
        const [notifs, count] = await Promise.all([
            getNotifications(),
            getUnreadNotificationsCount()
        ]);
        setNotifications(notifs);
        setUnreadCount(count);
    };

    const handleNotificationClick = async (notif: Notification) => {
        if (!notif.is_read) {
            await markNotificationAsRead(notif.id);
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        if (notif.link_url) {
            setIsOpen(false);
            router.push(notif.link_url);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) return;
        await markAllNotificationsAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const handleClearAll = async () => {
        await clearAllNotifications();
        setNotifications([]);
        setUnreadCount(0);
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'lead': return <UserPlus size={18} className="text-blue-500" />;
            case 'message': return <MessageSquare size={18} className="text-indigo-500" />;
            case 'appointment': return <Calendar size={18} className="text-emerald-500" />;
            default: return <Bell size={18} className="text-slate-500" />;
        }
    };

    const getBgForType = (type: string) => {
        switch (type) {
            case 'lead': return 'bg-blue-100/50';
            case 'message': return 'bg-indigo-100/50';
            case 'appointment': return 'bg-emerald-100/50';
            default: return 'bg-slate-100/50';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-indigo-600 focus:outline-none"
                aria-label="Notificaciones"
            >
                <Bell size={20} strokeWidth={2.5} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-[100]"
                    >
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
                                Notificaciones
                                {unreadCount > 0 && (
                                    <span className="bg-indigo-100 text-indigo-700 py-0.5 px-2 rounded-full text-[10px] font-black">
                                        {unreadCount} NUEVAS
                                    </span>
                                )}
                            </h3>
                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={handleMarkAllAsRead}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Marcar todas como leídas"
                                    >
                                        <Check size={16} strokeWidth={3} />
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button 
                                        onClick={handleClearAll}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Limpiar bandeja"
                                    >
                                        <Trash2 size={16} strokeWidth={2} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-10 text-center flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                                        <Bell size={24} />
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 mb-1">Nada por aquí</p>
                                    <p className="text-xs font-medium text-slate-400">Estás al día con tus notificaciones.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {notifications.map((notif) => (
                                        <div 
                                            key={notif.id} 
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative group flex gap-4 ${!notif.is_read ? 'bg-indigo-50/30' : ''}`}
                                        >
                                            <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${getBgForType(notif.type)}`}>
                                                {getIconForType(notif.type)}
                                            </div>
                                            <div className="flex-1 pr-6">
                                                <h4 className={`text-sm tracking-tight mb-1 ${!notif.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                                                    {notif.title}
                                                </h4>
                                                <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                                                    {notif.message}
                                                </p>
                                                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-2 block">
                                                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                                                </span>
                                            </div>
                                            {!notif.is_read && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
