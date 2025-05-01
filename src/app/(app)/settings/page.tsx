// src/app/(app)/settings/page.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Sun, Moon, Languages, RefreshCw, Boxes, Truck, BrainCircuit, FlaskConical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// TODO: Fetch initial settings from Firestore/local state
// TODO: Implement logic to save settings changes to Firestore and update local state/context

export default function SettingsPage() {
  const { toast } = useToast();
  // Placeholder state - replace with actual state management (e.g., context or Zustand)
  const [modules, setModules] = useState({
    medTrack: true,
    shipment: true,
    rxAI: true,
    pharmaNet: true,
    // rndAlerts: true, // Included in pharmaNet for this example
  });
  const [darkMode, setDarkMode] = useState(false); // Manage theme state
  const [language, setLanguage] = useState('en');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleModuleToggle = (moduleName: keyof typeof modules) => {
    setModules((prev) => ({ ...prev, [moduleName]: !prev[moduleName] }));
    // TODO: Save to Firestore: users/{uid}/settings/modules
    toast({ title: "Module Updated", description: `${moduleName} setting saved.` });
  };

  const handleThemeChange = (checked: boolean) => {
    setDarkMode(checked);
    // TODO: Implement theme switching logic (e.g., adding/removing 'dark' class to html element)
     document.documentElement.classList.toggle('dark', checked);
    toast({ title: "Theme Changed", description: `Switched to ${checked ? 'Dark' : 'Light'} Mode.` });
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    // TODO: Implement language switching logic (e.g., using i18next)
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><SettingsIcon className="w-5 h-5" /> General Settings</CardTitle>
          <CardDescription>Manage application preferences and modules.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Module Toggles */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Enabled Modules</h3>
             <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="flex items-center justify-between space-x-2 p-2 rounded-md border">
                    <Label htmlFor="medTrack-module" className="flex items-center gap-2 font-normal">
                        <Boxes className="w-4 h-4"/> MedTrack Inventory
                    </Label>
                    <Switch
                        id="medTrack-module"
                        checked={modules.medTrack}
                        onCheckedChange={() => handleModuleToggle('medTrack')}
                    />
                </div>
                 <div className="flex items-center justify-between space-x-2 p-2 rounded-md border">
                    <Label htmlFor="shipment-module" className="flex items-center gap-2 font-normal">
                        <Truck className="w-4 h-4"/> Shipment Tracker
                    </Label>
                    <Switch
                        id="shipment-module"
                        checked={modules.shipment}
                        onCheckedChange={() => handleModuleToggle('shipment')}
                    />
                </div>
                 <div className="flex items-center justify-between space-x-2 p-2 rounded-md border">
                    <Label htmlFor="rxAI-module" className="flex items-center gap-2 font-normal">
                         <BrainCircuit className="w-4 h-4"/> RxAI Support
                    </Label>
                    <Switch
                        id="rxAI-module"
                        checked={modules.rxAI}
                        onCheckedChange={() => handleModuleToggle('rxAI')}
                    />
                </div>
                 <div className="flex items-center justify-between space-x-2 p-2 rounded-md border">
                    <Label htmlFor="pharmaNet-module" className="flex items-center gap-2 font-normal">
                        <FlaskConical className="w-4 h-4"/> PharmaNet & Alerts
                    </Label>
                    <Switch
                        id="pharmaNet-module"
                        checked={modules.pharmaNet}
                        onCheckedChange={() => handleModuleToggle('pharmaNet')}
                    />
                </div>
            </div>
          </div>

          <Separator />

          {/* Appearance Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Appearance</h3>
             <Separator />
            <div className="flex items-center justify-between space-x-2 p-2 rounded-md border">
              <Label htmlFor="dark-mode" className="flex items-center gap-2 font-normal">
                 {darkMode ? <Moon className="w-4 h-4"/> : <Sun className="w-4 h-4"/>} Dark Mode
              </Label>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={handleThemeChange}
              />
            </div>

            <div className="flex items-center justify-between space-x-2 p-2 rounded-md border">
              <Label htmlFor="language-select" className="flex items-center gap-2 font-normal">
                 <Languages className="w-4 h-4"/> Language
              </Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger id="language-select" className="w-[180px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
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
             <div className="flex items-center justify-between space-x-2 p-2 rounded-md border">
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
