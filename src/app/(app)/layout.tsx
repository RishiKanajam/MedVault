// src/app/(app)/layout.tsx (Layout for protected routes)
'use client';

import React from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@/components/app-header';
import { AuthProviderWrapper } from '@/providers/AuthProviderWrapper'; // Import the wrapper

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout wraps all pages within the (app) group
  // It uses AuthProviderWrapper to handle auth state and loading/redirects
  // for these protected pages.
  return (
    <AuthProviderWrapper>
        <SidebarProvider>
            <Sidebar> {/* Collapsible dark sidebar */}
                <AppSidebar />
            </Sidebar>
            <SidebarInset> {/* Main content area */}
                <Header /> {/* Optional top header */}
                <main className="flex-1 overflow-y-auto bg-background"> {/* Ensure content area scrolls */}
                     {children}
                 </main>
            </SidebarInset>
        </SidebarProvider>
    </AuthProviderWrapper>
  );
}
