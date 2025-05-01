'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar'; // Updated path
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { User, Loader2, WifiOff } from 'lucide-react'; // Added WifiOff
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
import { Skeleton } from '@/components/ui/skeleton';
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


const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Initial check
    if (typeof navigator !== 'undefined') {
       setIsOffline(!navigator.onLine);
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

  if (!isOffline) return null;

  return (
    <div className="bg-destructive text-destructive-foreground p-2 text-center text-sm flex items-center justify-center gap-2 sticky top-0 z-50">
      <WifiOff className="h-4 w-4" />
      You are currently offline. Data is being saved locally.
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
      // Or render a specific "Access Denied" component
      // This state should ideally not be reached if redirection works,
      // but acts as a fallback. Redirecting is generally preferred.
     return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
          <p>Redirecting to login...</p>
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        </div>
      );
   }


  // Render layout if authenticated
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="flex flex-1 flex-col">
         <OfflineBanner />
        <header className="sticky top-0 z-20 flex h-[57px] items-center justify-between gap-2 border-b bg-background px-4 shrink-0">
           {/* Adjust top position based on OfflineBanner */}
          <div className="flex items-center gap-2">
             <SidebarTrigger className="md:hidden" />
             {/* Optionally add breadcrumbs or page title here */}
             <span className="font-semibold text-lg hidden md:inline">MediSync Pro</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} data-ai-hint="user avatar" />
                   <AvatarFallback>
                     {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="h-5 w-5"/>}
                   </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                 <div className="flex flex-col space-y-1">
                   <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                   <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                 </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
               <DropdownMenuItem onSelect={() => setIsProfileModalOpen(true)}>
                 Profile
               </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuItem disabled>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </header>
        <main className="flex-1 overflow-auto bg-secondary p-4 lg:p-6">
          {children}
        </main>
      </SidebarInset>

      {/* Profile Modal */}
       <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProfileUpdate}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input id="name" defaultValue={user?.displayName} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input id="email" type="email" defaultValue={user?.email} className="col-span-3" disabled />
                </div>
                 {/* Add Photo URL input if needed */}
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="photoURL" className="text-right">
                    Photo URL
                  </Label>
                  <Input id="photoURL" defaultValue={user?.photoURL} className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                 </DialogClose>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
