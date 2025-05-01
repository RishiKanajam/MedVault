// src/app/auth/layout.tsx
import React from 'react';

// Simple layout for authentication pages
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Ensure the layout takes full screen height and centers content
    <div className="flex min-h-screen items-center justify-center bg-background">
      {children}
    </div>
  );
}
