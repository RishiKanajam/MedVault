// src/app/rxai/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SymptomInputForm } from '@/components/rxai/SymptomInputForm';
import { SuggestionCard } from '@/components/rxai/SuggestionCard';
import { Calendar, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageShell, PageHeader, PageSection } from '@/components/layout/page';

interface RecentActivity {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  type: string;
  summary: string;
  createdAt: string;
}

export default function RxAIPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [rashClassification, setRashClassification] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

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

      const classificationText: string = typeof data.classification === 'string'
        ? data.classification
        : JSON.stringify(data.classification);

      setRashClassification(classificationText);
      
      // TODO: Implement actual photo upload to storage
      // For now, we'll just use a placeholder URL
      const objectUrl = URL.createObjectURL(file);
      setPhotoUrl(objectUrl);
      return { photoUrl: objectUrl, classification: classificationText };
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error; // Re-throw to be handled by the caller
    }
  };

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);

    try {
      let uploadedPhotoUrl = photoUrl;
      let classificationResult = rashClassification;

      const { photo, ...symptomData } = formData;

      if (photo) {
        try {
          const result = await handlePhotoUpload(photo);
          if (result) {
            uploadedPhotoUrl = result.photoUrl;
            classificationResult = result.classification;
          }
        } catch (error) {
          console.error('Error uploading photo:', error);
          toast({
            title: 'Photo Upload Error',
            description: 'Failed to process the photo. Continuing without photo analysis.',
            variant: 'destructive',
          });
        }
      }

      const numericAge = Number(symptomData.age);
      const numericWeight = symptomData.weight ? Number(symptomData.weight) : undefined;
      let numericTemperature = symptomData.temperature ? Number(symptomData.temperature) : undefined;

      // Convert temperature from Fahrenheit to Celsius if needed
      // Normal body temperature: 97-99°F (36.1-37.2°C) or 98.6°F (37°C)
      // If temperature is > 45, assume it's Fahrenheit and convert
      // If temperature is < 30, assume it's invalid and set to undefined
      if (numericTemperature !== undefined) {
        if (numericTemperature > 45) {
          // Likely Fahrenheit - convert to Celsius
          numericTemperature = ((numericTemperature - 32) * 5) / 9;
        } else if (numericTemperature < 30) {
          // Too low to be valid Celsius - likely invalid input or missing data
          // Set to undefined to make it optional
          numericTemperature = undefined;
        }
        // If between 30-45, assume it's already Celsius
      }

      const requestPayload = {
        ...symptomData,
        age: numericAge,
        weight: numericWeight,
        temperature: numericTemperature,
        photoUrl: uploadedPhotoUrl ?? undefined,
        rashClassification: classificationResult ?? undefined,
      };

      const response = await fetch('/api/rxai/suggest-medication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Include validation details if available
        const errorMessage = errorData.error || `Server error: ${response.status}`;
        const details = errorData.details 
          ? (Array.isArray(errorData.details) 
              ? errorData.details.map((d: any) => `${d.field}: ${d.message}`).join(', ')
              : errorData.details)
          : '';
        throw new Error(details ? `${errorMessage} - ${details}` : errorMessage);
      }

      const resultPayload = await response.json();
      
      if (!resultPayload || resultPayload.success === false || !resultPayload.data) {
        throw new Error(resultPayload?.error || 'Invalid response format from server');
      }

      setResult(resultPayload.data);
      // Store form data for saving later
      setFormData({
        name: symptomData.name,
        age: numericAge,
        weight: numericWeight,
        bloodPressure: symptomData.bloodPressure,
        temperature: numericTemperature,
        symptoms: symptomData.symptoms,
        photoUrl: uploadedPhotoUrl,
        rashClassification: classificationResult,
      });
    } catch (error) {
      console.error('Error in handleSubmit:', error);
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
    if (!result || !formData) {
      toast({
        title: 'Error',
        description: 'No data to save. Please submit the form first.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/records/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          patientName: formData.name,
          patientAge: formData.age,
          patientEmail: undefined,
          patientPhone: undefined,
          dateOfBirth: undefined,
          drugClass: result.drugClass || 'Not specified',
          dosage: result.dosage || result.recommendedMedications?.[0]?.dosage || undefined,
          duration: result.duration || result.recommendedMedications?.[0]?.duration || undefined,
          confidence: result.confidence || 0,
          symptoms: formData.symptoms,
          citations: result.citations || [],
          photoUrl: formData.photoUrl || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save record: ${response.status}`);
      }

      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to save record');
      }

      toast({
        title: 'Success',
        description: 'Record saved to Patient History successfully.',
      });
      
      // Refresh recent activity
      fetchRecentActivity();
    } catch (error) {
      console.error('Error saving to history:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save to history. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const fetchRecentActivity = async () => {
    setIsLoadingActivity(true);
    try {
      const response = await fetch('/api/records/recent', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.records) {
          setRecentActivity(data.data.records);
        }
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const handleRerun = () => {
    setResult(null);
  };

  const handleNew = () => {
    setResult(null);
    setPhotoUrl(null);
    setRashClassification(null);
  };

  const header = (
    <PageHeader
      eyebrow="RxAI"
      title="Clinical Support Assistant"
      description="Feed patient context and symptoms to generate AI-backed treatment options that stay clinically grounded."
    />
  );

  return (
    <PageShell>
      {header}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {!result ? (
            <SymptomInputForm onSubmit={handleSubmit} isLoading={isLoading} />
          ) : (
            <SuggestionCard
              suggestion={result}
              onSave={handleSave}
              onRerun={handleRerun}
              onNew={handleNew}
              isLoading={isLoading || isSaving}
            />
          )}
        </div>

        <PageSection
          title="Recent activity"
          description="Latest RxAI recommendations synced to patient history."
          contentClassName="p-0"
        >
          <ScrollArea className="h-[480px]">
            <div className="space-y-4 px-6 py-4">
              {isLoadingActivity ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2 rounded-xl border border-border/40 bg-muted/30 p-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))
              ) : recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/95 p-3"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                      {activity.type === 'prescription' ? (
                        <FileText className="h-4 w-4" />
                      ) : (
                        <Calendar className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {activity.patientName}
                        </p>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{activity.summary}</p>
                      <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-primary">
                        {activity.type}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 bg-background/80 p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No recent RxAI sessions yet. Run an assessment to see it appear here.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </PageSection>
      </div>
    </PageShell>
  );
}
