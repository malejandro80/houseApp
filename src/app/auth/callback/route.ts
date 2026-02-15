import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/my-properties' // Redirect to My Properties after login
  // Default redirect to calculator after login as it's the main protected feature

  if (code) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)
    
    if (user) {
      // If we have a code and converted it to a session, check the role
      // to decide the default redirect if 'next' wasn't specific.
      let redirectPath = next;
      
      if (next === '/my-properties') { // Only change if it's the generic default
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'superadmin') {
          redirectPath = '/admin';
        } else if (profile?.role === 'asesor') {
          redirectPath = '/advisor/dashboard';
        }
      }
      
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // return the user to an error page with instructions
  // or simple redirect to home
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
