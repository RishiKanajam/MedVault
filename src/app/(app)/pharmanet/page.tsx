// src/app/pharmanet/page.tsx
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DrugSearch } from '@/components/pharmanet/DrugSearch';
import { DrugDetail } from '@/components/pharmanet/DrugDetail';
import { RDAlerts } from '@/components/pharmanet/RDAlerts';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface Drug {
  name: string;
  rxcui: string;
  description: string;
}

export default function PharmaNetPage() {
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrugSelect = (drug: Drug) => {
    setError(null);
    setSelectedDrug(drug);
  };

  const handleError = (message: string) => {
    setError(message);
    setSelectedDrug(null);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">PharmaNet</h1>
        <p className="text-muted-foreground">
          Comprehensive drug reference and clinical trial alerts
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Drug Search</TabsTrigger>
          <TabsTrigger value="alerts">R&D Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <ErrorBoundary>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : selectedDrug ? (
              <DrugDetail
                drug={{
                  ...selectedDrug,
                  dosageForms: ['Tablet', 'Capsule', 'Injection'],
                  strengths: ['10mg', '20mg', '50mg'],
                  interactions: [
                    {
                      drug: 'Warfarin',
                      severity: 'severe',
                      description: 'Increased risk of bleeding',
                    },
                    {
                      drug: 'Aspirin',
                      severity: 'moderate',
                      description: 'May increase bleeding risk',
                    },
                  ],
                }}
                onClose={() => setSelectedDrug(null)}
              />
            ) : (
              <DrugSearch onSelect={handleDrugSelect} />
            )}
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="alerts">
          <ErrorBoundary>
            <RDAlerts />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}