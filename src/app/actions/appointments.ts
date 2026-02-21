'use server';

import { createClient } from '@/lib/supabase/server';
import { Appointment } from '@/common/types/appointments';

export async function getAdvisorAppointments(): Promise<Appointment[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: appts, error } = await supabase
        .from('appointments')
        .select(`
            *,
            lead:leads (
                id,
                client_name,
                client_phone,
                address_reference
            )
        `)
        .eq('advisor_id', user.id)
        .in('status', ['scheduled', 'completed']) // exclude cancelled and rescheduled
        .order('scheduled_date', { ascending: true });

    if (error) throw error;
    
    // Suppress typescript complaint by explicitly casting the deep joined lead response structure
    return appts as unknown as Appointment[];
}

export async function getAdvisorBookedTimes(advisorId: string, dateIsoString: string): Promise<string[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Parse the date to get the start and end of the day
    const targetDate = new Date(dateIsoString);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    const { data: currentAppts, error } = await supabase
        .from('appointments')
        .select('scheduled_date')
        .eq('advisor_id', advisorId)
        .eq('status', 'scheduled')
        .gte('scheduled_date', startOfDay.toISOString())
        .lte('scheduled_date', endOfDay.toISOString());

    if (error) {
        console.error('Error fetching booked times:', error);
        return [];
    }

    // Convert date objects to 'HH:mm' strings
    return currentAppts.map(appt => {
        const date = new Date(appt.scheduled_date);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    });
}
