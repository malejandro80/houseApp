'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function publishProperty(propertyId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // 1. Check Subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .single();

  const isActive = subscription?.status === 'active' && new Date(subscription.current_period_end) > new Date();

  if (!isActive) {
    return { error: 'SUBSCRIPTION_REQUIRED' }; // Special code for client to redirect
  }

  // 2. Publish Property (Trigger will handle assignment)
  const { error } = await supabase
    .from('properties')
    .update({ 
        is_listed: true,
        listing_status: 'active',
        purpose: 'sale' // Force conversion to 'sale' type
    })
    .eq('id', propertyId)
    .eq('user_id', user.id); // Security: only owner

  if (error) {
    console.error('Error publishing property:', error);
    return { error: 'Failed to publish property.' };
  }

  revalidatePath('/my-properties');
  revalidatePath('/map'); // Update public map if applicable
  return { success: true };
}

export async function deleteProperty(propertyId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', propertyId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting property:', error);
    return { error: 'Failed to delete property' };
  }

  revalidatePath('/my-properties');
  return { success: true };
}

export async function updateProperty(propertyId: number, data: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      return { error: 'Unauthorized' };
    }
  
    // Clean up data if necessary (remove undefined)
    const updateData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    const { error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', propertyId)
      .eq('user_id', user.id);
  
    if (error) {
      console.error('Error updating property:', error);
      return { error: 'Failed to update property' };
    }
  
    revalidatePath('/my-properties');
    revalidatePath(`/my-properties/${propertyId}`);
    return { success: true };
}
