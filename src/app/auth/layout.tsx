// src/app/auth/layout.tsx
import React from 'react';
// AuthProviderWrapper is NOT used here to prevent full-screen loading on auth pages.
// If auth pages need access to auth context (e.g., to redirect already logged-in users),
// a simpler, non-loading AuthProvider could be used, or middleware can handle it.
// For this setup, middleware and AuthLogic on protected routes handle redirects.

// Simple layout for authentication pages, centers content
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Use flexbox to center the content vertically and horizontally within the viewport
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Content (e.g., Login or Signup Card) will be centered */}
      {children}
    </div>
  );
}
