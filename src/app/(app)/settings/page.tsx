'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
// import { Switch } from '@/components/ui/switch'; // Switch no longer needed for modules
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Sun, Moon, Languages, RefreshCw, Palette } from 'lucide-react'; // Removed module icons
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { ThemeToggle } from '@/components/theme-toggle';
import { useUserContext } from '@/context/UserContext'; // Import user context
import { doc, updateDoc } from 'firebase/firestore'; // Import firestore update
import { db } from '@/firebase'; // Import firestore instance

// Removed useSettings hook as module logic is gone
// Language and theme are handled differently now

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, setTheme, systemTheme } = useTheme();
  const { authUser, profile, loading: userLoading } = useUserContext(); // Get user context
  const [language, setLanguage] = useState('en'); // Local state for language, TODO: load from profile
  const [loading, setLoading] = useState(true); // Combined loading state
  const [isSyncing, setIsSyncing] = useState(false);

   // Effect to manage loading state and potentially load language from profile
  useEffect(() => {
    if (!userLoading) {
      // TODO: Load language from profile.settings.language if implemented
      // if (profile?.settings?.language) {
      //   setLanguage(profile.settings.language);
      // }
      setLoading(false);
    }
  }, [userLoading, profile]);


  // Removed handleModuleToggle

  const handleLanguageChange = async (value: string) => {
    if (!authUser) return;
    setLanguage(value);
    // TODO: Save language to Firestore profile
    try {
       const userDocRef = doc(db, 'users', authUser.uid);
       await updateDoc(userDocRef, { 'settings.language': value }); // Example path
       toast({ title: "Language Changed", description: `Language set to ${value}.` });
       // TODO: Implement actual i18n library update if using one
     } catch (error) {
       console.error("Error saving language setting:", error);
       toast({ title: "Error", description: "Could not save language setting.", variant: "destructive"});
     }
  };

   const handleThemeChange = async (newTheme: string) => {
     if (!authUser) return;
     setTheme(newTheme); // Update next-themes state
     // Save theme preference to Firestore
     try {
       const userDocRef = doc(db, 'users', authUser.uid);
       await updateDoc(userDocRef, { 'settings.theme': newTheme }); // Save preference
       toast({ title: "Theme Updated", description: `Theme set to ${newTheme}.` });
     } catch (error) {
       console.error("Error saving theme setting:", error);
       toast({ title: "Error", description: "Could not save theme preference.", variant: "destructive"});
     }
   };


  const handleSync = async () => {
    setIsSyncing(true);
    // TODO: Implement manual sync logic (e.g., re-fetch data using React Query invalidate)
    console.log('Manual sync triggered...');
    // Example: queryClient.invalidateQueries(); // Invalidate all queries
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate sync delay
    setIsSyncing(false);
    toast({ title: "Sync Complete", description: "Data synchronized successfully." });
  };

   if (loading) {
     // Use a simple spinner or skeleton loaders
     return <div className="flex justify-center items-center h-64"><RefreshCw className="animate-spin h-8 w-8 text-primary" /></div>;
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
              <Label htmlFor="theme-toggle" className="flex items-center gap-2 font-normal cursor-pointer">
                 <Palette className="w-4 h-4 text-primary"/> Theme
              </Label>
              {/* Use Select for theme instead of ThemeToggle for explicit saving */}
               <Select value={theme} onValueChange={handleThemeChange}>
                 <SelectTrigger className="w-[180px]">
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
