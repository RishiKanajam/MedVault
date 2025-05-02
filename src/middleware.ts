
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public paths that don't require authentication
const PUBLIC_PATHS = ['/auth/login', '/auth/signup'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get('__session'); // Default Firebase cookie name
  const isAuthenticated = !!sessionCookie;

  console.log(`[Middleware] Path: ${pathname}, Is Public: ${PUBLIC_PATHS.includes(pathname)}, Authenticated: ${isAuthenticated}`);

  // Allow access to public paths regardless of authentication status
  if (PUBLIC_PATHS.includes(pathname)) {
    console.log(`[Middleware] Allowing access to public path: ${pathname}`);
    return NextResponse.next();
  }

  // If trying to access a protected path without authentication, redirect to login
  if (!isAuthenticated) {
    console.log(`[Middleware] Unauthenticated access to protected path ${pathname}. Redirecting to /auth/login.`);
    const loginUrl = new URL('/auth/login', req.url);
    // Optional: Add where the user was trying to go
    // loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and accessing a protected path, allow access
  console.log(`[Middleware] Authenticated access to protected path: ${pathname}. Allowing.`);
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Specific image files (e.g., logo)
     * - Public auth routes are handled by the logic inside the middleware,
     *   so they don't need to be excluded here if we want the middleware
     *   to run on them (e.g., to redirect logged-in users away from login).
     *   If we DON'T want middleware to run on /auth/* at all, add 'auth/' here.
     * - The root '/' path (if it's the landing page, it's protected by this matcher)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo-light.png|logo-dark.png).*)',
    // Ensure the root path is also covered if it should be protected
    '/',
  ],
};
