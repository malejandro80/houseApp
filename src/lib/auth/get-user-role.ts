import { createClient } from '@/lib/supabase/server';

export type UserRole = 'superadmin' | 'asesor' | 'usuario';

export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role as UserRole || 'usuario';
}

export async function hasRole(allowedRoles: UserRole[]): Promise<boolean> {
    const role = await getUserRole();
    return role ? allowedRoles.includes(role) : false;
}
