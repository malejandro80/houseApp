import { createClient } from '@/lib/supabase/server';

interface ServerErrorLog {
  context: string;
  message: string;
  stack_trace?: string | null;
  user_id?: string | null;
  metadata?: any;
}

export const logServerError = async (error: any, context: string, userId?: string, metadata?: any) => {
  console.error(`[Server Error] ${context}:`, error);

  try {
    const supabase = await createClient();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stackTrace = error instanceof Error ? error.stack : null;

    // Await logging on server to ensure it completes before response closes
    const { error: logError } = await supabase.from('error_logs').insert({
      context,
      message: errorMessage,
      stack_trace: stackTrace,
      user_id: userId || null,
      metadata: metadata || null,
      environment: process.env.NODE_ENV,
      occurred_at: new Date().toISOString()
    });

    if (logError) {
        console.error('Failed to log server error to Supabase:', logError);
    }
  } catch (loggingError) {
    console.error('Critical failure in server error logging system:', loggingError);
  }
};
