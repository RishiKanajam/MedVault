import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public paths that don't require authentication
const PUBLIC_PATHS_PREFIX = ['/auth']; // Routes starting with /auth are public
const PROTECTED_PATH_PREFIX = '/';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get('__session'); // Default Firebase cookie name
  const isAuthenticated = !!sessionCookie;

  console.log(`[Middleware] Path: ${pathname}, Is Authenticated: ${isAuthenticated}`);

  const isProtectedRoute = !PUBLIC_PATHS_PREFIX.some(prefix => pathname.startsWith(prefix)) && pathname.startsWith(PROTECTED_PATH_PREFIX);
  const isPublicPath = PUBLIC_PATHS_PREFIX.some(prefix => pathname.startsWith(prefix));

  // 1. If accessing a public path (e.g., /auth/login, /auth/signup)
  if (isPublicPath) {
    // If authenticated user tries to access login/signup, redirect them to dashboard
    if (isAuthenticated) {
        console.log(`[Middleware] Authenticated user accessing public auth path ${pathname}. Redirecting to /dashboard.`);
        return NextResponse.redirect(new URL('/dashboard', req.url)); // Use req.url as base
    }
    // If not authenticated, allow access to public path
    console.log(`[Middleware] Allowing access to public path: ${pathname}`);
    return NextResponse.next();
  }

  // 2. If accessing a protected path (starts with / and is not public)
  if (isProtectedRoute) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
          console.log(`[Middleware] Unauthenticated access to protected path ${pathname}. Redirecting to /auth/login.`);
          const loginUrl = new URL('/auth/login', req.url); // Use req.url as base
          loginUrl.searchParams.set('redirectedFrom', pathname);
          return NextResponse.redirect(loginUrl);
      }
      // 3. If authenticated and accessing a protected path, allow access
      console.log(`[Middleware] Authenticated access to protected path: ${pathname}. Allowing.`);
  }
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
