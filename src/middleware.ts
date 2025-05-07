import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/signup'];
// Add any other public paths (e.g., landing page '/') if they should not require auth
const OTHER_PUBLIC_PATHS = ['/']; // Example: Assuming root is a public landing page

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get('__session'); // Default Firebase Auth session cookie
  const isAuthenticated = !!sessionCookie;

  console.log(`[Middleware] Path: ${pathname}, IsAuthenticated: ${isAuthenticated}`);

  // Allow access to public authentication paths
  if (PUBLIC_AUTH_PATHS.includes(pathname)) {
    // If authenticated user tries to access login/signup, redirect them to dashboard (optional behavior)
    if (isAuthenticated) {
        console.log(`[Middleware] Authenticated user on auth page ${pathname}. Redirecting to /dashboard.`);
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    console.log(`[Middleware] Allowing access to public auth path: ${pathname}`);
    return NextResponse.next();
  }

  // Allow access to other defined public paths
  if (OTHER_PUBLIC_PATHS.includes(pathname)) {
    // If authenticated user is on landing page, consider redirecting to dashboard
    if (isAuthenticated && pathname === '/') {
        console.log(`[Middleware] Authenticated user on landing page. Redirecting to /dashboard.`);
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    console.log(`[Middleware] Allowing access to other public path: ${pathname}`);
    return NextResponse.next();
  }

  // For any other path, if not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log(`[Middleware] Unauthenticated access to protected path ${pathname}. Redirecting to /auth/login.`);
    const loginUrl = new URL('/auth/login', req.url);
    // Optionally, pass the original path for redirection after login, though AuthProvider handles this client-side too
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and not a public auth path, allow access
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
     * - assets (public assets)
     * - *.png, *.jpg, etc. (image files)
     * The middleware logic itself handles public vs protected logic.
     */
    '/((?!api|_next/static|_next/image|assets|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif)).*)',
  ],
};
