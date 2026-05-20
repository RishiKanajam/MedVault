import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth'

// Run on Node.js runtime so Firebase Admin SDK is available for real token verification.
export const runtime = 'nodejs'

const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/signup', '/', '/demo']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const sessionCookie = req.cookies.get('__session')

  let isAuthenticated = false
  if (sessionCookie?.value) {
    try {
      await verifySession(req)
      isAuthenticated = true
    } catch {
      // Cookie exists but is invalid/expired — treat as unauthenticated.
      isAuthenticated = false
    }
  }

  if (isAuthenticated) {
    if (PUBLIC_AUTH_PATHS.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  if (PUBLIC_AUTH_PATHS.includes(pathname)) {
    return NextResponse.next()
  }

  // Not authenticated, redirect to login.
  const loginUrl = new URL('/auth/login', req.url)
  loginUrl.searchParams.set('redirectedFrom', pathname)
  const response = NextResponse.redirect(loginUrl)
  // Clear a stale/invalid session cookie if one was present.
  if (sessionCookie?.value) {
    response.cookies.delete('__session')
  }
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif)).*)',
  ],
}

