
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FlaskConical, Search, BookOpen, AlertTriangle, Loader2, ExternalLink, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { getClinicalTrials, type ClinicalTrial } from '@/services/clinical-trials'; // Assuming this exists
import { summarizeClinicalTrials } from '@/ai/flows/summarize-clinical-trials';
import { confirmDosageDetails, type ConfirmDosageDetailsOutput } from '@/ai/flows/confirm-dosage-details';
import { useAuth } from '@/providers/AuthProvider'; // Import useAuth
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

// Define interfaces for API responses (assuming they are defined elsewhere or here)
interface RxNormSearchResult {
  rxNormId: string;
  name: string;
}

interface RxNormProperties {
  description?: string;
  ingredients?: string[];
  [key: string]: any;
}

interface DrugDetails extends RxNormProperties {
    rxNormId: string;
    name: string;
    // Potential cache fields
    cachedAt?: any; // Firestore Timestamp
}

// API Fetching functions using Next.js API routes
const searchRxNormApi = async (query: string): Promise<RxNormSearchResult[]> => {
  const response = await fetch(`/api/rxnorm/search?name=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Failed to search RxNorm');
  const data = await response.json();
  return data.results;
};

const getRxNormPropertiesApi = async (rxcui: string): Promise<RxNormProperties> => {
  const response = await fetch(`/api/rxnorm/properties?rxcui=${encodeURIComponent(rxcui)}`);
  if (!response.ok) throw new Error(`Failed to fetch properties for RxCUI ${rxcui}`);
  const data = await response.json();
  return data.properties;
};

// TODO: Firestore cache functions
const getFromCache = async (clinicId: string | undefined, rxcui: string): Promise<DrugDetails | null> => {
    if (!clinicId) return null;
    console.log(`Checking cache for RxCUI ${rxcui} in clinic ${clinicId} (simulated)...`);
    // const docRef = doc(db, `clinics/${clinicId}/drugCache`, rxcui);
    // const docSnap = await getDoc(docRef);
    // return docSnap.exists() ? docSnap.data() as DrugDetails : null;
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate cache check
    return null; // Simulate cache miss
};

const saveToCache = async (clinicId: string | undefined, rxcui: string, data: DrugDetails) => {
    if (!clinicId) return;
    console.log(`Saving RxCUI ${rxcui} to cache in clinic ${clinicId} (simulated)...`);
    // const docRef = doc(db, `clinics/${clinicId}/drugCache`, rxcui);
    // await setDoc(docRef, { ...data, cachedAt: serverTimestamp() });
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate cache write
};


type SearchResult = RxNormSearchResult;
type DetailedInfo = DrugDetails | null;

export default function PharmaNetPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile, authLoading } = useAuth(); // Get profile and loading state
  const clinicId = profile?.clinicId;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDrug, setSelectedDrug] = useState<SearchResult | null>(null);
  const [showDosageConfirmation, setShowDosageConfirmation] = useState(false);
  const [dosageConfirmationResult, setDosageConfirmationResult] = useState<ConfirmDosageDetailsOutput | null>(null);
  const [showFullDetails, setShowFullDetails] = useState(false);

  // --- React Query for Search ---
  const { data: searchResults = [], isLoading: isLoadingSearch, error: searchError, refetch: refetchSearch } = useQuery<SearchResult[], Error>({
    queryKey: ['rxNormSearch', searchTerm],
    queryFn: () => searchRxNormApi(searchTerm),
    enabled: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: 1,
  });

   // --- React Query for Drug Details (includes caching logic) ---
   const { data: detailedInfo, isLoading: isLoadingDetails, error: detailsError, refetch: refetchDetails } = useQuery<DetailedInfo, Error>({
     queryKey: ['rxNormDetails', selectedDrug?.rxNormId, clinicId], // Include clinicId
     queryFn: async (): Promise<DetailedInfo> => {
       if (!selectedDrug || !clinicId) return null;

       // 1. Check cache first
       const cachedData = await getFromCache(clinicId, selectedDrug.rxNormId);
       if (cachedData) {
           console.log(`Cache hit for ${selectedDrug.rxNormId}`);
           // TODO: Optionally check cache age `cachedData.cachedAt`
           return cachedData;
       }

       console.log(`Cache miss for ${selectedDrug.rxNormId}. Fetching from API...`);
       // 2. Fetch from API if not in cache
       const properties = await getRxNormPropertiesApi(selectedDrug.rxNormId);
       const detailsToCache: DrugDetails = { ...properties, rxNormId: selectedDrug.rxNormId, name: selectedDrug.name };

       // 3. Save to cache (async, don't wait for it to return)
       saveToCache(clinicId, selectedDrug.rxNormId, detailsToCache);

       return detailsToCache;
     },
     enabled: !!selectedDrug && !!clinicId && showFullDetails && !authLoading, // Enable only when needed and auth loaded
     staleTime: Infinity, // Keep cache fresh until invalidated manually
     gcTime: 1000 * 60 * 60,
     retry: 1,
   });

   // --- React Query for Clinical Trials ---
   const { data: clinicalTrials = [], isLoading: isLoadingTrials, error: trialsError } = useQuery<ClinicalTrial[], Error>({
     queryKey: ['clinicalTrials'], // Potentially scope by clinic if relevant: ['clinicalTrials', clinicId]
     queryFn: getClinicalTrials, // Assuming this service doesn't need clinicId
     enabled: !authLoading, // Enable when auth is loaded
     staleTime: 1000 * 60 * 30,
     gcTime: 1000 * 60 * 60,
   });

   // --- Mutations ---
   const confirmDosageMutation = useMutation({
      mutationFn: confirmDosageDetails,
      onSuccess: (data) => { setDosageConfirmationResult(data); setShowDosageConfirmation(true); },
      onError: (error) => { toast({ title: "Confirmation Error", description: "Failed to get dosage confirmation prompt.", variant: "destructive" }); },
   });

   const summarizeTrialMutation = useMutation({
      mutationFn: summarizeClinicalTrials,
      onSuccess: (data, variables) => {
         toast({
           title: `Summary: ${variables.clinicalTrial.title}`,
           description: (<ScrollArea className="h-40 max-h-[50vh]"><p className="text-sm whitespace-pre-wrap">{data.summary}</p></ScrollArea>),
           duration: 15000, className: "w-full md:w-[400px] lg:w-[500px]",
         });
      },
      onError: (error) => { toast({ title: "Summarization Failed", description: "Could not summarize the clinical trial.", variant: "destructive" }); },
   });

  // --- Event Handlers ---
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchTerm.trim() || authLoading) return;
    setSelectedDrug(null);
    setShowFullDetails(false);
    queryClient.removeQueries({ queryKey: ['rxNormDetails'] });
    refetchSearch();
  };

   const handleSelectDrug = async (drug: SearchResult) => {
     if (authLoading) return;
     setSelectedDrug(drug);
     setShowFullDetails(false);
     queryClient.removeQueries({ queryKey: ['rxNormDetails', drug.rxNormId, clinicId] }); // Clear specific cache entry
     confirmDosageMutation.mutate({ drugName: drug.name });
   };

   const handleConfirmDosageView = () => {
      setShowDosageConfirmation(false);
       if (dosageConfirmationResult?.intentConfirmed) {
           setShowFullDetails(true);
           refetchDetails(); // Explicitly refetch or rely on enabled flag
       } else {
           toast({ title: "Access Cancelled", description: "Detailed dosage information not shown.", variant: "default" });
       }
       setDosageConfirmationResult(null);
   };

   const handleCancelDosageView = () => {
       setShowDosageConfirmation(false);
       setShowFullDetails(false);
       setDosageConfirmationResult(null);
   }

   const handleSummarizeTrial = (trial: ClinicalTrial) => {
       summarizeTrialMutation.mutate({ clinicalTrial: trial });
   };

   // --- Effects for Errors ---
   useEffect(() => { if (searchError) toast({ title: "Search Failed", description: searchError.message, variant: "destructive" }); }, [searchError, toast]);
   useEffect(() => { if (detailsError) toast({ title: "Details Fetch Failed", description: detailsError.message, variant: "destructive" }); }, [detailsError, toast]);
   useEffect(() => { if (trialsError) toast({ title: "Trials Fetch Failed", description: trialsError.message, variant: "destructive" }); }, [trialsError, toast]);

   // Loading state for the entire page
   const pageLoading = authLoading;

    if (pageLoading) {
       return <div className="p-6"><Skeleton className="h-[70vh] w-full" /></div>; // Or a more specific skeleton
    }

  return (
    <div className="grid gap-6 lg:grid-cols-3 animate-fadeIn">
      {/* Search and Results Column */}
      <div className="lg:col-span-1 flex flex-col gap-6">
         <Card className="panel-primary">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-primary" /> PharmaNet Search
                </CardTitle>
                 <CardDescription>Search RxNorm database.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                    placeholder="Search for drugs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit" disabled={isLoadingSearch}>
                    {isLoadingSearch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
                </form>
            </CardContent>
            <Separator />
             <CardContent className="p-0">
                 <ScrollArea className="h-[calc(50vh-120px)] min-h-[200px]">
                    {isLoadingSearch && ( <div className="p-6 text-center text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Searching...</div> )}
                    {!isLoadingSearch && searchResults.length > 0 ? (
                        <ul className="p-2 space-y-1">
                        {searchResults.map((drug) => (
                            <li key={drug.rxNormId}>
                                <Button
                                variant="ghost"
                                className={cn(`w-full justify-start text-left h-auto py-2 px-2`, selectedDrug?.rxNormId === drug.rxNormId ? 'bg-primary/10 text-primary' : 'hover:bg-muted')}
                                onClick={() => handleSelectDrug(drug)}
                                disabled={confirmDosageMutation.isPending}
                                >
                                <div className="flex flex-col">
                                    <span className="font-medium">{drug.name}</span>
                                    <span className="text-xs text-muted-foreground">RxCUI: {drug.rxNormId}</span>
                                </div>
                                </Button>
                            </li>
                        ))}
                        </ul>
                    ) : ( !isLoadingSearch && searchTerm && <div className="p-6 text-center text-muted-foreground">No results for "{searchTerm}".</div> )}
                    {searchError && !isLoadingSearch && ( <div className="p-4"><Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Search Error</AlertTitle><AlertDescription>{searchError.message}</AlertDescription></Alert></div> )}
                 </ScrollArea>
             </CardContent>
         </Card>

          {/* R&D Alerts Section */}
          <Card className="panel-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" /> R&D / Clinical Trial Alerts
              </CardTitle>
               <CardDescription>Latest updates from ClinicalTrials.gov.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                 <ScrollArea className="h-[calc(50vh-100px)] min-h-[200px]">
                    {isLoadingTrials && ( <div className="p-6 text-center text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading trials...</div> )}
                    {!isLoadingTrials && clinicalTrials.length > 0 ? (
                         <ul className="p-2 space-y-1">
                        {clinicalTrials.map((trial) => (
                            <li key={trial.url} className="border rounded-md p-3 hover:bg-muted transition-colors">
                               <p className="font-medium text-sm mb-1">{trial.title}</p>
                               <p className="text-xs text-muted-foreground mb-2 line-clamp-3">{trial.summary}</p>
                               <div className="flex gap-2 mt-2">
                                  <Button variant="outline" size="sm" onClick={() => handleSummarizeTrial(trial)} disabled={summarizeTrialMutation.isPending && summarizeTrialMutation.variables?.clinicalTrial.url === trial.url}>
                                     {summarizeTrialMutation.isPending && summarizeTrialMutation.variables?.clinicalTrial.url === trial.url ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Brain className="mr-1 h-3 w-3" />}
                                      TL;DR?
                                   </Button>
                                    <Button variant="link" size="sm" asChild className="p-0 h-auto text-primary">
                                    <a href={trial.url} target="_blank" rel="noopener noreferrer">
                                        View Details <ExternalLink className="ml-1 h-3 w-3" />
                                    </a>
                                    </Button>
                               </div>
                            </li>
                        ))}
                        </ul>
                    ) : ( !isLoadingTrials && <div className="p-6 text-center text-muted-foreground">No trials found.</div> )}
                     {trialsError && !isLoadingTrials && ( <div className="p-4"><Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Trials Error</AlertTitle><AlertDescription>{trialsError.message}</AlertDescription></Alert></div> )}
                 </ScrollArea>
             </CardContent>
          </Card>

      </div>

      {/* Details Column */}
      <div className="lg:col-span-2">
        <Card className="panel-primary sticky top-[76px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Drug Details
            </CardTitle>
            <CardDescription>
              {selectedDrug ? `Information for ${selectedDrug.name} (RxCUI: ${selectedDrug.rxNormId})` : 'Select a drug from the search results.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[60vh] space-y-4">
             {(isLoadingDetails || confirmDosageMutation.isPending) && !detailedInfo && selectedDrug && (
                 <div className="flex justify-center items-center h-40">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">
                        {confirmDosageMutation.isPending ? 'Confirming...' : 'Loading details...'}
                    </span>
                 </div>
             )}
             {selectedDrug && !detailedInfo && !isLoadingDetails && !confirmDosageMutation.isPending && !detailsError && !showFullDetails && (
                <div className="p-6 text-center text-muted-foreground">
                    Click "Confirm" in the dialog to view full dosage & interaction details.
                </div>
             )}
            {!isLoadingDetails && detailedInfo && showFullDetails && (
              <ScrollArea className="h-[calc(100vh - 250px)] pr-3">
                  <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold">{detailedInfo.name}</h3>
                        <Badge variant="secondary" className="mt-1">RxCUI: {detailedInfo.rxNormId}</Badge>
                    </div>
                    {detailedInfo.description && ( <p className="text-sm text-muted-foreground">{detailedInfo.description}</p> )}
                    <Separator />
                    <div>
                        <h4 className="font-medium mb-2 text-base">Dosage & Interactions</h4>
                         <p className="text-sm bg-muted p-3 rounded-md border">
                            Full dosage and interaction details loaded successfully. Display formatted data here based on the structure of `detailedInfo`.
                         </p>
                    </div>
                    {detailedInfo.ingredients && detailedInfo.ingredients.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-2 text-base">Ingredients</h4>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            {detailedInfo.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
              </ScrollArea>
            )}
            {!selectedDrug && !isLoadingSearch && ( <div className="p-6 text-center text-muted-foreground">Search for a drug and select it to view details.</div> )}
            {detailsError && !isLoadingDetails && ( <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Details Error</AlertTitle><AlertDescription>{detailsError.message}</AlertDescription></Alert> )}
          </CardContent>
        </Card>
      </div>

        {/* Dosage Confirmation Dialog */}
         <AlertDialog open={showDosageConfirmation} onOpenChange={setShowDosageConfirmation}>
            <AlertDialogContent className="panel-primary"> {/* Use primary panel */}
                <AlertDialogHeader>
                <AlertDialogTitle>Confirm Access</AlertDialogTitle>
                <AlertDialogDescription>
                    {dosageConfirmationResult?.confirmationMessage || 'Loading confirmation...'}
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={handleCancelDosageView}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDosageView}>Confirm</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
