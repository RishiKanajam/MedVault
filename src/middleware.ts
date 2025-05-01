
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public auth pages (and potentially API routes, static files etc. if matcher doesn't exclude them)
  if (pathname.startsWith('/auth')) {
    console.log(`[Middleware] Allowing access to public auth path: ${pathname}`);
    return NextResponse.next();
  }

  // Check for Firebase Auth token in cookies
  // Adjust 'your_auth_cookie_name' if you use a different name or method
  const sessionCookie = req.cookies.get('__session'); // Default Firebase cookie name
  const isAuthenticated = !!sessionCookie;

  console.log(`[Middleware] Path: ${pathname}, Authenticated (via cookie check): ${isAuthenticated}`);


  // If NOT authenticated and trying to access a non-auth path, redirect to login
  if (!isAuthenticated) {
    console.log(`[Middleware] Unauthenticated user accessing protected path ${pathname}. Redirecting to /auth/login.`);
    const loginUrl = new URL('/auth/login', req.url);
    // Optional: Add redirect query param
    // loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated, allow access to the requested path
  console.log(`[Middleware] Authenticated user accessing allowed path: ${pathname}. Allowing.`);
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
     * - /auth/* (Public auth routes - explicitly excluded from protection)
     * - / (Root path - if it should be public, otherwise remove from negative lookahead)
     *
     * This negative lookahead ensures the middleware ONLY runs on paths
     * NOT matching these patterns. Auth paths are handled by the explicit check above.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo-light.png|logo-dark.png|auth/).*)',
    // If your root '/' path should also be protected, include it separately or adjust the matcher
    // '/',
  ],
};
