import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define paths that require authentication
const PROTECTED_PATHS = ['/dashboard', '/pharmanet', '/test', '/history', '/inventory', '/shipments', '/rxai', '/settings', '/profile']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hasSession = Boolean(req.cookies.get('__session')?.value)

  // Handle root path - redirect to login for now
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // Handle auth paths - allow access
  if (pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }

  // Handle protected paths - redirect to login for now
  if (PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
    if (hasSession) {
      return NextResponse.next()
    }
    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(loginUrl)
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
