'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar'; // Updated path
import { SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { User, Loader2, Wifi, WifiOff } from 'lucide-react'; // Added Wifi, WifiOff
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Added Avatar
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"; // Added Dialog
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast'; // Added useToast

// Placeholder - replace with actual Firebase Auth hook/context
const useAuth = () => {
  // Simulate fetching user data and auth state
  const [user, setUser] = useState<{ displayName: string; email: string; photoURL?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      // In real app, use onAuthStateChanged listener
      const fakeAuth = true; // Simulate logged in
      if (fakeAuth) {
        setUser({ displayName: "Dr. Anya Sharma", email: "anya.sharma@medsync.pro", photoURL: "https://picsum.photos/id/237/40/40" });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    }, 500); // Simulate loading
    return () => clearTimeout(timer);
  }, []);

  const logout = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate logout delay
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
    console.log("Logout simulated");
  };

  return { isAuthenticated, user, loading, logout };
};


const ConnectivityIndicator = () => {
  const [isOnline, setIsOnline] = useState(true); // Assume online initially

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Initial check
    if (typeof navigator !== 'undefined') {
       setIsOnline(navigator.onLine);
       window.addEventListener('online', handleOnline);
       window.addEventListener('offline', handleOffline);
    }


    return () => {
      if (typeof navigator !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  const Icon = isOnline ? Wifi : WifiOff;
  const color = isOnline ? 'text-green-500' : 'text-gray-400'; // Green for online, gray for offline
  const title = isOnline ? 'Online' : 'Offline';

  return (
     <div className="flex items-center gap-1" title={title}>
        <Icon className={`h-4 w-4 ${color}`} />
        {/* Optional: Show text label */}
        {/* <span className={`text-xs ${color}`}>{title}</span> */}
     </div>
  );
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, loading: isLoadingAuth, logout } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { toast } = useToast();

   useEffect(() => {
     // Redirect if not authenticated after loading check (client-side)
     if (!isLoadingAuth && !isAuthenticated) {
       router.replace('/'); // Redirect to landing/login page
     }
   }, [isLoadingAuth, isAuthenticated, router]);


  const handleLogout = async () => {
    console.log("Logging out...");
    await logout();
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/'); // Redirect to landing/login after logout
  }

  const handleProfileUpdate = (e: React.FormEvent) => {
     e.preventDefault();
     // TODO: Implement Firestore update logic for user profile
     console.log("Profile update simulated");
     toast({ title: "Profile Updated", description: "Your profile information has been saved." });
     setIsProfileModalOpen(false);
  }

  // Render loading state while checking auth
  if (isLoadingAuth) {
     return (
       <div className="flex min-h-screen w-full items-center justify-center bg-background">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
  }

  // If check complete and not authenticated (should have been redirected, but good as a safeguard)
   if (!isAuthenticated) {
     return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
          <p>Redirecting to login...</p>
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        </div>
      );
   }


  // Render layout if authenticated
  return (
    <div className="flex min-h-screen w-full bg-background"> {/* Main background is light gray */}
      <AppSidebar />
      <SidebarInset className="flex flex-1 flex-col">
        {/* Header with fixed height and border */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-6 shrink-0"> {/* h-16 = 64px, bg-surface = white, px-6 = 24px */}
           {/* Left side: Optionally add breadcrumbs or page title here */}
           <div className="flex items-center gap-2">
               {/* <SidebarTrigger className="md:hidden" />  <- Handled by Sidebar component now */}
               <span className="font-semibold text-lg text-foreground hidden md:inline">MediSync Pro</span>
           </div>

           {/* Right side: Connectivity Indicator + User Menu */}
           <div className="flex items-center gap-4">
             <ConnectivityIndicator />
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full"> {/* Increased size */}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} data-ai-hint="user avatar" />
                      <AvatarFallback className="bg-muted text-muted-foreground"> {/* Adjusted fallback style */}
                        {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : <User className="h-5 w-5"/>}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                {/* Profile dropdown with updated background and shadow */}
                <DropdownMenuContent align="end" className="w-56 bg-sidebar-hover text-sidebar-foreground shadow-overlay border-sidebar-border">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                      <p className="text-xs leading-none text-sidebar-foreground/70">{user?.email}</p> {/* Lighter text */}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-sidebar-border" />
                  <DropdownMenuItem onSelect={() => setIsProfileModalOpen(true)} className="focus:bg-sidebar-accent focus:text-sidebar-foreground">
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push('/settings')} className="focus:bg-sidebar-accent focus:text-sidebar-foreground">
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="focus:bg-sidebar-accent focus:text-sidebar-foreground">
                    Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-sidebar-border" />
                  <DropdownMenuItem onSelect={handleLogout} className="focus:bg-sidebar-accent focus:text-sidebar-foreground">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
           </div>

        </header>
        {/* Main content area with padding */}
        <main className="flex-1 overflow-auto p-6"> {/* p-6 = 24px */}
          {children}
        </main>
      </SidebarInset>

      {/* Profile Modal */}
       <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        {/* Use panel-primary styling (white background) for the modal */}
        <DialogContent className="sm:max-w-[425px] bg-surface text-foreground border-border shadow-lg">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProfileUpdate}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right text-foreground">
                    Name
                  </Label>
                  <Input id="name" defaultValue={user?.displayName} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right text-foreground">
                    Email
                  </Label>
                  <Input id="email" type="email" defaultValue={user?.email} className="col-span-3" disabled />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="photoURL" className="text-right text-foreground">
                    Photo URL
                  </Label>
                  <Input id="photoURL" defaultValue={user?.photoURL} className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                 </DialogClose>
                 {/* Primary button uses teal */}
                <Button type="submit" variant="default">Save changes</Button>
              </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
