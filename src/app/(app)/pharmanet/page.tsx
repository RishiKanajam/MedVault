'use client';

import React, { useState } from 'react';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Mock services - replace with actual API calls
import { searchDrugs, type Drug } from '@/services/rx-norm';
import { getDrugByName, type DrugBankDrug } from '@/services/drug-bank';
import { getClinicalTrials, type ClinicalTrial } from '@/services/clinical-trials';
import { summarizeClinicalTrials } from '@/ai/flows/summarize-clinical-trials';
import { confirmDosageDetails } from '@/ai/flows/confirm-dosage-details';
import { useToast } from '@/hooks/use-toast';


type SearchResult = Drug; // Primarily RxNorm results
type DetailedInfo = DrugBankDrug & { trialsSummary?: string }; // DrugBank info + summarized trials

export default function PharmaNetPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<SearchResult | null>(null);
  const [detailedInfo, setDetailedInfo] = useState<DetailedInfo | null>(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [showDosageConfirmation, setShowDosageConfirmation] = useState(false);
  const [dosageConfirmationMessage, setDosageConfirmationMessage] = useState('');
  const [clinicalTrials, setClinicalTrials] = useState<ClinicalTrial[]>([]); // For R&D Alerts section
  const [isLoadingTrials, setIsLoadingTrials] = useState(false);


  const { toast } = useToast();

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoadingSearch(true);
    setSearchResults([]);
    setSelectedDrug(null);
    setDetailedInfo(null);
    try {
      // TODO: Implement caching logic (AsyncStorage/Firestore)
      const results = await searchDrugs(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching drugs:', error);
       toast({ title: "Search Failed", description: "Could not fetch drug search results.", variant: "destructive" });
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const handleSelectDrug = async (drug: SearchResult) => {
    setSelectedDrug(drug);
    setDetailedInfo(null);
    setIsLoadingDetails(true);

     // 1. Get confirmation message from AI
    try {
        const confirmationResult = await confirmDosageDetails({ drugName: drug.name });
        setDosageConfirmationMessage(confirmationResult.confirmation);
        setShowDosageConfirmation(true); // Trigger the dialog
        // Don't proceed to fetch details yet, wait for user confirmation in the dialog
    } catch (error) {
        console.error('Error getting dosage confirmation:', error);
        toast({ title: "Confirmation Error", description: "Failed to get dosage confirmation prompt.", variant: "destructive" });
        setIsLoadingDetails(false); // Stop loading if confirmation fails
    }


  };

  const fetchDrugDetails = async () => {
      if (!selectedDrug) return;
      // This function is called AFTER the user confirms in the dialog
      try {
          const details = await getDrugByName(selectedDrug.name);
          setDetailedInfo(details);
          // TODO: Fetch related clinical trials based on drug name/ID if API allows
          // const trials = await fetchTrialsForDrug(selectedDrug.name);
          // setClinicalTrials(trials); // Or append to a different list?

      } catch (error) {
          console.error('Error fetching drug details:', error);
          toast({ title: "Details Fetch Failed", description: "Could not fetch detailed drug information.", variant: "destructive" });
      } finally {
          setIsLoadingDetails(false);
      }
  }

  const handleConfirmDosageView = () => {
      setShowDosageConfirmation(false); // Close dialog
      fetchDrugDetails(); // Proceed to fetch details
  };


   const fetchAllClinicalTrials = async () => {
    setIsLoadingTrials(true);
    try {
      const trials = await getClinicalTrials();
      setClinicalTrials(trials);
    } catch (error) {
      console.error('Error fetching clinical trials:', error);
      toast({ title: "Trials Fetch Failed", description: "Could not fetch clinical trials.", variant: "destructive" });
    } finally {
      setIsLoadingTrials(false);
    }
  };

   // Fetch trials on component mount for the R&D section
   React.useEffect(() => {
       fetchAllClinicalTrials();
   }, []);


   const handleSummarizeTrial = async (trial: ClinicalTrial) => {
    setIsLoadingSummary(true); // Use a specific loading state if needed, or reuse isLoadingDetails
    try {
        const result = await summarizeClinicalTrials({ clinicalTrial: trial });

        // Update the specific trial in the state with its summary
        // Or display the summary in a modal/toast
         toast({
          title: `Summary: ${trial.title}`,
           description: (
            <ScrollArea className="h-40"> {/* Add scroll for long summaries */}
               <p className="text-sm">{result.summary}</p>
             </ScrollArea>
           ),
            duration: 9000, // Longer duration for reading
         });

         // Example of updating state if you store summaries with trials:
         // setClinicalTrials(prevTrials =>
         //   prevTrials.map(t =>
         //     t.url === trial.url ? { ...t, aiSummary: result.summary } : t
         //   )
         // );


    } catch (error) {
        console.error('Error summarizing trial:', error);
        toast({ title: "Summarization Failed", description: "Could not summarize the clinical trial.", variant: "destructive" });
    } finally {
        setIsLoadingSummary(false);
    }
};


  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Search and Results Column */}
      <div className="lg:col-span-1 flex flex-col gap-6">
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-primary" /> PharmaNet Search
                </CardTitle>
                 <CardDescription>Search RxNorm, DrugBank, and more.</CardDescription>
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
                 <ScrollArea className="h-[calc(50vh-100px)] min-h-[200px]"> {/* Adjust height as needed */}
                    {searchResults.length > 0 ? (
                        <ul className="p-4 space-y-2">
                        {searchResults.map((drug) => (
                            <li key={drug.rxNormId}>
                                <Button
                                variant="ghost"
                                className={`w-full justify-start text-left h-auto py-2 ${selectedDrug?.rxNormId === drug.rxNormId ? 'bg-muted' : ''}`}
                                onClick={() => handleSelectDrug(drug)}
                                >
                                <div className="flex flex-col">
                                    <span>{drug.name}</span>
                                    <span className="text-xs text-muted-foreground">RxNorm: {drug.rxNormId}</span>
                                </div>
                                </Button>
                            </li>
                        ))}
                        </ul>
                    ) : (
                         <div className="p-6 text-center text-muted-foreground">
                         {isLoadingSearch ? 'Searching...' : 'No search results.'}
                         </div>
                    )}
                 </ScrollArea>
             </CardContent>
         </Card>

          {/* R&D Alerts Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" /> R&D / Clinical Trial Alerts
              </CardTitle>
               <CardDescription>Latest updates from ClinicalTrials.gov.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                 <ScrollArea className="h-[calc(50vh-100px)] min-h-[200px]"> {/* Adjust height */}
                    {isLoadingTrials ? (
                         <div className="p-6 text-center text-muted-foreground">Loading trials...</div>
                    ) : clinicalTrials.length > 0 ? (
                         <ul className="p-4 space-y-3">
                        {clinicalTrials.map((trial) => (
                            <li key={trial.url} className="border-b pb-3 last:border-b-0">
                               <p className="font-medium text-sm mb-1">{trial.title}</p>
                               <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{trial.summary}</p>
                               <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleSummarizeTrial(trial)} disabled={isLoadingSummary}>
                                     <Brain className="mr-1 h-3 w-3" /> TL;DR?
                                   </Button>
                                    <Button variant="ghost" size="sm" asChild>
                                    <a href={trial.url} target="_blank" rel="noopener noreferrer">
                                        View Details <ExternalLink className="ml-1 h-3 w-3" />
                                    </a>
                                    </Button>
                               </div>

                            </li>
                        ))}
                        </ul>
                    ) : (
                        <div className="p-6 text-center text-muted-foreground">No trials found.</div>
                    )}
                 </ScrollArea>
             </CardContent>
          </Card>

      </div>


      {/* Details Column */}
      <div className="lg:col-span-2">
        <Card className="sticky top-[60px]"> {/* Adjust top as needed */}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Drug Details
            </CardTitle>
            <CardDescription>
              {selectedDrug ? `Information for ${selectedDrug.name}` : 'Select a drug from the search results.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[60vh]"> {/* Ensure content area is tall enough */}
            {isLoadingDetails && (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {!isLoadingDetails && detailedInfo && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{detailedInfo.name}</h3>
                 <Badge>DrugBank ID: {detailedInfo.drugBankId}</Badge>
                 <p className="text-sm text-muted-foreground">{detailedInfo.description}</p>
                <Separator />
                {/* TODO: Display Dosage, Interactions, Target Network Graph */}
                <div className="space-y-2">
                    <h4 className="font-medium">Dosage & Interactions</h4>
                     <p className="text-sm text-muted-foreground">Detailed dosage and interaction information would be displayed here after confirmation.</p>
                      {/* Add graph visualization component here */}
                 </div>

                 {detailedInfo.trialsSummary && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                          <h4 className="font-medium">Related Clinical Trials Summary</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailedInfo.trialsSummary}</p>
                      </div>
                    </>
                  )}

              </div>
            )}
            {!isLoadingDetails && !detailedInfo && selectedDrug && (
               <div className="p-6 text-center text-muted-foreground">
                 Confirm viewing details to load information.
               </div>
            )}
             {!isLoadingDetails && !selectedDrug && (
               <div className="p-6 text-center text-muted-foreground">
                 Search for a drug and select it to view details.
               </div>
            )}
          </CardContent>
        </Card>
      </div>

        {/* Dosage Confirmation Dialog */}
         <AlertDialog open={showDosageConfirmation} onOpenChange={setShowDosageConfirmation}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Confirm Access</AlertDialogTitle>
                <AlertDialogDescription>
                    {dosageConfirmationMessage || 'Are you sure you want to view detailed dosage information? This is intended for healthcare professionals.'}
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsLoadingDetails(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDosageView}>Confirm</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
