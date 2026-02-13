'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function verifyAdvisor(advisorId: string, action: 'approve' | 'reject') {
  const supabase = await createClient();
  
  // 1. Verify caller is superadmin
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

  // 2. Perform Update
  const updates: any = {
    verification_status: action === 'approve' ? 'verified' : 'rejected',
    updated_at: new Date().toISOString()
  };

  if (action === 'approve') {
    updates.role = 'asesor';
    updates.is_available = true; // Make them available for assignment immediately
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
