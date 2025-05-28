import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define paths that don't require authentication
const PUBLIC_PATHS = ['/auth/login', '/auth/signup', '/', '/api/test-gemini']
// Define paths that require authentication
const PROTECTED_PATHS = ['/dashboard', '/pharmanet', '/test', '/history']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const sessionCookie = req.cookies.get('__session')
  const isAuthenticated = !!sessionCookie

  // Handle root path
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // Handle auth paths
  if (pathname.startsWith('/auth/')) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Handle protected paths
  if (PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // Allow all other paths
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (except auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/(?!auth)).*)',
  ],
} 