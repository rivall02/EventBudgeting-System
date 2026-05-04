import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isVerifyMFA = request.nextUrl.pathname.startsWith('/verify-mfa')
  const isSettings = request.nextUrl.pathname.startsWith('/settings')

  if (!user) {
    if (isDashboard || isVerifyMFA || isSettings) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // If user is logged in, check their role from 'users' table
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = userProfile?.role

  if (isAuthPage) {
    // Redirect logged in user based on role
    if (role === 'treasurer') {
      return NextResponse.redirect(new URL('/verify-mfa', request.url))
    } else if (role === 'coordinator') {
      return NextResponse.redirect(new URL('/dashboard/coordinator', request.url))
    } else if (role === 'officer') {
      return NextResponse.redirect(new URL('/dashboard/officer', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (isDashboard) {
    if (role === 'treasurer' && !request.nextUrl.pathname.startsWith('/dashboard/treasurer')) {
       return NextResponse.redirect(new URL('/dashboard/treasurer', request.url))
    }
    if (role === 'coordinator' && !request.nextUrl.pathname.startsWith('/dashboard/coordinator')) {
       return NextResponse.redirect(new URL('/dashboard/coordinator', request.url))
    }
    if (role === 'officer' && !request.nextUrl.pathname.startsWith('/dashboard/officer')) {
       return NextResponse.redirect(new URL('/dashboard/officer', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
