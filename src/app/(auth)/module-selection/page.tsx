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
import { doc, updateDoc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { useAuthGuard } from '@/hooks/useAuthGuard'; // Import the auth guard hook

export default function ModuleSelectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  // Ensure user is logged in using the guard, but don't check modules yet
  const { user, loading: authLoading } = useAuthGuard({ requiredAuth: true, checkModules: false });

  const [selectedModules, setSelectedModules] = useState({
    medTrack: true,
    shipment: true,
    rxAI: true,
    pharmaNet: true,
    patientHistory: true,
  });
  const [isLoading, setIsLoading] = useState(false);

   // Redirect if modules are already set (e.g., user navigates back or finishes setup elsewhere)
   useEffect(() => {
     const checkExistingModules = async () => {
       if (user) {
         setIsLoading(true); // Indicate we are checking existing config
         console.log("[ModuleSelection] Checking existing module config for user:", user.uid);
         try {
             const userDocRef = doc(db, 'users', user.uid);
             const userDocSnap = await getDoc(userDocRef);
             if (userDocSnap.exists() && userDocSnap.data()?.settings?.modules) {
               console.log("[ModuleSelection] Modules already configured, redirecting to dashboard.");
               router.replace('/dashboard');
               // Keep loading true until redirection happens
               return;
             } else {
               console.log("[ModuleSelection] No existing module config found.");
             }
         } catch (error) {
             console.error("[ModuleSelection] Error checking existing modules:", error);
             // Handle error appropriately, maybe show a toast or allow proceeding
         } finally {
             setIsLoading(false); // Finish checking
         }
       }
     };
     if (!authLoading && user) {
       checkExistingModules();
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [user, authLoading]); // Add router to dependencies if used inside effect


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

    setIsLoading(true);
    console.log('[ModuleSelection] Saving selected modules for user:', user.uid, selectedModules);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      // IMPORTANT: Security rules must allow the authenticated user to write to their own document path `/users/{userId}`
      await updateDoc(userDocRef, {
        'settings.modules': selectedModules // Update only the modules part of settings
      });
      console.log('[ModuleSelection] Modules saved successfully.');
      toast({ title: "Modules Saved", description: "Your module preferences have been saved." });
      router.push('/dashboard'); // Redirect to dashboard after selection
    } catch (error: any) {
      console.error("[ModuleSelection] Error saving module settings:", error);
      let message = "Could not save module preferences.";
      if (error.code === 'permission-denied') {
          message = "Permission denied. Unable to save module settings.";
      } else if (error.message) {
          message = error.message;
      }
      toast({ title: "Save Error", description: message, variant: "destructive" });
      setIsLoading(false); // Ensure loading stops on error
    }
    // No finally here, isLoading should remain true during redirect
  };

  const modulesConfig = [
    { id: 'medTrack', label: 'MedTrack Inventory', icon: Boxes, description: 'Manage medicine stock, batches, and expiry.' },
    { id: 'shipment', label: 'Shipment Tracker', icon: Truck, description: 'Track deliveries and monitor cold chain status.' },
    { id: 'rxAI', label: 'RxAI Clinical Support', icon: BrainCircuit, description: 'AI-powered prescription assistance.' },
    { id: 'pharmaNet', label: 'PharmaNet & Alerts', icon: FlaskConical, description: 'Access drug databases and R&D updates.' },
    { id: 'patientHistory', label: 'Patient History', icon: ClipboardList, description: 'Manage patient records and documents.' },
  ] as const;


   if (authLoading || isLoading) { // Show loader if checking auth OR checking/saving modules
     return (
       <div className="flex min-h-screen items-center justify-center bg-background p-4">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">
             {authLoading ? "Verifying authentication..." : "Checking configuration..."}
          </span>
       </div>
     );
   }

    // If auth check complete, user exists, and not currently saving/checking config
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
                 checked={selectedModules[module.id]}
                 onCheckedChange={() => handleCheckboxChange(module.id)}
                 className="mt-1"
                 disabled={isLoading} // Disable while saving
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
          <Button onClick={handleContinue} className="w-full" disabled={isLoading}>
             {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckSquare className="mr-2 h-4 w-4" />}
             {isLoading ? 'Saving...' : 'Save & Continue'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
