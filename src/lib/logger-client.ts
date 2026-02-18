import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ErrorLog {
  context: string;
  message: string;
  stack_trace?: string | null;
  user_id?: string | null;
  metadata?: any;
}

export const logClientError = async (error: any, context: string, userId?: string, metadata?: any) => {
  // Always log to console for immediate debugging
  console.error(`[Client Error] ${context}:`, error);

  // Show user-friendly toast
  toast.error('Ocurrió un error inesperado al procesar su solicitud.');

  try {
    const supabase = createClient();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stackTrace = error instanceof Error ? error.stack : null;

    // Fire and forget logging to avoid blocking UI
    supabase.from('error_logs').insert({
      context,
      message: errorMessage,
      stack_trace: stackTrace,
      user_id: userId || null,
      metadata: metadata || null,
      environment: process.env.NODE_ENV,
      occurred_at: new Date().toISOString()
    }).then(({ error: logError }) => {
        if (logError) console.error('Failed to persist client log:', logError);
    });

  } catch (loggingError) {
    // Failsafe to prevent logging from crashing the app
    console.error('Critical failure in error logging system:', loggingError);
  }
};
