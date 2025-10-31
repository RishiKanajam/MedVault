// src/app/settings/page.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, User, Building2, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { PageShell, PageHeader, PageSection } from '@/components/layout/page';

// Types for Settings module
interface ClinicProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  license: string;
}

interface UserPreferences {
  notifications: boolean;
  darkMode: boolean;
  language: string;
  timezone: string;
}

interface ModuleSettings {
  dashboard: boolean;
  inventory: boolean;
  shipments: boolean;
  rxai: boolean;
  pharmanet: boolean;
  patientHistory: boolean;
}

export default function SettingsPage() {
  const { profile, authLoading } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Replace with Firestore data
  const [clinicProfile, setClinicProfile] = useState<ClinicProfile>({
    name: profile?.clinicName || '',
    address: '',
    phone: '',
    email: profile?.email || '',
    license: '',
  });

  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    notifications: true,
    darkMode: false,
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const [moduleSettings, setModuleSettings] = useState<ModuleSettings>({
    dashboard: true,
    inventory: true,
    shipments: true,
    rxai: true,
    pharmanet: true,
    patientHistory: true,
  });

  const handleClinicProfileChange = (field: keyof ClinicProfile, value: string) => {
    setClinicProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleUserPreferenceChange = (field: keyof UserPreferences, value: boolean | string) => {
    setUserPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleModuleSettingChange = (module: keyof ModuleSettings, enabled: boolean) => {
    setModuleSettings(prev => ({ ...prev, [module]: enabled }));
  };

  const handleSaveSettings = async () => {
    if (!profile?.clinicId) {
      setError('No clinic ID available. Please ensure you are logged in.');
      toast({ title: "Error", description: "No clinic ID available.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // TODO: Save settings to Firestore
      // await updateDoc(doc(db, 'clinics', profile.clinicId), {
      //   profile: clinicProfile,
      //   preferences: userPreferences,
      //   modules: moduleSettings,
      // });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({ title: "Settings Saved", description: "Your settings have been updated successfully." });
    } catch (error) {
      console.error("Error saving settings:", error);
      setError('Failed to save settings. Please try again.');
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-[70vh] w-full bg-muted" />
      </div>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Settings"
        title="Clinic Configuration"
        description="Keep your clinic profile, user preferences, and module access aligned without leaving the workspace."
        actions={
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Clinic Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Preferences
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Modules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinic Information</CardTitle>
              <CardDescription>Update your clinic's profile information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clinic-name">Clinic Name</Label>
                  <Input
                    id="clinic-name"
                    value={clinicProfile.name}
                    onChange={(e) => handleClinicProfileChange('name', e.target.value)}
                    placeholder="Enter clinic name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-license">License Number</Label>
                  <Input
                    id="clinic-license"
                    value={clinicProfile.license}
                    onChange={(e) => handleClinicProfileChange('license', e.target.value)}
                    placeholder="Enter license number"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic-address">Address</Label>
                <Input
                  id="clinic-address"
                  value={clinicProfile.address}
                  onChange={(e) => handleClinicProfileChange('address', e.target.value)}
                  placeholder="Enter clinic address"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clinic-phone">Phone</Label>
                  <Input
                    id="clinic-phone"
                    value={clinicProfile.phone}
                    onChange={(e) => handleClinicProfileChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic-email">Email</Label>
                  <Input
                    id="clinic-email"
                    type="email"
                    value={clinicProfile.email}
                    onChange={(e) => handleClinicProfileChange('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Preferences</CardTitle>
              <CardDescription>Customize your experience with MediSync Pro.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive alerts and updates.</p>
                </div>
                <Switch
                  checked={userPreferences.notifications}
                  onCheckedChange={(checked) => handleUserPreferenceChange('notifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Use dark theme.</p>
                </div>
                <Switch
                  checked={userPreferences.darkMode}
                  onCheckedChange={(checked) => handleUserPreferenceChange('darkMode', checked)}
                />
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    value={userPreferences.language}
                    onChange={(e) => handleUserPreferenceChange('language', e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={userPreferences.timezone}
                    onChange={(e) => handleUserPreferenceChange('timezone', e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Module Settings</CardTitle>
              <CardDescription>Enable or disable specific modules.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dashboard</Label>
                  <p className="text-sm text-muted-foreground">Overview and analytics.</p>
                </div>
                <Switch
                  checked={moduleSettings.dashboard}
                  onCheckedChange={(checked) => handleModuleSettingChange('dashboard', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Inventory</Label>
                  <p className="text-sm text-muted-foreground">Medicine stock management.</p>
                </div>
                <Switch
                  checked={moduleSettings.inventory}
                  onCheckedChange={(checked) => handleModuleSettingChange('inventory', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Shipments</Label>
                  <p className="text-sm text-muted-foreground">Track medicine deliveries.</p>
                </div>
                <Switch
                  checked={moduleSettings.shipments}
                  onCheckedChange={(checked) => handleModuleSettingChange('shipments', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>RxAI Support</Label>
                  <p className="text-sm text-muted-foreground">AI-powered prescription support.</p>
                </div>
                <Switch
                  checked={moduleSettings.rxai}
                  onCheckedChange={(checked) => handleModuleSettingChange('rxai', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>PharmaNet</Label>
                  <p className="text-sm text-muted-foreground">Drug information database.</p>
                </div>
                <Switch
                  checked={moduleSettings.pharmanet}
                  onCheckedChange={(checked) => handleModuleSettingChange('pharmanet', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Patient History</Label>
                  <p className="text-sm text-muted-foreground">Medical records management.</p>
                </div>
                <Switch
                  checked={moduleSettings.patientHistory}
                  onCheckedChange={(checked) => handleModuleSettingChange('patientHistory', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
