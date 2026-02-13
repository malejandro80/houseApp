'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function subscribeToPlan(planType: string = 'seller_basic') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Debes iniciar sesión para suscribirte.' };
  }

  // Calculate period end (30 days from now)
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  // Check if subscription exists
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (existingSub) {
    // Update existing
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        plan_type: planType,
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSub.id);

    if (error) {
        console.error('Error updating subscription:', error);
        return { error: 'Error al actualizar la suscripción.' };
    }
  } else {
    // Create new
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        status: 'active',
        plan_type: planType,
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString()
      });

    if (error) {
        console.error('Error creating subscription:', error);
        return { error: 'Error al crear la suscripción.' };
    }
  }

  revalidatePath('/pricing');
  revalidatePath('/my-properties');
  return { success: true };
}
