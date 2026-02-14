'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Schema for updating properties (Whitelist)
const updatePropertySchema = z.object({
    title: z.string().min(3).optional(),
    type: z.string().optional(),
    address: z.string().optional(),
    neighborhood: z.string().optional(),
    sale_price: z.number().optional(),
    rent_price: z.number().optional(),
    lat: z.number().optional(),
    lon: z.number().optional(),
    area_total: z.number().optional(),
    area_built: z.number().optional(),
    age: z.number().optional(),
    physical_condition: z.number().optional(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    parking: z.number().optional(),
    legal_status: z.string().optional(),
    risk_factors: z.any().optional(),
    metadata: z.any().optional(),
    images: z.array(z.string()).optional(),
    cover_image: z.string().url().optional().or(z.literal('')),
    owner_id: z.string().uuid().nullable().optional(),
    accepted_listing_terms: z.boolean().optional(),
});

export async function publishProperty(propertyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Validate propertyId
  if (!propertyId) return { error: 'Invalid ID' };

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

export async function deleteProperty(propertyId: string) {
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

export async function updateProperty(propertyId: string, data: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      return { error: 'Unauthorized' };
    }

    // 1. Validate Input (Whitelist allowed fields)
    const result = updatePropertySchema.safeParse(data);
    if (!result.success) {
        return { error: 'Invalid data: ' + result.error.issues.map(i => i.message).join(', ') };
    }
  
    // 2. Clean up (remove undefined)
    const updateData = Object.fromEntries(
        Object.entries(result.data).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(updateData).length === 0) {
        return { error: 'No valid fields provided for update' };
    }

    // 3. SECURE UPDATE: Ensure user_id matches
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
