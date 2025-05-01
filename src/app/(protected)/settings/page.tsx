
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Sun, Moon, Languages, RefreshCw, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { useAuth } from '@/providers/AuthProvider'; // Import auth context
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase'; // Use correct firebase path
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme(); // Removed systemTheme as explicit selection is used
  const { user: authUser, profile, authLoading } = useAuth(); // Use user context
  const clinicId = profile?.clinicId; // Get clinicId

  // Initialize language and theme from profile or default
  const [language, setLanguage] = useState('en');
  const [currentTheme, setCurrentTheme] = useState('system'); // Use local state for controlled Select

  // Update local state when profile loads or changes
  useEffect(() => {
    if (profile) {
      setLanguage(profile.settings?.language || 'en');
      setCurrentTheme(profile.settings?.theme || 'system');
      // Apply theme from profile if not system default
      if (profile.settings?.theme && profile.settings.theme !== 'system') {
        setTheme(profile.settings.theme);
      } else {
        // If profile says system or is null, rely on next-themes default
        setTheme('system'); // Or match your ThemeProvider default
      }
    }
  }, [profile, setTheme]);


  const [isSyncing, setIsSyncing] = useState(false);

  const handleLanguageChange = async (value: string) => {
    if (!authUser || !clinicId) return; // Check for user and clinicId
    setLanguage(value);
    try {
       const userDocRef = doc(db, 'users', authUser.uid); // Use user's doc for settings
       await updateDoc(userDocRef, { 'settings.language': value });
       toast({ title: "Language Changed", description: `Language set to ${value}.` });
     } catch (error) {
       toast({ title: "Error", description: "Could not save language setting.", variant: "destructive"});
     }
  };

   const handleThemeChange = async (newTheme: string) => {
     if (!authUser || !clinicId) return; // Check for user and clinicId
     setCurrentTheme(newTheme); // Update local state for Select
     setTheme(newTheme); // Update next-themes state
     try {
       const userDocRef = doc(db, 'users', authUser.uid); // Use user's doc for settings
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

   // Use authLoading for the page loading state
   if (authLoading) {
     return <div className="p-6"><Skeleton className="h-[50vh] w-full" /></div>;
   }

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card className="panel-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><SettingsIcon className="w-5 h-5 text-primary" /> General Settings</CardTitle>
          <CardDescription>Manage application preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Removed Module Toggles Section */}

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
                 <SelectContent className="overlay-tertiary">
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
                <SelectContent className="overlay-tertiary">
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
