import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/my-properties' // Redirect to My Properties after login
  // Default redirect to calculator after login as it's the main protected feature

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(`${origin}/login?error=auth_exchange_failed`)
    }

    if (user) {
      // Check if profile exists; if not, create it (safe fallback for first-time users if trigger fails)
      const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
      
      let redirectPath = next;
      let userRole = profile?.role;

      if (!profile && !profileError) {
          // Should not happen if select works, but implies no row found if .single() wasn't used strictly or logic differs.
          // However, .single() returns error if no row.
      }

      // If profile is missing (PGRST116), try to insert default
      if (!profile) {
          console.log('Profile missing for user, attempting creation...');
          try {
              const { error: insertError } = await supabase.from('profiles').insert({
                  id: user.id,
                  email: user.email,
                  full_name: user.user_metadata?.full_name || user.user_metadata?.name,
                  avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
                  role: 'usuario' // Default role
              });
              
              if (insertError) {
                  // If insert fails (e.g. race condition with trigger), just ignore and assume it exists now or will exist.
                  console.warn('Profile creation fallback failed (might exist):', insertError);
              } else {
                  userRole = 'usuario';
              }
          } catch (e) {
              console.error('Profile creation exception:', e);
          }
      }

      // Logic for default redirect based on role
      if (next === '/my-properties') { 
        if (userRole === 'superadmin') {
          redirectPath = '/admin';
        } else if (userRole === 'asesor') {
          redirectPath = '/advisor/dashboard';
        }
      }
      
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
