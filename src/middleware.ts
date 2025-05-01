import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public authentication-related paths
const AUTH_PATHS = ['/auth/login', '/auth/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for Firebase Auth token in cookies (adapt cookie name if needed)
  // Note: This assumes your Firebase Auth session handling sets a cookie named '__session'.
  // If using client-side persistence only, this cookie check might not be reliable on the server.
  // Consider using server-side session verification if needed.
  const sessionCookie = request.cookies.get('__session'); // Or your specific session cookie name
  const isAuthenticated = !!sessionCookie;

  console.log(`[Middleware] Path: ${pathname}, Authenticated (via cookie check): ${isAuthenticated}`);

  // Allow access to auth paths (/auth/login, /auth/signup) regardless of authentication state
  if (AUTH_PATHS.some(authPath => pathname.startsWith(authPath))) {
     console.log(`[Middleware] Allowing access to public auth path: ${pathname}`);
    return NextResponse.next();
  }

  // If the user is authenticated (based on cookie), allow access to any other path
  if (isAuthenticated) {
    console.log(`[Middleware] Authenticated user accessing allowed path: ${pathname}. Allowing.`);
    return NextResponse.next();
  }

  // If the user is NOT authenticated (based on cookie) and trying to access a protected path, redirect to login
  // All paths except the explicit AUTH_PATHS are considered protected here.
  if (!isAuthenticated && !AUTH_PATHS.some(authPath => pathname.startsWith(authPath))) {
    console.log(`[Middleware] Unauthenticated user accessing protected path ${pathname}. Redirecting to /auth/login.`);
    const loginUrl = new URL('/auth/login', request.url);
    // Optionally preserve the original path for redirect after login
    // loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Fallback: Allow access if none of the above conditions were met (should be rare)
   console.log(`[Middleware] Default fallback for path: ${pathname}. Allowing.`);
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
     * - logo-*.png (logo files)
     * - / (Root path - potentially public landing page, handled by redirect logic if needed)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo-light.png|logo-dark.png).*)',
    // Explicitly include root '/' if it should be protected by this middleware.
    // If '/' is a public landing page, it will be allowed by the logic above (if not authenticated).
    // '/'
  ],
};
