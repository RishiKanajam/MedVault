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
import { useUserContext } from '@/context/UserContext'; // Import the user context hook
import { signOut } from 'firebase/auth'; // Import Firebase sign out
import { auth, db } from '@/firebase'; // Import Firebase instances
import { doc, updateDoc } from 'firebase/firestore'; // Import Firestore update
import { ProtectedRoute } from '@/hooks/useAuthGuard'; // Import ProtectedRoute wrapper

// Connectivity Indicator (remains the same)
const ConnectivityIndicator = () => {
  const [isOnline, setIsOnline] = useState(true); // Assume online initially

  useEffect(() => {
    const checkOnlineStatus = () => {
       // Check if navigator is available (client-side)
      if (typeof navigator !== 'undefined') {
           setIsOnline(navigator.onLine);
       }
    };

    checkOnlineStatus(); // Initial check
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);


    return () => {
       if (typeof navigator !== 'undefined') {
            window.removeEventListener('online', checkOnlineStatus);
            window.removeEventListener('offline', checkOnlineStatus);
       }
    };
  }, []);


   // Avoid rendering on server or before hydration
   if (typeof navigator === 'undefined') {
     return null;
   }


  const Icon = isOnline ? Wifi : WifiOff;
  const color = isOnline ? 'text-green-500' : 'text-muted-foreground';
  const title = isOnline ? 'Online' : 'Offline - Using cached data';

  return (
     <div className="flex items-center gap-1" title={title}>
        <Icon className={`h-4 w-4 ${color}`} />
     </div>
  );
};


// Logo Component that adapts to theme (remains the same)
const AppLogo = () => {
    const { resolvedTheme } = useTheme();
    const [logoSrc, setLogoSrc] = useState('/logo-light.png'); // Default to light
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Set the logo based on the resolved theme (accounts for 'system' preference)
         if (resolvedTheme) {
             setLogoSrc(resolvedTheme === 'dark' ? '/logo-dark.png' : '/logo-light.png');
         }
    }, [resolvedTheme]);

    // Prevent hydration mismatch by delaying render until mounted
    if (!mounted || !resolvedTheme) {
       // Render a placeholder or null during SSR / hydration phase
        return <div className="w-8 h-8 bg-muted rounded-full"></div>; // Example placeholder
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


function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authUser, profile, loading: isLoadingUser } = useUserContext(); // Use context hook
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ name: '', photoURL: '' });
  const { toast } = useToast();

   // Update form data when profile loads/changes
   useEffect(() => {
     if (profile) {
       setProfileFormData({
         name: profile.name || '',
         photoURL: profile.photoURL || '',
       });
     }
   }, [profile]);


  const handleLogout = async () => {
    console.log("Logging out...");
    try {
       await signOut(auth);
       toast({ title: "Logged Out", description: "You have been successfully logged out." });
       router.push('/login'); // Redirect to login page after logout
     } catch (error) {
       console.error("Logout error:", error);
       toast({ title: "Logout Error", description: "Failed to log out.", variant: "destructive" });
     }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!authUser) return;
     setIsUpdatingProfile(true);

     try {
       // Update Firestore first
       const userDocRef = doc(db, 'users', authUser.uid);
       await updateDoc(userDocRef, {
         name: profileFormData.name,
         photoURL: profileFormData.photoURL,
       });

        // Then update Firebase Auth profile (optional, depends if you use it directly)
        // await updateProfile(authUser, {
        //   displayName: profileFormData.name,
        //   photoURL: profileFormData.photoURL,
        // });


       toast({ title: "Profile Updated", description: "Your profile information has been saved." });
       setIsProfileModalOpen(false);
     } catch (error) {
       console.error("Profile update error:", error);
       toast({ title: "Update Failed", description: "Could not update profile.", variant: "destructive" });
     } finally {
        setIsUpdatingProfile(false);
     }
  }

   // Show loading indicator while user context is loading
   if (isLoadingUser) {
      return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
   }

   // If loading is done but no authenticated user (should be handled by ProtectedRoute, but as fallback)
   if (!authUser) {
     // ProtectedRoute should handle the redirect, but this is a safety net.
     // Returning null avoids rendering the layout for unauthenticated users briefly.
     return null;
   }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <SidebarInset className="flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-6 shrink-0">
           {/* Left side */}
           <div className="flex items-center gap-3">
                <AppLogo />
               <span className="font-semibold text-lg text-foreground hidden md:inline">MediSync Pro</span>
           </div>

           {/* Right side */}
           <div className="flex items-center gap-4">
             <ConnectivityIndicator />
             <ThemeToggle />
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                       {/* Use profile data from context */}
                      <AvatarImage src={profile?.photoURL || undefined} alt={profile?.name || 'User'} data-ai-hint="user avatar" />
                      <AvatarFallback className="bg-muted text-muted-foreground">
                         {/* Use profile name for fallback initials */}
                        {profile?.name ? profile.name.slice(0, 2).toUpperCase() : <User className="h-5 w-5"/>}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 overlay-tertiary">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                       {/* Use profile data */}
                      <p className="text-sm font-medium leading-none text-foreground">{profile?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{authUser?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem onSelect={() => setIsProfileModalOpen(true)} className="focus:bg-accent/10 focus:text-accent-foreground">
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push('/settings')} className="focus:bg-accent/10 focus:text-accent-foreground">
                    Settings
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem disabled className="focus:bg-accent/10 focus:text-accent-foreground opacity-50 cursor-not-allowed">
                    Support
                  </DropdownMenuItem> */}
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

      {/* Profile Modal */}
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
                   {/* Use controlled input */}
                  <Input
                     id="name"
                     value={profileFormData.name}
                     onChange={(e) => setProfileFormData(prev => ({...prev, name: e.target.value }))}
                     className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input id="email" type="email" value={authUser?.email || ''} className="col-span-3" disabled />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="photoURL" className="text-right">
                    Photo URL
                  </Label>
                   {/* Use controlled input */}
                  <Input
                     id="photoURL"
                     value={profileFormData.photoURL}
                     onChange={(e) => setProfileFormData(prev => ({...prev, photoURL: e.target.value }))}
                     className="col-span-3"
                    />
                     {/* Optional: Preview image */}
                     {profileFormData.photoURL && (
                        <div className="col-span-3 col-start-2 mt-2">
                           <Avatar className="h-16 w-16">
                             <AvatarImage src={profileFormData.photoURL} alt="Profile Preview" />
                             <AvatarFallback className="bg-muted">?</AvatarFallback>
                           </Avatar>
                        </div>
                     )}
                </div>
              </div>
              <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                 </DialogClose>
                <Button type="submit" variant="default" disabled={isUpdatingProfile}>
                   {isUpdatingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                   {isUpdatingProfile ? 'Saving...' : 'Save changes'}
                </Button>
              </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}


// Export the layout wrapped in ProtectedRoute
export default function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayoutContent>{children}</AppLayoutContent>
    </ProtectedRoute>
  );
}
