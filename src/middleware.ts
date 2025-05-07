import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/signup'];
const LANDING_PAGE_PATH = '/'; // Root landing page

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get('__session');
  const isAuthenticated = !!sessionCookie;

  console.log(`[Middleware] Path: ${pathname}, IsAuthenticated: ${isAuthenticated}`);

  // If user is authenticated
  if (isAuthenticated) {
    // If trying to access a public auth path (login/signup), redirect to dashboard
    if (PUBLIC_AUTH_PATHS.includes(pathname)) {
      console.log(`[Middleware] Authenticated user on auth page ${pathname}. Redirecting to /dashboard.`);
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    // If trying to access the landing page, redirect to dashboard
    if (pathname === LANDING_PAGE_PATH) {
        console.log(`[Middleware] Authenticated user on landing page ${LANDING_PAGE_PATH}. Redirecting to /dashboard.`);
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    // Otherwise, allow access to any other (presumably protected) path
    console.log(`[Middleware] Authenticated user accessing ${pathname}. Allowing.`);
    return NextResponse.next();
  }

  // If user is NOT authenticated
  // Allow access to public auth paths and landing page
  if (PUBLIC_AUTH_PATHS.includes(pathname) || pathname === LANDING_PAGE_PATH) {
    console.log(`[Middleware] Unauthenticated user. Allowing access to public path: ${pathname}`);
    return NextResponse.next();
  }

  // For any other path, if not authenticated, redirect to login
  console.log(`[Middleware] Unauthenticated user trying to access protected path ${pathname}. Redirecting to /auth/login.`);
  const loginUrl = new URL('/auth/login', req.url);
  loginUrl.searchParams.set('redirectedFrom', pathname); // Keep for potential post-login redirect
  return NextResponse.redirect(loginUrl);
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - assets (public assets)
     * - favicon.ico (favicon file)
     * - *.png, *.jpg, etc. (image files)
     */
    '/((?!api|_next/static|_next/image|assets|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif)).*)',
  ],
};