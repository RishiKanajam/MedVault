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
  const { user, loading: authLoading } = useAuthGuard({ requiredAuth: true, checkModules: false }); // Ensure user is logged in, skip module check here

  const [selectedModules, setSelectedModules] = useState({
    medTrack: true,
    shipment: true,
    rxAI: true,
    pharmaNet: true,
    patientHistory: true,
  });
  const [isLoading, setIsLoading] = useState(false);

   // Redirect if modules are already set (e.g., user navigates back)
   useEffect(() => {
     const checkExistingModules = async () => {
       if (user) {
         const userDocRef = doc(db, 'users', user.uid);
         const userDocSnap = await getDoc(userDocRef);
         if (userDocSnap.exists() && userDocSnap.data()?.settings?.modules) {
           console.log("Modules already configured, redirecting to dashboard.");
           router.replace('/dashboard');
         }
       }
     };
     if (!authLoading && user) {
       checkExistingModules();
     }
   }, [user, authLoading, router]);


  const handleCheckboxChange = (moduleId: keyof typeof selectedModules) => {
    setSelectedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleContinue = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      router.push('/login'); // Redirect to login if user somehow got here without auth
      return;
    }

    setIsLoading(true);
    console.log('Saving selected modules for user:', user.uid, selectedModules);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        'settings.modules': selectedModules // Update only the modules part of settings
      });
      toast({ title: "Modules Saved", description: "Your module preferences have been saved." });
      router.push('/dashboard'); // Redirect to dashboard after selection
    } catch (error) {
      console.error("Error saving module settings:", error);
      toast({ title: "Save Error", description: "Could not save module preferences.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const modulesConfig = [
    { id: 'medTrack', label: 'MedTrack Inventory', icon: Boxes, description: 'Manage medicine stock, batches, and expiry.' },
    { id: 'shipment', label: 'Shipment Tracker', icon: Truck, description: 'Track deliveries and monitor cold chain status.' },
    { id: 'rxAI', label: 'RxAI Clinical Support', icon: BrainCircuit, description: 'AI-powered prescription assistance.' },
    { id: 'pharmaNet', label: 'PharmaNet & Alerts', icon: FlaskConical, description: 'Access drug databases and R&D updates.' },
    { id: 'patientHistory', label: 'Patient History', icon: ClipboardList, description: 'Manage patient records and documents.' },
  ] as const;


   if (authLoading) {
     return (
       <div className="flex min-h-screen items-center justify-center bg-background p-4">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                 disabled={isLoading}
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
