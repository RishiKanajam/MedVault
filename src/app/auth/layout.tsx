
// src/app/auth/layout.tsx
import React from 'react';

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
