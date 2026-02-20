'use server';

import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getAdvisorContact(advisorId: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: advisorUser, error } = await supabaseAdmin.auth.admin.getUserById(advisorId);

  if (error || !advisorUser.user) {
    console.error('Error fetching advisor contact:', error);
    return { error: 'Advisor not found' };
  }

  return { 
    email: advisorUser.user.email,
    phone: advisorUser.user.phone || null
  };
}
