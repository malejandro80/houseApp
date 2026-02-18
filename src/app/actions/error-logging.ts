'use server';

import { createClient } from '@/lib/supabase/server';

export async function logErrorAction(error: any, context: string, metadata?: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  console.error('[Action Error Log]', context, error);

  const errorMessage = error instanceof Error ? error.message : String(error);
  const stackTrace = error instanceof Error ? error.stack : null;

  try {
    const { error: logError } = await supabase.from('error_logs').insert({
      context,
      message: errorMessage,
      stack_trace: stackTrace,
      user_id: user?.id || null,
      metadata: metadata || null,
      environment: process.env.NODE_ENV,
      occurred_at: new Date().toISOString()
    });

    if (logError) {
      console.error('Failed logging within server action:', logError);
    }
  } catch (e) {
    console.error('Critical failure logging within server action:', e);
  }
}
