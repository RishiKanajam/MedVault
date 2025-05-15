// src/app/rxai/page.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Mic, BrainCircuit, AlertCircle, Loader2, ClipboardCopy, BadgeHelp, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { generatePrescription, type GeneratePrescriptionOutput, type GeneratePrescriptionInput } from '@/ai/flows/generate-prescription';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/providers/AuthProvider'; // Import useAuth
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { SymptomInputForm } from '@/components/rxai/SymptomInputForm';
import { RxAIResult } from '@/components/rxai/RxAIResult';
import { SuggestionCard } from '@/components/rxai/SuggestionCard';
import { auth, db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// TODO: Implement Hugging Face API call
async function classifyRashImage(imageDataUri: string): Promise<string> {
    console.log("Simulating rash classification for image...");
    await new Promise(resolve => setTimeout(resolve, 800));
    return "Simulated Classification: Eczema";
}

// TODO: Function to save prescription to Firestore
const savePrescriptionToFirestore = async (clinicId: string | undefined, prescription: GeneratePrescriptionOutput, patientInfo: Omit<GeneratePrescriptionInput, 'photoDataUri'>) => {
    if (!clinicId) {
        console.error("Cannot save prescription, clinic ID is missing.");
        return;
    }

    try {
        // Get the current user's ID token
        const user = auth.currentUser;
        if (!user) {
            throw new Error("No authenticated user found");
        }

        // Get a fresh ID token
        const idToken = await user.getIdToken(true);

        // Refresh the session with the new token
        const response = await fetch('/api/auth/verify-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
            throw new Error('Failed to refresh session');
        }

        // Now save to Firestore
        const prescriptionData = {
            ...prescription,
            patientName: patientInfo.name,
            patientAge: patientInfo.age,
            patientWeight: patientInfo.weight,
            patientVitals: patientInfo.vitals,
            patientSymptoms: patientInfo.symptoms,
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, `clinics/${clinicId}/history`), prescriptionData);
        console.log('Successfully saved prescription to Firestore');
    } catch (error) {
        console.error('Error saving prescription:', error);
        throw error;
    }
};

export default function RxAIPage() {
  const { profile } = useAuth(); // Get profile for clinicId
  const clinicId = profile?.clinicId;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [rashClassification, setRashClassification] = useState<string | null>(null);

  const handlePhotoUpload = async (file: File) => {
    try {
      // Upload photo to storage and get URL
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/rxai/classify-rash', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to classify rash: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data.classification) {
        throw new Error('Invalid response format from classification API');
      }

      setRashClassification(data.classification);
      
      // TODO: Implement actual photo upload to storage
      // For now, we'll just use a placeholder URL
      setPhotoUrl(URL.createObjectURL(file));
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error; // Re-throw to be handled by the caller
    }
  };

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    setError(null);

    try {
      if (formData.photo) {
        try {
          await handlePhotoUpload(formData.photo);
        } catch (error) {
          console.error('Error uploading photo:', error);
          toast({
            title: 'Photo Upload Error',
            description: 'Failed to process the photo. Continuing without photo analysis.',
            variant: 'destructive',
          });
        }
      }

      const response = await fetch('/api/rxai/suggest-medication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          photoUrl,
          rashClassification,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data.drugClass) {
        throw new Error('Invalid response format from server');
      }

      setResult(data);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error instanceof Error ? error.message : 'Failed to get AI suggestion. Please try again.');
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get AI suggestion. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // The save operation is already handled in the API route
      toast({
        title: 'Success',
        description: 'Case saved to history successfully.',
      });
    } catch (error) {
      console.error('Error saving to history:', error);
      toast({
        title: 'Error',
        description: 'Failed to save to history. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRerun = () => {
    setResult(null);
    setError(null);
  };

  const handleNew = () => {
    setResult(null);
    setError(null);
    setPhotoUrl(null);
    setRashClassification(null);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">RxAI Clinical Support</h1>
        <p className="text-muted-foreground">
          Enter patient information and symptoms to get AI-powered medication suggestions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {!result ? (
          <SymptomInputForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        ) : (
          <SuggestionCard
            suggestion={result}
            onSave={handleSave}
            onRerun={handleRerun}
            onNew={handleNew}
            isLoading={isLoading}
          />
        )}
        
        {/* Recent Activity Card */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {/* TODO: Add recent activity list */}
              <p className="text-muted-foreground">No recent activity</p>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}