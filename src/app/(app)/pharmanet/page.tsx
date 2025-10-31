// src/app/pharmanet/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DrugSearch } from '@/components/pharmanet/DrugSearch';
import { DrugDetail } from '@/components/pharmanet/DrugDetail';
import { RDAlerts } from '@/components/pharmanet/RDAlerts';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { PageShell, PageHeader, PageSection } from '@/components/layout/page';

interface Drug {
  name: string;
  rxcui: string;
  description: string;
}

export default function PharmaNetPage() {
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isLoading = false;

  const handleDrugSelect = (drug: Drug) => {
    setError(null);
    setSelectedDrug(drug);
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="PharmaNet"
        title="Clinical Reference Hub"
        description="Surface evidence-backed drug information and monitor late-breaking research without leaving your workspace."
      />

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PageSection
        title="Explore by task"
        description="Switch between drug lookup and pipelines for new therapies."
        contentClassName="p-0"
      >
        <Tabs defaultValue="search" className="space-y-6 px-6 pb-6">
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/60 p-1">
            <TabsTrigger value="search" className="rounded-lg data-[state=active]:bg-background">
              Drug search
            </TabsTrigger>
            <TabsTrigger value="alerts" className="rounded-lg data-[state=active]:bg-background">
              R&amp;D alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <ErrorBoundary>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-32 w-full rounded-2xl" />
                  <Skeleton className="h-32 w-full rounded-2xl" />
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
      </PageSection>
    </PageShell>
  );
}
