'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Boxes, Truck, BrainCircuit, FlaskConical, ClipboardList, CheckSquare, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/firebase'; // Import Firebase auth and db
import { doc, setDoc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'; // Import Firestore functions
import { useAuthGuard } from '@/hooks/useAuthGuard'; // Import the auth guard hook

export default function ModuleSelectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  // Ensure user is logged in using the guard, but don't check modules initially here.
  const { user, loading: authLoading } = useAuthGuard({ requiredAuth: true, checkModules: false });

  const [selectedModules, setSelectedModules] = useState({
    medTrack: true,
    shipment: true,
    rxAI: true,
    pharmaNet: true,
    patientHistory: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingConfig, setIsCheckingConfig] = useState(true); // State for checking existing config

   // Effect to check if modules are already configured and redirect if necessary
   useEffect(() => {
     let unsubscribe: (() => void) | null = null;

     if (user) {
       setIsCheckingConfig(true);
       console.log("[ModuleSelection] Setting up listener to check existing module config for user:", user.uid);
       const userDocRef = doc(db, 'users', user.uid);

       unsubscribe = onSnapshot(userDocRef, (docSnap) => {
         if (docSnap.exists()) {
           const modules = docSnap.data()?.settings?.modules;
           // Redirect if modules exist and the object is not empty
           if (modules && Object.keys(modules).length > 0) {
             console.log("[ModuleSelection] Modules already configured, redirecting to dashboard.");
              // Ensure we are not already on dashboard before redirecting
              if (window.location.pathname !== '/dashboard') {
                 router.replace('/dashboard');
              }
             // Keep checking config true until redirect finishes
             return; // Exit snapshot handler early
           } else {
             console.log("[ModuleSelection] No existing module config found or modules object is empty.");
           }
         } else {
           console.warn("[ModuleSelection] User document doesn't exist yet, cannot check modules.");
           // This might happen briefly after signup before the doc is created. Wait for next snapshot.
         }
         // Only set checking to false if NOT redirecting
         setIsCheckingConfig(false);
       }, (error) => {
         console.error("[ModuleSelection] Error listening to user document:", error);
         toast({ title: "Error", description: "Could not verify module configuration.", variant: "destructive" });
         setIsCheckingConfig(false); // Stop checking on error
       });

     } else if (!authLoading) {
        // If auth loading is finished and there's no user, stop checking
       setIsCheckingConfig(false);
     }

     // Cleanup listener on component unmount or when user changes
     return () => {
       if (unsubscribe) {
         console.log("[ModuleSelection] Cleaning up Firestore listener.");
         unsubscribe();
       }
     };
   }, [user, authLoading, router, toast]); // Add toast to dependencies


  const handleCheckboxChange = (moduleId: keyof typeof selectedModules) => {
    setSelectedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleContinue = async () => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to save modules.", variant: "destructive" });
      router.push('/login'); // Redirect to login if user context is lost
      return;
    }

    setIsSaving(true);
    console.log('[ModuleSelection] Saving selected modules for user:', user.uid, selectedModules);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      // Use updateDoc to merge the modules into the settings field.
      // This assumes the `settings` field already exists from signup.
      await updateDoc(userDocRef, {
        'settings.modules': selectedModules // Set the modules object within settings
      });

      console.log('[ModuleSelection] Modules saved successfully.');
      toast({ title: "Modules Saved", description: "Your module preferences have been saved." });
      // No explicit redirect needed here - the useEffect listener will detect the change and redirect.

    } catch (error: any) {
      console.error("[ModuleSelection] Error saving module settings:", error);
      let message = "Could not save module preferences.";
      if (error.code === 'permission-denied') {
          message = "Permission denied. Unable to save module settings.";
      } else if (error.message) {
          message = error.message;
      }
      toast({ title: "Save Error", description: message, variant: "destructive" });
    } finally {
       // Set saving false AFTER attempt, regardless of redirect triggering
      setIsSaving(false);
    }
  };

  const modulesConfig = [
    { id: 'medTrack', label: 'MedTrack Inventory', icon: Boxes, description: 'Manage medicine stock, batches, and expiry.' },
    { id: 'shipment', label: 'Shipment Tracker', icon: Truck, description: 'Track deliveries and monitor cold chain status.' },
    { id: 'rxAI', label: 'RxAI Clinical Support', icon: BrainCircuit, description: 'AI-powered prescription assistance.' },
    { id: 'pharmaNet', label: 'PharmaNet & Alerts', icon: FlaskConical, description: 'Access drug databases and R&D updates.' },
    { id: 'patientHistory', label: 'Patient History', icon: ClipboardList, description: 'Manage patient records and documents.' },
  ] as const;


   if (authLoading || isCheckingConfig) { // Show loader if checking auth OR checking config
     return (
       <div className="flex min-h-screen items-center justify-center bg-background p-4">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">
             {authLoading ? "Verifying authentication..." : "Checking configuration..."}
          </span>
       </div>
     );
   }

    // If auth check complete, user exists, and config checked
   if (!user) {
      // This state should ideally be prevented by the redirect in useAuthGuard,
      // but handle defensively.
      return (
          <div className="flex min-h-screen items-center justify-center bg-background p-4 text-destructive">
              Error: User not authenticated. Redirecting...
          </div>
      );
   }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
       {/* Use panel-primary for consistent styling */}
      <Card className="panel-primary w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Select Your Modules</CardTitle>
          <CardDescription className="text-center">
            Choose the features you want to enable in MediSync Pro. You can change this later in Settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {modulesConfig.map((module) => (
             <div
              key={module.id}
               className="flex items-start space-x-3 p-4 border rounded-md hover:bg-muted/50 transition-colors"
            >
               <Checkbox
                 id={module.id}
                 checked={selectedModules[module.id as keyof typeof selectedModules]}
                 onCheckedChange={() => handleCheckboxChange(module.id as keyof typeof selectedModules)}
                 className="mt-1"
                 disabled={isSaving} // Disable while saving
               />
               <div className="grid gap-1.5 leading-none">
                <Label htmlFor={module.id} className="flex items-center gap-2 font-medium cursor-pointer">
                  <module.icon className="w-4 h-4" />
                  {module.label}
                 </Label>
                 <p className="text-sm text-muted-foreground">{module.description}</p>
               </div>
             </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button onClick={handleContinue} className="w-full" disabled={isSaving}>
             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckSquare className="mr-2 h-4 w-4" />}
             {isSaving ? 'Saving...' : 'Save & Continue'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
