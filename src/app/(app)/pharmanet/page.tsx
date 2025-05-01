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
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'; // Import React Query hooks
import { cn } from "@/lib/utils"; // Import cn

// Remove mock services - API calls will go through Next.js routes
// import { searchDrugs, type Drug } from '@/services/rx-norm'; // Remove
// import { getDrugByName, type DrugBankDrug } from '@/services/drug-bank'; // Remove
import { getClinicalTrials, type ClinicalTrial } from '@/services/clinical-trials'; // Keep this for now
import { summarizeClinicalTrials } from '@/ai/flows/summarize-clinical-trials';
import { confirmDosageDetails, type ConfirmDosageDetailsOutput } from '@/ai/flows/confirm-dosage-details'; // Import updated flow


// Define interfaces for API responses
interface RxNormSearchResult {
  rxNormId: string;
  name: string;
}

interface RxNormProperties {
  // Define expected properties based on NCBI API response
  // Example: dosageForms: string[]; ingredients: { name: string; strength: string }[];
  // For now, let's keep it simple
  description?: string;
  ingredients?: string[]; // Added ingredients based on API response structure
  [key: string]: any; // Allow other properties
}

interface DrugDetails extends RxNormProperties {
    rxNormId: string;
    name: string;
    // Add fields from DrugBank or other sources if combining later
}


// API Fetching functions (using fetch against Next.js API routes)
const searchRxNormApi = async (query: string): Promise<RxNormSearchResult[]> => {
  console.log(`[API] Searching RxNorm for: ${query}`);
  const response = await fetch(`/api/rxnorm/search?name=${encodeURIComponent(query)}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    console.error("[API] RxNorm search failed:", errorData);
    throw new Error(errorData.message || 'Failed to search RxNorm');
  }
  const data = await response.json();
  console.log("[API] RxNorm search results:", data);
  return data.results; // Assuming API route returns { results: [...] }
};

const getRxNormPropertiesApi = async (rxcui: string): Promise<RxNormProperties> => {
  console.log(`[API] Fetching properties for RxCUI: ${rxcui}`);
  const response = await fetch(`/api/rxnorm/properties?rxcui=${encodeURIComponent(rxcui)}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
     console.error("[API] RxNorm properties fetch failed:", errorData);
    throw new Error(errorData.message || `Failed to fetch properties for RxCUI ${rxcui}`);
  }
  const data = await response.json();
   console.log("[API] RxNorm properties:", data);
  return data.properties; // Assuming API route returns { properties: {...} }
};


type SearchResult = RxNormSearchResult;
type DetailedInfo = DrugDetails | null; // Updated type

export default function PharmaNetPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient(); // Get query client instance

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDrug, setSelectedDrug] = useState<SearchResult | null>(null);
  const [showDosageConfirmation, setShowDosageConfirmation] = useState(false);
  const [dosageConfirmationResult, setDosageConfirmationResult] = useState<ConfirmDosageDetailsOutput | null>(null);
  const [showFullDetails, setShowFullDetails] = useState(false); // Controls visibility of sensitive info

  // --- React Query for Search ---
  const { data: searchResults = [], isLoading: isLoadingSearch, error: searchError, refetch: refetchSearch } = useQuery<SearchResult[], Error>({
    queryKey: ['rxNormSearch', searchTerm],
    queryFn: () => searchRxNormApi(searchTerm),
    enabled: false, // Only run query when handleSearch is called
    staleTime: 1000 * 60 * 5, // Cache results for 5 minutes
    gcTime: 1000 * 60 * 15, // Keep unused data for 15 minutes
     retry: 1, // Retry once on failure
  });

   // --- React Query for Drug Details ---
   const { data: detailedInfo, isLoading: isLoadingDetails, error: detailsError, refetch: refetchDetails } = useQuery<DetailedInfo, Error>({
     queryKey: ['rxNormDetails', selectedDrug?.rxNormId],
     queryFn: async (): Promise<DetailedInfo> => {
       if (!selectedDrug) return null;
       const properties = await getRxNormPropertiesApi(selectedDrug.rxNormId);
       // TODO: Fetch from Firestore cache if available
       // Example cache check:
       // const cachedData = queryClient.getQueryData(['drugCache', selectedDrug.rxNormId]);
       // if (cachedData) return cachedData as DetailedInfo;

       // TODO: Implement Firestore caching: `clinics/{clinicId}/drugCache/{rxcui}`
       // await saveToCache(selectedDrug.rxNormId, { ...properties, rxNormId: selectedDrug.rxNormId, name: selectedDrug.name });

       return { ...properties, rxNormId: selectedDrug.rxNormId, name: selectedDrug.name };
     },
     enabled: !!selectedDrug && showFullDetails, // Only fetch when a drug is selected AND confirmed
     staleTime: Infinity, // Cache details indefinitely until invalidated
      gcTime: 1000 * 60 * 60, // Keep unused details for 1 hour
      retry: 1,
   });

   // --- React Query for Clinical Trials ---
   const { data: clinicalTrials = [], isLoading: isLoadingTrials, error: trialsError } = useQuery<ClinicalTrial[], Error>({
     queryKey: ['clinicalTrials'],
     queryFn: getClinicalTrials,
     staleTime: 1000 * 60 * 30, // Cache trials for 30 minutes
     gcTime: 1000 * 60 * 60, // Keep unused for 1 hour
   });

   // --- Mutations ---
   const confirmDosageMutation = useMutation({
      mutationFn: confirmDosageDetails,
      onSuccess: (data) => {
          console.log("[AI Mutation] Confirmation result:", data);
          setDosageConfirmationResult(data);
          setShowDosageConfirmation(true); // Show the dialog
      },
      onError: (error) => {
          console.error('[AI Mutation] Error getting dosage confirmation:', error);
          toast({ title: "Confirmation Error", description: "Failed to get dosage confirmation prompt.", variant: "destructive" });
      },
   });

   const summarizeTrialMutation = useMutation({
      mutationFn: summarizeClinicalTrials,
      onSuccess: (data, variables) => {
         toast({
           title: `Summary: ${variables.clinicalTrial.title}`,
           description: (
             <ScrollArea className="h-40 max-h-[50vh]"> {/* Responsive max height */}
               <p className="text-sm whitespace-pre-wrap">{data.summary}</p>
             </ScrollArea>
           ),
           duration: 15000, // Longer duration
           className: "w-full md:w-[400px] lg:w-[500px]", // Responsive width for toast
         });
      },
      onError: (error) => {
         console.error('[AI Mutation] Error summarizing trial:', error);
         toast({ title: "Summarization Failed", description: "Could not summarize the clinical trial.", variant: "destructive" });
      },
   });


  // --- Event Handlers ---
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchTerm.trim()) return;
    setSelectedDrug(null); // Reset selection on new search
    setShowFullDetails(false); // Reset details visibility
    queryClient.removeQueries({ queryKey: ['rxNormDetails'] }); // Clear details cache for old drug
    // Manually trigger the search query
    refetchSearch();
  };

   const handleSelectDrug = async (drug: SearchResult) => {
     // Don't fetch details yet, just set selected drug and trigger AI confirmation
     setSelectedDrug(drug);
     setShowFullDetails(false); // Ensure details are hidden initially
     queryClient.removeQueries({ queryKey: ['rxNormDetails', drug.rxNormId] }); // Clear potentially stale details cache
     console.log(`Drug selected: ${drug.name}, initiating AI confirmation...`);
     confirmDosageMutation.mutate({ drugName: drug.name });
   };

   const handleConfirmDosageView = () => {
      setShowDosageConfirmation(false); // Close dialog
       if (dosageConfirmationResult?.intentConfirmed) {
           console.log("User confirmed dosage view. Fetching details...");
           setShowFullDetails(true); // Allow details query to run
           // Trigger detail fetch if not already running (or rely on enabled flag)
           refetchDetails();
       } else {
           console.log("User cancelled dosage view.");
           toast({ title: "Access Cancelled", description: "Detailed dosage information not shown.", variant: "default" });
            // Optionally reset selected drug if cancelled
            // setSelectedDrug(null);
       }
       setDosageConfirmationResult(null); // Reset confirmation result
   };

   const handleCancelDosageView = () => {
       setShowDosageConfirmation(false);
       setShowFullDetails(false); // Ensure details remain hidden
       console.log("User cancelled dosage view from dialog cancel button.");
       setDosageConfirmationResult(null); // Reset confirmation result
        // Optionally reset selected drug if cancelled
        // setSelectedDrug(null);
   }

   const handleSummarizeTrial = (trial: ClinicalTrial) => {
       summarizeTrialMutation.mutate({ clinicalTrial: trial });
   };

   // --- Effects ---
   // Display search errors
   useEffect(() => {
       if (searchError) {
           toast({ title: "Search Failed", description: searchError.message, variant: "destructive" });
       }
   }, [searchError, toast]);

   // Display details errors
    useEffect(() => {
        if (detailsError) {
            toast({ title: "Details Fetch Failed", description: detailsError.message, variant: "destructive" });
        }
    }, [detailsError, toast]);

    // Display trials errors
    useEffect(() => {
        if (trialsError) {
            toast({ title: "Trials Fetch Failed", description: trialsError.message, variant: "destructive" });
        }
    }, [trialsError, toast]);


  return (
    <div className="grid gap-6 lg:grid-cols-3 animate-fadeIn">
      {/* Search and Results Column */}
      <div className="lg:col-span-1 flex flex-col gap-6">
         <Card className="panel-primary"> {/* Use primary panel style */}
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
                 <ScrollArea className="h-[calc(50vh-120px)] min-h-[200px]"> {/* Adjust height */}
                    {isLoadingSearch && (
                         <div className="p-6 text-center text-muted-foreground flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                         </div>
                    )}
                    {!isLoadingSearch && searchResults.length > 0 ? (
                        <ul className="p-2 space-y-1">
                        {searchResults.map((drug) => (
                            <li key={drug.rxNormId}>
                                <Button
                                variant="ghost"
                                className={cn(
                                    `w-full justify-start text-left h-auto py-2 px-2`,
                                    selectedDrug?.rxNormId === drug.rxNormId ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                )}
                                onClick={() => handleSelectDrug(drug)}
                                disabled={confirmDosageMutation.isPending} // Disable while confirming previous selection
                                >
                                <div className="flex flex-col">
                                    <span className="font-medium">{drug.name}</span>
                                    <span className="text-xs text-muted-foreground">RxCUI: {drug.rxNormId}</span>
                                </div>
                                </Button>
                            </li>
                        ))}
                        </ul>
                    ) : (
                         !isLoadingSearch && searchTerm && <div className="p-6 text-center text-muted-foreground">No results for "{searchTerm}".</div>
                    )}
                    {searchError && !isLoadingSearch && (
                        <div className="p-4">
                             <Alert variant="destructive">
                               <AlertTriangle className="h-4 w-4" />
                               <AlertTitle>Search Error</AlertTitle>
                               <AlertDescription>{searchError.message}</AlertDescription>
                             </Alert>
                        </div>
                    )}
                 </ScrollArea>
             </CardContent>
         </Card>

          {/* R&D Alerts Section */}
          <Card className="panel-primary"> {/* Use primary panel style */}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" /> R&D / Clinical Trial Alerts
              </CardTitle>
               <CardDescription>Latest updates from ClinicalTrials.gov.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                 <ScrollArea className="h-[calc(50vh-100px)] min-h-[200px]"> {/* Adjust height */}
                    {isLoadingTrials && (
                        <div className="p-6 text-center text-muted-foreground flex items-center justify-center gap-2">
                           <Loader2 className="h-4 w-4 animate-spin" /> Loading trials...
                        </div>
                    )}
                    {!isLoadingTrials && clinicalTrials.length > 0 ? (
                         <ul className="p-2 space-y-1">
                        {clinicalTrials.map((trial) => (
                            <li key={trial.url} className="border rounded-md p-3 hover:bg-muted transition-colors">
                               <p className="font-medium text-sm mb-1">{trial.title}</p>
                               <p className="text-xs text-muted-foreground mb-2 line-clamp-3">{trial.summary}</p> {/* Increased line clamp */}
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
                    ) : (
                       !isLoadingTrials && <div className="p-6 text-center text-muted-foreground">No trials found.</div>
                    )}
                     {trialsError && !isLoadingTrials && (
                         <div className="p-4">
                             <Alert variant="destructive">
                               <AlertTriangle className="h-4 w-4" />
                               <AlertTitle>Trials Error</AlertTitle>
                               <AlertDescription>{trialsError.message}</AlertDescription>
                             </Alert>
                         </div>
                     )}
                 </ScrollArea>
             </CardContent>
          </Card>

      </div>

      {/* Details Column */}
      <div className="lg:col-span-2">
        <Card className="panel-primary sticky top-[76px]"> {/* Adjust top offset */}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Drug Details
            </CardTitle>
            <CardDescription>
              {selectedDrug ? `Information for ${selectedDrug.name} (RxCUI: ${selectedDrug.rxNormId})` : 'Select a drug from the search results.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[60vh] space-y-4"> {/* Ensure content area is tall enough */}
             {/* Loading state specific to details */}
             {(isLoadingDetails || confirmDosageMutation.isPending) && !detailedInfo && selectedDrug && (
                 <div className="flex justify-center items-center h-40">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">
                        {confirmDosageMutation.isPending ? 'Confirming...' : 'Loading details...'}
                    </span>
                 </div>
             )}

             {/* Display basic info even before confirmation */}
             {selectedDrug && !detailedInfo && !isLoadingDetails && !confirmDosageMutation.isPending && !detailsError && (
                <div className="p-6 text-center text-muted-foreground">
                    Click "Confirm" in the dialog to view full dosage & interaction details.
                </div>
             )}

            {/* Display detailed info when loaded and confirmed */}
            {!isLoadingDetails && detailedInfo && showFullDetails && (
              <ScrollArea className="h-[calc(100vh - 250px)] pr-3"> {/* Add scroll for long content */}
                  <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold">{detailedInfo.name}</h3>
                        <Badge variant="secondary" className="mt-1">RxCUI: {detailedInfo.rxNormId}</Badge>
                    </div>
                    {detailedInfo.description && (
                         <p className="text-sm text-muted-foreground">{detailedInfo.description}</p>
                    )}
                    <Separator />

                    {/* Sensitive Information Section */}
                    <div>
                        <h4 className="font-medium mb-2 text-base">Dosage & Interactions</h4>
                         <p className="text-sm bg-muted p-3 rounded-md border">
                            {/* TODO: Render actual dosage/interaction data from detailedInfo */}
                            Full dosage and interaction details loaded successfully. Display formatted data here based on the structure of `detailedInfo`.
                         </p>
                         {/* TODO: Add interaction graph visualization component here */}
                    </div>

                    {/* Add other sections as needed based on RxNormProperties */}
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

            {/* Handle no selection */}
            {!selectedDrug && !isLoadingSearch && (
               <div className="p-6 text-center text-muted-foreground">
                 Search for a drug and select it to view details.
               </div>
            )}

            {/* Handle details error */}
            {detailsError && !isLoadingDetails && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Details Error</AlertTitle>
                    <AlertDescription>{detailsError.message}</AlertDescription>
                  </Alert>
            )}
          </CardContent>
        </Card>
      </div>

        {/* Dosage Confirmation Dialog */}
         <AlertDialog open={showDosageConfirmation} onOpenChange={setShowDosageConfirmation}>
            <AlertDialogContent className="panel-primary"> {/* Use primary panel style */}
                <AlertDialogHeader>
                <AlertDialogTitle>Confirm Access</AlertDialogTitle>
                <AlertDialogDescription>
                    {dosageConfirmationResult?.confirmationMessage || 'Loading confirmation...'}
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                 {/* Use explicit handler for cancel */}
                <AlertDialogCancel onClick={handleCancelDosageView}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDosageView}>Confirm</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
