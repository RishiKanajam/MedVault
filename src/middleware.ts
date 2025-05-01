import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of authentication-related paths (publicly accessible)
const AUTH_PATHS = ['/auth/login', '/auth/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for Firebase Auth token in cookies (adapt cookie name if needed)
  const sessionCookie = request.cookies.get('__session'); // Or your specific session cookie name
  const isAuthenticated = !!sessionCookie;

  console.log(`[Middleware] Path: ${pathname}, Authenticated: ${isAuthenticated}`);

  // Allow access to auth paths regardless of authentication state
  if (AUTH_PATHS.some(authPath => pathname.startsWith(authPath))) {
     console.log(`[Middleware] Allowing access to auth path: ${pathname}`);
    return NextResponse.next();
  }

  // If the user is authenticated, allow access to any other path
  if (isAuthenticated) {
    console.log(`[Middleware] Authenticated user accessing allowed path: ${pathname}. Allowing.`);
    return NextResponse.next();
  }

  // If the user is NOT authenticated and trying to access a protected path, redirect to login
  if (!isAuthenticated && !AUTH_PATHS.some(authPath => pathname.startsWith(authPath))) {
    console.log(`[Middleware] Unauthenticated user accessing protected path ${pathname}. Redirecting to /auth/login.`);
    // Preserve the original path as a query parameter for potential redirect after login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Default fallback (should ideally not be reached with the above logic)
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
     * - / (Root path often for landing page, handle separately if needed or include if protected)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo-light.png|logo-dark.png).*)',
    // Explicitly include root if it should be protected, otherwise handle public paths above
    // '/'
  ],
};
