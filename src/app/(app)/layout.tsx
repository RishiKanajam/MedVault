'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react'; // Placeholder for user icon
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


// TODO: Replace with actual authentication check and user data retrieval
const isAuthenticated = true; // Placeholder for auth state
const userName = "Dr. Jane Doe"; // Placeholder for user name

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.replace('/login'); // Use replace to avoid back button going to protected route
    }
  }, [isAuthenticated, router]);

  // Render null or a loading indicator while checking auth/redirecting
  if (!isAuthenticated) {
    return null; // Or a loading spinner
  }

  const handleLogout = () => {
    console.log("Logging out...");
    // TODO: Implement Firebase sign out logic
    // router.push('/login');
  }

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="flex flex-col flex-1">
        <header className="sticky top-0 z-10 flex h-[57px] items-center gap-2 border-b bg-background px-4 justify-between">
          <div className="flex items-center gap-2">
             <SidebarTrigger className="md:hidden" />
             {/* Optionally add breadcrumbs or page title here */}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{userName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6 bg-secondary">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}
