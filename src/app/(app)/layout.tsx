'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar'; // Updated path
import { SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { User, Loader2, Wifi, WifiOff } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle'; // Import ThemeToggle
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image'; // Import Image for logo
import { useTheme } from "next-themes"; // Import useTheme

// Placeholder - replace with actual Firebase Auth hook/context
const useAuth = () => {
  const [user, setUser] = useState<{ displayName: string; email: string; photoURL?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const fakeAuth = true;
      if (fakeAuth) {
        setUser({ displayName: "Dr. Anya Sharma", email: "anya.sharma@medsync.pro", photoURL: "https://picsum.photos/id/237/40/40" });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const logout = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
    console.log("Logout simulated");
  };

  return { isAuthenticated, user, loading, logout };
};

// Improved Connectivity Indicator
const ConnectivityIndicator = () => {
  const [isOnline, setIsOnline] = useState(true); // Assume online initially

  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Initial check
    if (typeof navigator !== 'undefined') {
      checkOnlineStatus(); // Check immediately
      window.addEventListener('online', checkOnlineStatus);
      window.addEventListener('offline', checkOnlineStatus);
    }

    return () => {
      if (typeof navigator !== 'undefined') {
        window.removeEventListener('online', checkOnlineStatus);
        window.removeEventListener('offline', checkOnlineStatus);
      }
    };
  }, []);

  const Icon = isOnline ? Wifi : WifiOff;
  // Use Tailwind classes for color based on theme
  const color = isOnline ? 'text-green-500' : 'text-muted-foreground'; // Muted foreground for offline
  const title = isOnline ? 'Online' : 'Offline';

  return (
     <div className="flex items-center gap-1" title={title}>
        <Icon className={`h-4 w-4 ${color}`} />
     </div>
  );
};

// Logo Component that adapts to theme
const AppLogo = () => {
    const { resolvedTheme } = useTheme();
    const [logoSrc, setLogoSrc] = useState('/logo-light.png'); // Default to light

    useEffect(() => {
        // Set the logo based on the resolved theme (accounts for 'system' preference)
        setLogoSrc(resolvedTheme === 'dark' ? '/logo-dark.png' : '/logo-light.png');
    }, [resolvedTheme]);

    // Basic check to prevent rendering if theme isn't resolved yet (optional)
    if (!resolvedTheme) {
        return null; // Or a placeholder skeleton
    }

    return (
        <Image
            src={logoSrc}
            alt="MediSync Pro Logo"
            width={32} // Adjust size as needed
            height={32}
            priority // Prioritize loading the logo
        />
    );
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, loading: isLoadingAuth, logout } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { toast } = useToast();

   useEffect(() => {
     if (!isLoadingAuth && !isAuthenticated) {
       router.replace('/');
     }
   }, [isLoadingAuth, isAuthenticated, router]);


  const handleLogout = async () => {
    console.log("Logging out...");
    await logout();
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/');
  }

  const handleProfileUpdate = (e: React.FormEvent) => {
     e.preventDefault();
     // TODO: Implement Firestore update logic for user profile
     console.log("Profile update simulated");
     toast({ title: "Profile Updated", description: "Your profile information has been saved." });
     setIsProfileModalOpen(false);
  }

  if (isLoadingAuth) {
     return (
       <div className="flex min-h-screen w-full items-center justify-center bg-background">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
  }

   if (!isAuthenticated) {
     return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
          <p>Redirecting to login...</p>
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        </div>
      );
   }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <SidebarInset className="flex flex-1 flex-col">
        {/* Header: Use surface bg, defined height, bottom border */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-6 shrink-0">
           {/* Left side: Logo and Title */}
           <div className="flex items-center gap-3">
               {/* Use SidebarTrigger from ui/sidebar if needed for mobile */}
               {/* <SidebarTrigger className="md:hidden" /> */}
                <AppLogo /> {/* Dynamic Logo */}
               <span className="font-semibold text-lg text-foreground hidden md:inline">MediSync Pro</span>
           </div>

           {/* Right side: Connectivity, Theme Toggle, User Menu */}
           <div className="flex items-center gap-4">
             <ConnectivityIndicator />
             <ThemeToggle /> {/* Add Theme Toggle Button */}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} data-ai-hint="user avatar" />
                       {/* Use muted background for fallback */}
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : <User className="h-5 w-5"/>}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                {/* Use tertiary overlay for profile menu */}
                <DropdownMenuContent align="end" className="w-56 overlay-tertiary">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground">{user?.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                   {/* Use accent color on focus/hover */}
                  <DropdownMenuItem onSelect={() => setIsProfileModalOpen(true)} className="focus:bg-accent/10 focus:text-accent-foreground">
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push('/settings')} className="focus:bg-accent/10 focus:text-accent-foreground">
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="focus:bg-accent/10 focus:text-accent-foreground opacity-50 cursor-not-allowed">
                    Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem onSelect={handleLogout} className="focus:bg-accent/10 focus:text-accent-foreground">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
           </div>

        </header>
        {/* Main content area */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </SidebarInset>

      {/* Profile Modal: Use primary panel styling */}
       <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="panel-primary sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription className="text-muted-foreground">
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
                <Button type="submit" variant="default">Save changes</Button> {/* Primary button */}
              </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
