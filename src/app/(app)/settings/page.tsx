// src/app/(app)/settings/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Sun, Moon, Languages, RefreshCw, Boxes, Truck, BrainCircuit, FlaskConical, ClipboardList, Palette } from 'lucide-react'; // Added Palette
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes'; // Import useTheme
import { ThemeToggle } from '@/components/theme-toggle'; // Import ThemeToggle

// TODO: Replace with actual Firestore/AsyncStorage hooks
const useSettings = () => {
    const [modules, setModules] = useState({
        medTrack: true,
        shipment: true,
        rxAI: true,
        pharmaNet: true,
        patientHistory: true,
    });
    const [language, setLanguage] = useState('en');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate fetching settings
        console.log("Fetching settings (simulated)...");
        const fetchSettings = async () => {
            // const storedModules = await AsyncStorage.getItem('modules');
            // const storedLang = await AsyncStorage.getItem('language');
            // TODO: Fetch from Firestore `clinics/{clinicId}/settings`
            await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
            // if (storedModules) setModules(JSON.parse(storedModules));
            // if (storedLang) setLanguage(storedLang);
            setLoading(false);
        }
        fetchSettings();
    }, []);

    const saveModules = async (newModules: typeof modules) => {
        setModules(newModules);
        console.log("Saving modules (simulated):", newModules);
        // await AsyncStorage.setItem('modules', JSON.stringify(newModules));
        // TODO: Save to Firestore `clinics/{clinicId}/settings/modules`
    };

    const saveLanguage = async (newLang: string) => {
        setLanguage(newLang);
        console.log("Saving language (simulated):", newLang);
        // await AsyncStorage.setItem('language', newLang);
        // TODO: Save to Firestore `clinics/{clinicId}/settings/language`
        // TODO: Implement i18n library update
    };

    return { modules, language, loading, saveModules, saveLanguage };
};


export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme(); // Use next-themes hook
  const { modules, language, loading: settingsLoading, saveModules, saveLanguage } = useSettings();
  const [isSyncing, setIsSyncing] = useState(false);

  // No need for local darkMode state, use 'theme' from useTheme

  const handleModuleToggle = (moduleName: keyof typeof modules) => {
    const newState = { ...modules, [moduleName]: !modules[moduleName] };
    saveModules(newState);
    toast({ title: "Module Updated", description: `${moduleName} setting changed.` });
  };

  const handleLanguageChange = (value: string) => {
    saveLanguage(value);
    toast({ title: "Language Changed", description: `Language set to ${value}.` });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    // TODO: Implement manual sync logic (trigger Firestore sync or re-fetch data)
    console.log('Manual sync triggered...');
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate sync delay
    setIsSyncing(false);
    toast({ title: "Sync Complete", description: "Data synchronized successfully." });
  };

   if (settingsLoading) {
     // TODO: Add Skeleton loaders for settings page
     return <div className="flex justify-center items-center h-64"><RefreshCw className="animate-spin h-8 w-8 text-primary" /></div>;
   }

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card className="panel-primary"> {/* Use primary panel style */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><SettingsIcon className="w-5 h-5 text-primary" /> General Settings</CardTitle>
          <CardDescription>Manage application preferences and modules.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Module Toggles */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Enabled Modules</h3>
             <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* MedTrack */}
                <div className="flex items-center justify-between space-x-2 p-3 rounded-md border bg-background">
                    <Label htmlFor="medTrack-module" className="flex items-center gap-2 font-normal cursor-pointer">
                        <Boxes className="w-4 h-4 text-primary"/> MedTrack Inventory
                    </Label>
                    <Switch
                        id="medTrack-module"
                        checked={modules.medTrack}
                        onCheckedChange={() => handleModuleToggle('medTrack')}
                    />
                </div>
                 {/* Shipment Tracker */}
                 <div className="flex items-center justify-between space-x-2 p-3 rounded-md border bg-background">
                    <Label htmlFor="shipment-module" className="flex items-center gap-2 font-normal cursor-pointer">
                        <Truck className="w-4 h-4 text-info"/> Shipment Tracker
                    </Label>
                    <Switch
                        id="shipment-module"
                        checked={modules.shipment}
                        onCheckedChange={() => handleModuleToggle('shipment')}
                    />
                </div>
                {/* RxAI */}
                 <div className="flex items-center justify-between space-x-2 p-3 rounded-md border bg-background">
                    <Label htmlFor="rxAI-module" className="flex items-center gap-2 font-normal cursor-pointer">
                         <BrainCircuit className="w-4 h-4 text-secondary"/> RxAI Support
                    </Label>
                    <Switch
                        id="rxAI-module"
                        checked={modules.rxAI}
                        onCheckedChange={() => handleModuleToggle('rxAI')}
                    />
                </div>
                 {/* PharmaNet */}
                 <div className="flex items-center justify-between space-x-2 p-3 rounded-md border bg-background">
                    <Label htmlFor="pharmaNet-module" className="flex items-center gap-2 font-normal cursor-pointer">
                        <FlaskConical className="w-4 h-4 text-warning"/> PharmaNet & Alerts
                    </Label>
                    <Switch
                        id="pharmaNet-module"
                        checked={modules.pharmaNet}
                        onCheckedChange={() => handleModuleToggle('pharmaNet')}
                    />
                </div>
                {/* Patient History */}
                 <div className="flex items-center justify-between space-x-2 p-3 rounded-md border bg-background">
                    <Label htmlFor="patientHistory-module" className="flex items-center gap-2 font-normal cursor-pointer">
                        <ClipboardList className="w-4 h-4 text-danger"/> Patient History
                    </Label>
                    <Switch
                        id="patientHistory-module"
                        checked={modules.patientHistory}
                        onCheckedChange={() => handleModuleToggle('patientHistory')}
                    />
                </div>
            </div>
          </div>

          <Separator />

          {/* Appearance Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Appearance</h3>
             <Separator />
            <div className="flex items-center justify-between space-x-2 p-3 rounded-md border bg-background">
              <Label htmlFor="theme-toggle" className="flex items-center gap-2 font-normal cursor-pointer">
                 <Palette className="w-4 h-4 text-primary"/> Theme
              </Label>
              <ThemeToggle /> {/* Use the ThemeToggle component */}
            </div>

            {/* TODO: Add Primary/Accent Color Picker */}
            {/* <div className="flex items-center justify-between space-x-2 p-3 rounded-md border bg-background">
               <Label className="flex items-center gap-2 font-normal">Accent Color</Label>
               <Input type="color" defaultValue="#FFA500" className="w-20 h-8 p-0 border-none cursor-pointer rounded" />
             </div> */}

             {/* TODO: Add Font Size Slider */}
              {/* <div className="flex items-center justify-between space-x-2 p-3 rounded-md border bg-background">
               <Label className="flex items-center gap-2 font-normal">Font Size</Label>
                <Slider defaultValue={[16]} max={24} min={12} step={1} className="w-[180px]" />
             </div> */}


            <div className="flex items-center justify-between space-x-2 p-3 rounded-md border bg-background">
              <Label htmlFor="language-select" className="flex items-center gap-2 font-normal">
                 <Languages className="w-4 h-4 text-info"/> Language
              </Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger id="language-select" className="w-[180px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                 {/* Use tertiary overlay for select content */}
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
             {/* Add Clear Cache / Offline Data option if needed */}
          </div>

        </CardContent>
      </Card>
       {/* Add Account Settings Card (Password Change, Delete Account) if needed */}
    </div>
  );
}
