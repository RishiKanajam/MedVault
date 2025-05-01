import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of authentication-related paths (unprotected)
const AUTH_PATHS = ['/login', '/signup'];
// Path for initial module setup (unprotected)
const MODULE_SETUP_PATH = '/module-selection';
// List of paths accessible to everyone (even unauthenticated users) - typically just the landing page
const PUBLIC_PATHS = ['/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for Firebase Auth token in cookies (adapt cookie name if needed)
  const sessionCookie = request.cookies.get('__session'); // Default name, check your setup
  const isAuthenticated = !!sessionCookie;

  console.log(`[Middleware] Path: ${pathname}, Authenticated: ${isAuthenticated}`);

  // Allow access to public paths regardless of authentication state
  if (PUBLIC_PATHS.includes(pathname)) {
     console.log(`[Middleware] Allowing access to public path: ${pathname}`);
    return NextResponse.next();
  }

  // Handle Authenticated Users
  if (isAuthenticated) {
    // Redirect away from auth pages if already logged in
    if (AUTH_PATHS.includes(pathname)) {
      console.log(`[Middleware] Authenticated user accessing auth path ${pathname}. Redirecting to /dashboard.`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Allow access to module setup (in case they revisit) and all other protected routes
    console.log(`[Middleware] Authenticated user accessing allowed path: ${pathname}. Allowing.`);
    return NextResponse.next();
  }

  // Handle Unauthenticated Users
  if (!isAuthenticated) {
    // Allow access to auth paths and module setup path
    if (AUTH_PATHS.includes(pathname) || pathname === MODULE_SETUP_PATH) {
       console.log(`[Middleware] Unauthenticated user accessing allowed path: ${pathname}. Allowing.`);
      return NextResponse.next();
    }
    // Redirect to login if trying to access any other protected path
    console.log(`[Middleware] Unauthenticated user accessing protected path ${pathname}. Redirecting to /login.`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Default fallback (should not be reached ideally)
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo-light.png|logo-dark.png).*)',
  ],
};
