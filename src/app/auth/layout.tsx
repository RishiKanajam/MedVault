// src/app/auth/layout.tsx
import React from 'react';
// This layout is for public authentication pages (login, signup).
// It should NOT include AuthProvider to avoid its loading spinner.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Content (e.g., Login or Signup Card) will be centered */}
      {children}
    </div>
  );
}
