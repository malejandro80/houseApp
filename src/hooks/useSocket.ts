import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export type SocketEventType = 'NEW_MESSAGE' | 'TYPING' | 'NEW_NOTIFICATION';

export interface SocketEvent {
    type: SocketEventType;
    payload: any;
}

export function useSocket(
    channelName: string,
    onEvent: (event: SocketEvent) => void
) {
    const [supabase] = useState(() => createClient());
    const savedCallback = useRef(onEvent);

    useEffect(() => {
        savedCallback.current = onEvent;
    }, [onEvent]);
    
    useEffect(() => {
        let isMounted = true;

        const channel = supabase
            .channel(channelName)
            // Listen to direct database inserts (Standard Chat Messages)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
                (payload) => {
                    if (isMounted && savedCallback.current) savedCallback.current({ type: 'NEW_MESSAGE', payload: payload.new });
                }
            )
            // Listen to arbitrary server/client signals (Typing, Generic Notifications, etc.)
            .on('broadcast', { event: 'custom_events' }, 
                (payload) => {
                    if (isMounted && savedCallback.current) savedCallback.current({ type: payload.payload?.type as SocketEventType, payload: payload.payload?.data });
                }
            )
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [channelName, supabase]);

    // Expose a method to manually broadcast events to the channel
    const emitEvent = async (type: SocketEventType, data: any) => {
        const channel = supabase.channel(channelName);
        await channel.send({
            type: 'broadcast',
            event: 'custom_events',
            payload: { type, data }
        });
    };

    return { emitEvent };
}
