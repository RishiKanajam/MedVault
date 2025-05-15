import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/signup', '/']
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const sessionCookie = req.cookies.get('__session')
  const isAuthenticated = !!sessionCookie

  // —— Bypass middleware for /dashboard so client-side guard can take over ——
  if (process.env.NODE_ENV === 'development' || pathname === '/dashboard') {
    console.log('[Middleware] Skipping auth check for dashboard in dev.')
    return NextResponse.next()
  }

  // —— Your existing logic below —— 
  if (isAuthenticated) {
    if (PUBLIC_AUTH_PATHS.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  if (PUBLIC_AUTH_PATHS.includes(pathname)) {
    return NextResponse.next()
  }

  // not authenticated & trying to hit a protected path
  const loginUrl = new URL('/auth/login', req.url)
  loginUrl.searchParams.set('redirectedFrom', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}; 