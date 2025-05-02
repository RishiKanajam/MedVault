'use client';
import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation'; // Use App Router's useRouter
import { AuthContext, AuthProvider } from '@/providers/AuthProvider'; // Import context and provider
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { User, Wifi, WifiOff, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
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
import Image from 'next/image';
import { useTheme } from "next-themes";
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase'; // Use correct firebase path
import { doc, updateDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react'; // Import Loader


// --- Re-integrated Header Components ---

// Connectivity Indicator
const ConnectivityIndicator = () => {
  const [isOnline, setIsOnline] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const checkOnlineStatus = () => {
       if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
           setIsOnline(navigator.onLine);
       }
    };
    checkOnlineStatus();
    if (typeof window !== 'undefined') {
        window.addEventListener('online', checkOnlineStatus);
        window.addEventListener('offline', checkOnlineStatus);
        return () => {
            window.removeEventListener('online', checkOnlineStatus);
            window.removeEventListener('offline', checkOnlineStatus);
        };
    }
  }, []);

    if (!mounted) return null;

  const Icon = isOnline ? Wifi : WifiOff;
  const color = isOnline ? 'text-green-500' : 'text-muted-foreground';
  const title = isOnline ? 'Online' : 'Offline - Using cached data';

  return (
     <div className="flex items-center gap-1" title={title}>
        <Icon className={`h-4 w-4 ${color}`} />
     </div>
  );
};


// AppLogo component
const AppLogo = () => {
    const { resolvedTheme } = useTheme();
    const [logoSrc, setLogoSrc] = React.useState('/logo-light.png'); // Default to light logo
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => { setMounted(true); }, []);

     React.useEffect(() => {
         if (mounted && resolvedTheme) {
             setLogoSrc(resolvedTheme === 'dark' ? '/logo-dark.png' : '/logo-light.png');
         }
     }, [mounted, resolvedTheme]);

    if (!mounted) {
        return <div className="w-8 h-8 bg-muted rounded-full"></div>; // Placeholder
    }

    return (
        <Image
            src={logoSrc}
            alt="MediSync Pro Logo"
            width={32}
            height={32}
            priority
        />
    );
};


// --- Main Protected Layout: Wraps Protected Pages ---
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
    >
       {/* AuthProvider now wraps the actual layout content */}
       <AuthProvider>
         <ProtectedLayoutContent>
             {children}
         </ProtectedLayoutContent>
       </AuthProvider>
    </ThemeProvider>
  );
}


// --- Inner Content Component (requires AuthContext) ---
// This component handles rendering the protected UI or redirecting
function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user: authUser, profile, authLoading } = useContext(AuthContext); // Use context
    const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);
    const [profileFormData, setProfileFormData] = React.useState({ name: '', photoURL: '' });
    const { toast } = useToast();

    useEffect(() => {
      // If loading is finished and there's no user, redirect to login
      if (!authLoading && !authUser) {
        console.log("[ProtectedLayoutContent] No authenticated user found after load. Redirecting to login.");
        router.replace('/auth/login');
      }
    }, [authLoading, authUser, router]);

    useEffect(() => {
        if (profile) {
            setProfileFormData({
                name: profile.name || '',
                photoURL: profile.photoURL || '',
            });
        }
    }, [profile]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({ title: "Logged Out", description: "You have been successfully logged out." });
            // Redirect handled by the useEffect hook above when authUser becomes null
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
            const userDocRef = doc(db, 'users', authUser.uid);
            await updateDoc(userDocRef, {
                name: profileFormData.name,
                photoURL: profileFormData.photoURL,
            });
            // Note: Auth profile display name update requires updateProfile from 'firebase/auth'
            // await updateProfile(authUser, { displayName: profileFormData.name, photoURL: profileFormData.photoURL });
            toast({ title: "Profile Updated", description: "Your profile information has been saved." });
            setIsProfileModalOpen(false);
        } catch (error) {
            console.error("Profile update error:", error);
            toast({ title: "Update Failed", description: "Could not update profile.", variant: "destructive" });
        } finally {
            setIsUpdatingProfile(false);
        }
    }

    // If still loading or no user (and redirect hasn't happened yet), show nothing or a minimal loader
    // The main loader is handled by AuthProvider itself
    if (authLoading || !authUser) {
       // Render minimal loader or null while redirecting
        return (
          <div className="flex items-center justify-center h-screen bg-background">
            <Loader2 className="animate-spin h-12 w-12 text-primary" />
          </div>
        );
    }

    // Render the protected layout only when authenticated
    return (
         <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background">
                <AppSidebar />
                <SidebarInset className="flex flex-1 flex-col">
                    {/* Header */}
                    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-6 shrink-0">
                        <div className="flex items-center gap-3">
                            <AppLogo />
                            <span className="font-semibold text-lg text-foreground hidden md:inline">MediSync Pro</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <ConnectivityIndicator />
                            <ThemeToggle />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                    <Avatar className="h-10 w-10">
                                    <AvatarImage src={profile?.photoURL || undefined} alt={profile?.name || 'User'} data-ai-hint="user avatar" />
                                    <AvatarFallback className="bg-muted text-muted-foreground">
                                        {profile?.name ? profile.name.slice(0, 2).toUpperCase() : <User className="h-5 w-5"/>}
                                    </AvatarFallback>
                                    </Avatar>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 overlay-tertiary"> {/* Use tertiary overlay */}
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none text-foreground">{profile?.name}</p>
                                            <p className="text-xs leading-none text-muted-foreground">{authUser?.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-border" />
                                    <DropdownMenuItem onSelect={() => setIsProfileModalOpen(true)} className="focus:bg-accent/10 focus:text-accent-foreground">
                                        Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => router.push('/settings')} className="focus:bg-accent/10 focus:text-accent-foreground">
                                        <SettingsIcon className="mr-2 h-4 w-4" /> Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border" />
                                    <DropdownMenuItem onSelect={handleLogout} className="focus:bg-accent/10 focus:text-accent-foreground">
                                         <LogOut className="mr-2 h-4 w-4" /> Logout
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
                    <DialogContent className="panel-primary sm:max-w-[425px]"> {/* Use primary panel style */}
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                        Make changes to your profile here. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleProfileUpdate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input
                                id="name"
                                value={profileFormData.name}
                                onChange={(e) => setProfileFormData(prev => ({...prev, name: e.target.value }))}
                                className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input id="email" type="email" value={authUser?.email || ''} className="col-span-3" disabled />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="photoURL" className="text-right">Photo URL</Label>
                            <Input
                                id="photoURL"
                                value={profileFormData.photoURL}
                                onChange={(e) => setProfileFormData(prev => ({...prev, photoURL: e.target.value }))}
                                className="col-span-3"
                                />
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
        </SidebarProvider>
    );
}

    