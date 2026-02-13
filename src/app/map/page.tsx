import { createClient } from '@/lib/supabase/server';
import MapClient from './MapClient';

export default async function MapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // No redirect for unauthenticated users. They can see the map.
  
  return <MapClient user={user} />;
}
