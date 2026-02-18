import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export const logError = async (error: any, context: string, userId?: string) => {
  console.error(context, error);

  const supabase = createClient();
  const errorMessage = error instanceof Error ? error.message : String(error);

  try {
    await supabase.from('error_logs').insert({
      context,
      message: errorMessage,
      stack_trace: error instanceof Error ? error.stack : null,
      user_id: userId || null,
      occurred_at: new Date().toISOString()
    });
  } catch (loggingError) {
    console.error('Failed to log error to Supabase:', loggingError);
  }

  toast.error('Ocurrió un error inesperado. El equipo de soporte ha sido notificado.');
};
