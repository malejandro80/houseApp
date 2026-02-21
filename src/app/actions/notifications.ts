'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'lead' | 'message' | 'appointment';
    link_url: string | null;
    is_read: boolean;
    created_at: string;
}

export async function getNotifications(): Promise<Notification[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }

    return data as Notification[];
}

export async function getUnreadNotificationsCount(): Promise<number> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

    if (error) {
        console.error('Error counting unread notifications:', error);
        return 0;
    }

    return count || 0;
}

export async function markNotificationAsRead(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error marking notification as read:', error);
    }
}

export async function markAllNotificationsAsRead() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

    if (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

export async function clearAllNotifications() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

    if (error) {
        console.error('Error clearing all notifications:', error);
    }
}

