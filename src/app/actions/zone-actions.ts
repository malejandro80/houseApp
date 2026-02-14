'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Zone {
  id: number;
  name: string;
  lat: number;
  lon: number;
  radius: number;
  created_at: string;
  last_history?: ZoneHistory;
}

export interface ZoneHistory {
  id: number;
  zone_id: number;
  recorded_at: string;
  avg_price: number;
  avg_m2_price: number;
  avg_rooms: number;
  avg_bathrooms: number;
  avg_roi: number;
  property_count: number;
  min_price: number;
  max_price: number;
}

export async function getUserZones(): Promise<Zone[]> {
  const supabase = await createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('zones')
    .select(`
      *,
      zone_history (
        *
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching zones:', error);
    return [];
  }

  // Transform to include only the latest history entry for easier display
  return data.map((zone: any) => ({
    ...zone,
    last_history: zone.zone_history?.[0] || null // Assuming history ordered by latest? We might need to sort explicitly in query or JS
  }));
}

// ... (getUserZones remains)

export async function getZoneHistory(zoneId: number): Promise<ZoneHistory[]> {
  const supabase = await createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Unauthorized');

  // Verify ownership implicitly via RLS or explicitly
  const { data, error } = await supabase
    .from('zone_history')
    .select('*')
    .eq('zone_id', zoneId)
    .order('recorded_at', { ascending: true }); // Ascending for charts time series

  if (error) {
    console.error('Error fetching zone history:', error);
    return [];
  }

  return data;
}

export async function createZone(name: string, lat: number, lon: number, radius: number) {
// ...
  const supabase = await createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('zones')
    .insert({
      user_id: user.user.id,
      name,
      lat,
      lon,
      radius
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating zone:', error);
    throw new Error('Failed to create zone');
  }

  revalidatePath('/map');
  return data;
}

export async function deleteZone(id: number) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // SECURE DELETE: Explicitly check user_id if RLS is not enough or to be safe
  const { error } = await supabase
    .from('zones')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting zone:', error);
    throw new Error('Failed to delete zone');
  }

  revalidatePath('/map');
}
