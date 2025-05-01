
// src/app/auth/layout.tsx
import React from 'react';

// Simple layout for authentication pages, centers content
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      {children}
    </div>
  );
}
