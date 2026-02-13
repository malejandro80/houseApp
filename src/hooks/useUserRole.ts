import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/lib/auth/get-user-role';

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setRole(data.role as UserRole);
        } else {
            // Default fallback
            setRole('usuario');
        }
      } catch (error) {
        console.error('Error fetching role:', error);
        setRole('usuario');
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [supabase]);

  return { role, loading, isAsesor: role === 'asesor' || role === 'superadmin', isSuperAdmin: role === 'superadmin' };
}
