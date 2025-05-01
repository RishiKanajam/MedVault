'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Boxes, Truck, BrainCircuit, FlaskConical, CheckSquare } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
import { useToast } from '@/hooks/use-toast';

// TODO: Integrate with Firebase to save selections under users/{uid}/settings/modules

export default function ModuleSelectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedModules, setSelectedModules] = useState({
    medTrack: true,
    shipment: true,
    rxAI: true,
    pharmaNet: true,
  });

  const handleCheckboxChange = (moduleId: keyof typeof selectedModules) => {
    setSelectedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleContinue = async () => {
    console.log('Saving selected modules:', selectedModules);
    // TODO: Implement Firestore save logic: users/{uid}/settings/modules = selectedModules
    try {
      // Simulate saving to Firestore
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({ title: "Modules Saved", description: "Your module preferences have been saved." });
      router.push('/dashboard'); // Redirect to dashboard after selection
    } catch (error) {
      console.error("Error saving module settings:", error);
      toast({ title: "Save Error", description: "Could not save module preferences.", variant: "destructive" });
    }
  };

  const modulesConfig = [
    { id: 'medTrack', label: 'MedTrack Inventory', icon: Boxes, description: 'Manage medicine stock, batches, and expiry.' },
    { id: 'shipment', label: 'Shipment Tracker', icon: Truck, description: 'Track deliveries and monitor cold chain status.' },
    { id: 'rxAI', label: 'RxAI Clinical Support', icon: BrainCircuit, description: 'AI-powered prescription assistance.' },
    { id: 'pharmaNet', label: 'PharmaNet & Alerts', icon: FlaskConical, description: 'Access drug databases and R&D updates.' },
  ] as const; // Use 'as const' for stricter typing of id


  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md shadow-lg">
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
          <Button onClick={handleContinue} className="w-full">
             <CheckSquare className="mr-2 h-4 w-4" /> Continue to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
