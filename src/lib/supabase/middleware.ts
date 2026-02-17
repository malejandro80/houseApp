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

  // 3. Role-Based Access Control (RBAC) & Redirections
  if (user) {
      // Optimization: Only fetch profile if the path requires role-based logic
      // Paths that need role: /, /my-properties (exact for redirect), /advisor*, /admin*, /manage*
      const needsRoleCheck = 
          path === '/' || 
          path === '/my-properties' || 
          path.startsWith('/advisor') || 
          path.startsWith('/admin') || 
          path.startsWith('/manage');

      if (needsRoleCheck) {
          // Fetch role from profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          const role = profile?.role || 'usuario';
          const isAdvisor = role === 'asesor' || role === 'superadmin';

          // 3.1. Landing Page Redirection
          if (path === '/') {
              const url = request.nextUrl.clone()
              url.pathname = isAdvisor ? '/advisor/dashboard' : '/my-properties'
              return NextResponse.redirect(url)
          }

          // 3.2. Restrict My Properties LIST for Advisors (but allow details)
          if (path === '/my-properties' && isAdvisor) {
              const url = request.nextUrl.clone()
              url.pathname = '/advisor/dashboard'
              return NextResponse.redirect(url)
          }

          // 3.3. Restrict Advisor Dashboard for Regular Users
          if (path.startsWith('/advisor') && !isAdvisor) {
              const url = request.nextUrl.clone()
              url.pathname = '/my-properties'
              return NextResponse.redirect(url)
          }

          // 3.4. Admin restrictions (keep existing)
          if (path.startsWith('/admin') && role !== 'superadmin') {
              return NextResponse.redirect(new URL('/', request.url));
          }

          if (path.startsWith('/manage') && !['superadmin', 'asesor'].includes(role)) {
              return NextResponse.redirect(new URL('/', request.url));
          }
      }
  }

  return supabaseResponse
}
