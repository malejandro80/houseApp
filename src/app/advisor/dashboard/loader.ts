import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getWeeklyVisits, getPendingLeads } from '@/app/actions/leads';

export const loadAdvisorDashboard = async () => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    // Double check if user is advisor (optional but recommended)
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'asesor' && profile?.role !== 'superadmin') {
        return redirect('/my-properties');
    }

    // Fetch quick view data
    const [weeklyVisits, pendingLeads] = await Promise.all([
        getWeeklyVisits(),
        getPendingLeads()
    ]);

    return {
        user,
        profile,
        weeklyVisits,
        pendingLeads
    };
};
