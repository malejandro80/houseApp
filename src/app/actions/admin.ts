'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function verifyAdvisor(advisorId: string, action: 'approve' | 'reject') {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (callerProfile?.role !== 'superadmin') {
    return { error: 'Forbidden: Only superadmins can verify advisors' };
  }

  const updates: any = {
    verification_status: action === 'approve' ? 'verified' : 'rejected',
    updated_at: new Date().toISOString()
  };

  if (action === 'approve') {
    updates.role = 'asesor';
    updates.is_available = true; 
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', advisorId);

  if (error) {
    console.error('Error verifying advisor:', error);
    return { error: 'Failed to update advisor status' };
  }

  revalidatePath('/admin/advisors');
  return { success: true };
}

export async function getAdminStats() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'superadmin') throw new Error('Forbidden');

  const [
    { count: totalUsers },
    { count: totalAdvisors },
    { count: pendingAdvisors },
    { count: totalProperties },
    { count: totalLeads }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'usuario'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'asesor'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase.from('properties').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true })
  ]);

  return {
    investors: totalUsers || 0,
    advisors: totalAdvisors || 0,
    pendingAdvisors: pendingAdvisors || 0,
    properties: totalProperties || 0,
    leads: totalLeads || 0
  };
}

export async function getErrorLogs() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'superadmin') throw new Error('Forbidden');

  const { data: logs, error } = await supabase
    .from('error_logs')
    .select('*')
    .order('occurred_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching logs:', error);
    return [];
  }

  return logs;
}
