// src/app/(app)/layout.tsx
import React from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@/components/layout/header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-muted/30">
      <SidebarProvider style={{ '--sidebar-width': '264px', '--sidebar-width-icon': '264px' } as React.CSSProperties}>
        <div className="relative flex min-h-screen w-full">
          <Sidebar className="border-r border-border/40 bg-background/95 backdrop-blur-sm">
            <AppSidebar />
          </Sidebar>
          <SidebarInset className="flex-1 bg-transparent">
            <Header />
            <div className="relative flex-1 overflow-y-auto">
              <main className="relative z-10 flex-1 pb-16">{children}</main>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
