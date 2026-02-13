'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitAdvisorRequest(documentUrls: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      verification_status: 'pending',
      documents: documentUrls,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error submitting advisor request:', error);
    return { error: 'Failed to submit request' };
  }

  revalidatePath('/advisor-registration');
  return { success: true };
}
