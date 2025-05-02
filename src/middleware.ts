import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public paths that don't require authentication
const PUBLIC_PATHS = ['/auth/login', '/auth/signup'];
// Define paths that are considered protected
const PROTECTED_PATHS_PREFIX = ['/dashboard', '/inventory', '/shipments', '/rxai', '/pharmanet', '/history', '/settings']; // Add other protected routes prefixes

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get('__session'); // Default Firebase cookie name
  const isAuthenticated = !!sessionCookie;

  console.log(`[Middleware] Path: ${pathname}, Is Authenticated: ${isAuthenticated}`);

  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  const isProtectedPath = PROTECTED_PATHS_PREFIX.some(prefix => pathname.startsWith(prefix)) || pathname === '/'; // Include root as protected

  // 1. If accessing a public path
  if (isPublicPath) {
    // If authenticated, redirect away from login/signup to dashboard
    if (isAuthenticated) {
        console.log(`[Middleware] Authenticated user accessing public auth path ${pathname}. Redirecting to /dashboard.`);
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    // If not authenticated, allow access to public path
    console.log(`[Middleware] Allowing access to public path: ${pathname}`);
    return NextResponse.next();
  }

  // 2. If accessing a protected path
  if (isProtectedPath) {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      console.log(`[Middleware] Unauthenticated access to protected path ${pathname}. Redirecting to /auth/login.`);
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('redirectedFrom', pathname); // Remember where they tried to go
      return NextResponse.redirect(loginUrl);
    }
    // If authenticated, allow access
    console.log(`[Middleware] Authenticated access to protected path: ${pathname}. Allowing.`);
    return NextResponse.next();
  }

  // 3. Allow access to other paths not explicitly public or protected (e.g., API routes, static assets handled by config.matcher)
  console.log(`[Middleware] Allowing access to non-auth/non-protected path: ${pathname}`);
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
     * - *.png, *.jpg, etc. (image files)
     * The middleware logic itself handles public vs protected logic.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif)).*)',
  ],
};