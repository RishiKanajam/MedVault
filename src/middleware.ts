import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of authentication-related paths
const AUTH_PATHS = ['/login', '/signup', '/module-selection']; // Added module-selection

// List of paths accessible to everyone (even unauthenticated users)
const PUBLIC_PATHS = ['/']; // Landing page

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for Firebase Auth token in cookies
  // The name '__session' is a common convention but might differ based on your setup (e.g., if using Firebase Hosting rewrites)
  // Adapt this name if your backend function sets a different cookie name.
  const sessionCookie = request.cookies.get('__session'); // Or your specific session cookie name
  const isAuthenticated = !!sessionCookie;

  // Allow access to public paths regardless of authentication state
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // If the user is authenticated
  if (isAuthenticated) {
    // If trying to access auth paths while logged in, redirect to dashboard
    if (AUTH_PATHS.includes(pathname)) {
      console.log(`[Middleware] Authenticated user accessing auth path ${pathname}. Redirecting to /dashboard.`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Allow access to other protected routes
    console.log(`[Middleware] Authenticated user accessing protected path ${pathname}. Allowing.`);
    return NextResponse.next();
  }

  // If the user is NOT authenticated
  if (!isAuthenticated) {
    // If trying to access protected paths, redirect to login
    if (!AUTH_PATHS.includes(pathname)) {
       console.log(`[Middleware] Unauthenticated user accessing protected path ${pathname}. Redirecting to /login.`);
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Allow access to auth paths (login, signup, module selection)
     console.log(`[Middleware] Unauthenticated user accessing auth path ${pathname}. Allowing.`);
    return NextResponse.next();
  }

  // Default fallback (should not be reached ideally)
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
