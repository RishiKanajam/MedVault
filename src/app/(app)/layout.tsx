// src/app/(app)/layout.tsx (Layout for protected routes)
'use client';

import React from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
// AuthProviderWrapper is NOT used here as it's provided by the root layout.

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout now assumes AuthProviderWrapper (and thus AuthContext)
  // has already been provided at a higher level (root layout).
  // AuthLogic within the root AuthProviderWrapper handles auth checks.
  return (
    <SidebarProvider>
        <Sidebar> {/* Collapsible dark sidebar */}
            <AppSidebar />
        </Sidebar>
        <SidebarInset> {/* Main content area */}
            <main className="flex-1 overflow-y-auto bg-background"> {/* Ensure content area scrolls */}
                 {children}
             </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
