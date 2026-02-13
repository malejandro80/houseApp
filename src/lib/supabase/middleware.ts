import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 1. Get User
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Protected Routes Logic
  const path = request.nextUrl.pathname;
  
  // Public routes that don't need auth
  const publicRoutes = ['/login', '/auth', '/', '/map'];
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

  if (!user && !isPublicRoute) {
     // Redirect to login if accessing protected route without user
     const url = request.nextUrl.clone()
     url.pathname = '/login'
     return NextResponse.redirect(url)
  }

  // 3. Role-Based Access Control (RBAC)
  if (user) {
      // Fetch role from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      const role = profile?.role || 'usuario';

      // Example: Restrict 'asesor' routes
      if (path.startsWith('/admin') && role !== 'superadmin') {
          return NextResponse.redirect(new URL('/', request.url));
      }

      if (path.startsWith('/manage') && !['superadmin', 'asesor'].includes(role)) {
          return NextResponse.redirect(new URL('/', request.url));
      }
  }

  return supabaseResponse
}
