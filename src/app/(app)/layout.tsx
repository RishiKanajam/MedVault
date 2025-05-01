'use client';

import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { User, Loader2 } from 'lucide-react'; // Added Loader2
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton'; // Added Skeleton


// TODO: Replace with actual authentication check using Firebase Auth context/listener
// const useAuth = () => ({ isAuthenticated: true, user: { displayName: "Dr. Jane Doe" }, loading: false, logout: () => console.log("logout simulated") }); // Example hook structure

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Simulate auth state - replace with real context/listener
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // Start as null for loading state
  const [userName, setUserName] = useState<string>("Loading...");
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

   useEffect(() => {
    // Simulate fetching auth state
    // In a real app, use Firebase onAuthStateChanged listener here
    const timer = setTimeout(() => {
      // Replace with actual Firebase check
      const fakeAuth = true; // Simulate authenticated
      const fakeUser = "Dr. Jane Doe"; // Simulate user data
      setIsAuthenticated(fakeAuth);
      setUserName(fakeUser);
      setIsLoadingAuth(false);

       if (!fakeAuth) {
         router.replace('/login'); // Redirect if not authenticated after check
       }
    }, 500); // Simulate loading delay

    return () => clearTimeout(timer);
   }, [router]);


  const handleLogout = async () => {
    console.log("Logging out...");
    // TODO: Implement Firebase sign out logic: await auth.signOut();
     setIsLoadingAuth(true); // Show loading indicator during logout process
     // Simulate logout delay
     await new Promise(resolve => setTimeout(resolve, 500));
     setIsAuthenticated(false);
     setIsLoadingAuth(false);
    router.push('/login'); // Redirect to login after logout
  }

  // Render loading state while checking auth
  if (isLoadingAuth || isAuthenticated === null) {
     return (
       <div className="flex min-h-screen w-full items-center justify-center bg-background">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
  }

  // If check complete and not authenticated (should have been redirected, but good as a safeguard)
  if (!isAuthenticated) {
      // This part might not be reached if redirect works correctly, but good as a safeguard
      // Or render a specific "Access Denied" component
     return null;
  }


  // Render layout if authenticated
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-[57px] items-center justify-between gap-2 border-b bg-background px-4">
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
        <main className="flex-1 overflow-auto bg-secondary p-4 lg:p-6">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}
