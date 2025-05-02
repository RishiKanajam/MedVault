// src/app/settings/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Sun, Moon, Languages, RefreshCw, Palette, User } from 'lucide-react'; // Added User icon
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { useAuth } from '@/providers/AuthProvider'; // Import auth context
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase'; // Use correct firebase path
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Input } from '@/components/ui/input'; // Import Input
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar
import { updateProfile as updateAuthProfile } from "firebase/auth"; // Firebase Auth update

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user: authUser, profile, authLoading } = useAuth();
  const clinicId = profile?.clinicId;

  // State for settings form fields
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [language, setLanguage] = useState('en');
  const [currentTheme, setCurrentTheme] = useState('system');
  const [isProfileLoading, setIsProfileLoading] = useState(false); // Loading state for profile update

  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize form with profile data when available
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.name || authUser?.displayName || "");
      setPhotoURL(profile.photoURL || authUser?.photoURL || "");
      setLanguage(profile.settings?.language || 'en');
      setCurrentTheme(profile.settings?.theme || 'system');
      // Apply theme from profile if not system default
      if (profile.settings?.theme && profile.settings.theme !== 'system') {
        setTheme(profile.settings.theme);
      } else {
        setTheme('system');
      }
    } else if (authUser) {
        // Fallback to authUser if profile is null initially
        setDisplayName(authUser.displayName || "");
        setPhotoURL(authUser.photoURL || "");
    }
  }, [profile, authUser, setTheme]);


  const handleLanguageChange = async (value: string) => {
    if (!authUser) return;
    setLanguage(value);
    try {
       const userDocRef = doc(db, 'users', authUser.uid);
       await updateDoc(userDocRef, { 'settings.language': value });
       toast({ title: "Language Changed", description: `Language set to ${value}.` });
     } catch (error) {
       toast({ title: "Error", description: "Could not save language setting.", variant: "destructive"});
     }
  };

   const handleThemeChange = async (newTheme: string) => {
     if (!authUser) return;
     setCurrentTheme(newTheme);
     setTheme(newTheme);
     try {
       const userDocRef = doc(db, 'users', authUser.uid);
       await updateDoc(userDocRef, { 'settings.theme': newTheme });
       toast({ title: "Theme Updated", description: `Theme set to ${newTheme}.` });
     } catch (error) {
       toast({ title: "Error", description: "Could not save theme preference.", variant: "destructive"});
     }
   };


  const handleSync = async () => {
    setIsSyncing(true);
    // TODO: Implement manual sync (e.g., invalidate React Query caches)
    console.log('Manual sync triggered...');
    // Example: queryClient.invalidateQueries();
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSyncing(false);
    toast({ title: "Sync Complete", description: "Data synchronized successfully." });
  };

  // Handle profile update
  const handleProfileUpdate = async (event: React.FormEvent) => {
     event.preventDefault();
     setIsProfileLoading(true);

     if (!authUser) {
       toast({ title: "Error", description: "Authentication required.", variant: "destructive" });
       setIsProfileLoading(false);
       return;
     }

     try {
       // Update Firestore first
       const userDocRef = doc(db, "users", authUser.uid);
       await updateDoc(userDocRef, { name: displayName, photoURL: photoURL });

       // Then update Firebase Auth profile
       await updateAuthProfile(authUser, { displayName: displayName, photoURL: photoURL });

       toast({ title: "Profile Updated", description: "Your profile has been updated successfully!" });
     } catch (error) {
       console.error("Error updating profile:", error);
       toast({ title: "Update Failed", description: "Could not update profile.", variant: "destructive" });
     } finally {
         setIsProfileLoading(false);
     }
   };


   // Use authLoading for the page loading state
   if (authLoading) {
     return (
        <div className="p-6 space-y-6">
            <Skeleton className="h-40 w-full bg-muted" />
            <Skeleton className="h-60 w-full bg-muted" />
        </div>
    );
   }

  return (
    <div className="space-y-6 animate-fadeIn p-6"> {/* Added padding */}
       {/* Profile Settings Card */}
       <Card className="panel-primary">
         <CardHeader>
           <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Profile Settings</CardTitle>
           <CardDescription>Update your display name and profile picture URL.</CardDescription>
         </CardHeader>
         <form onSubmit={handleProfileUpdate}>
           <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={photoURL || undefined} alt={displayName || 'User'} />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                         {displayName ? displayName.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
                     </AvatarFallback>
                 </Avatar>
                  <div className="flex-1 space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                          type="text"
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          required
                          disabled={isProfileLoading}
                      />
                  </div>
              </div>
               <div className="space-y-2">
                  <Label htmlFor="photoURL">Photo URL</Label>
                  <Input
                      type="url"
                      id="photoURL"
                      value={photoURL}
                      onChange={(e) => setPhotoURL(e.target.value)}
                      disabled={isProfileLoading}
                      placeholder="https://example.com/avatar.png"
                  />
              </div>
           </CardContent>
            <CardFooter>
                <Button type="submit" disabled={isProfileLoading}>
                    {isProfileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isProfileLoading ? "Saving..." : "Update Profile"}
                </Button>
            </CardFooter>
         </form>
       </Card>

      {/* General Settings Card */}
      <Card className="panel-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><SettingsIcon className="w-5 h-5 text-primary" /> General Settings</CardTitle>
          <CardDescription>Manage application preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Appearance Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Appearance</h3>
             <Separator />
            <div className="flex items-center justify-between space-x-2 p-3 rounded-md border bg-background">
              <Label htmlFor="theme-select" className="flex items-center gap-2 font-normal">
                 <Palette className="w-4 h-4 text-primary"/> Theme
              </Label>
               <Select value={currentTheme} onValueChange={handleThemeChange}>
                 <SelectTrigger id="theme-select" className="w-[180px]">
                   <SelectValue placeholder="Select theme" />
                 </SelectTrigger>
                 <SelectContent className="overlay-tertiary"> {/* Use tertiary overlay */}
                   <SelectItem value="light">Light</SelectItem>
                   <SelectItem value="dark">Dark</SelectItem>
                   <SelectItem value="system">System</SelectItem>
                 </SelectContent>
               </Select>
            </div>

            <div className="flex items-center justify-between space-x-2 p-3 rounded-md border bg-background">
              <Label htmlFor="language-select" className="flex items-center gap-2 font-normal">
                 <Languages className="w-4 h-4 text-info"/> Language
              </Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger id="language-select" className="w-[180px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="overlay-tertiary"> {/* Use tertiary overlay */}
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  {/* Add more languages as needed */}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Data & Sync */}
          <div className="space-y-4">
             <h3 className="text-lg font-medium">Data & Synchronization</h3>
             <Separator />
             <div className="flex items-center justify-between space-x-2 p-3 rounded-md border bg-background">
               <div className="flex flex-col">
                    <Label className="font-normal">Manual Sync</Label>
                    <p className="text-sm text-muted-foreground">Force sync data with the server.</p>
               </div>
              <Button onClick={handleSync} disabled={isSyncing} variant="outline">
                <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
             </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}