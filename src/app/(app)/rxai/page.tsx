'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Mic, BrainCircuit, AlertCircle, Loader2, ClipboardCopy, BadgeHelp, ThumbsUp, ThumbsDown } from 'lucide-react'; // Added BadgeHelp, ThumbsUp, ThumbsDown
import { generatePrescription, type GeneratePrescriptionOutput, type GeneratePrescriptionInput } from '@/ai/flows/generate-prescription'; // Import input type
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from "@/components/ui/progress"; // For confidence score visualization

// TODO: Implement Hugging Face API call for image classification
async function classifyRashImage(imageDataUri: string): Promise<string> {
    // Placeholder - replace with actual API call to your Hugging Face endpoint
    console.log("Simulating rash classification for image...");
    await new Promise(resolve => setTimeout(resolve, 800));
    // Example: Call a Next.js API route that uses the Hugging Face token
    // const response = await fetch('/api/classify-rash', { method: 'POST', body: JSON.stringify({ image: imageDataUri }) });
    // if (!response.ok) throw new Error('Rash classification failed');
    // const data = await response.json();
    // return data.classification;
    return "Simulated Classification: Eczema"; // Example result
}

export default function RxAiPage() {
  const [formData, setFormData] = useState<Omit<GeneratePrescriptionInput, 'age' | 'weight' | 'symptoms' | 'photoDataUri'> & { age: string; weight: string; photoFile: File | null }>({
    name: '',
    age: '',
    weight: '',
    vitals: '',
    // symptoms: '', // Symptoms handled by tags
    photoFile: null, // Store File object for upload
  });
  const [photoPreviewUri, setPhotoPreviewUri] = useState<string | null>(null); // For image preview
  const [symptomTags, setSymptomTags] = useState<string[]>([]);
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false); // Loading state for image classification
  const [classificationResult, setClassificationResult] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratePrescriptionOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

 const handleSymptomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && currentSymptom.trim()) { // Add comma as trigger
      e.preventDefault();
      const newTag = currentSymptom.trim().replace(/,$/, ''); // Remove trailing comma if present
      if (newTag && !symptomTags.includes(newTag)) {
        setSymptomTags([...symptomTags, newTag]);
      }
      setCurrentSymptom('');
    }
  };

  const removeSymptomTag = (tagToRemove: string) => {
    setSymptomTags(symptomTags.filter(tag => tag !== tagToRemove));
  };


  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, photoFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviewUri(reader.result as string); // Set preview URI
        // Optionally trigger classification immediately
        // classifyImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
        setFormData(prev => ({ ...prev, photoFile: null }));
        setPhotoPreviewUri(null);
        setClassificationResult(null); // Clear classification if file removed
    }
  };

   // Function to trigger image classification
  const classifyImage = async (imageDataUri: string) => {
    if (!imageDataUri) return;
    setIsClassifying(true);
    setClassificationResult(null); // Clear previous result
    try {
      const classification = await classifyRashImage(imageDataUri);
      setClassificationResult(classification);
      toast({ title: "Image Classified", description: `Detected: ${classification}` });
    } catch (err) {
      console.error("Classification error:", err);
      toast({ title: "Classification Failed", description: err instanceof Error ? err.message : "Could not classify image.", variant: "destructive" });
    } finally {
      setIsClassifying(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent, isSecondOpinion = false) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    if (!isSecondOpinion) { // Don't clear previous result if getting second opinion
        setResult(null);
    }

    // Basic Validation
    if (!formData.name || !formData.age || !formData.weight || !formData.vitals || symptomTags.length === 0) {
      setError('Please fill in all required patient details and symptoms.');
      setIsLoading(false);
       toast({ title: "Missing Information", description: "Ensure all fields are filled.", variant: "destructive" });
      return;
    }

    try {
        // Construct input for the AI flow
        let photoDataUri: string | undefined = undefined;
        if (formData.photoFile) {
            // Read file as Data URI *again* just before sending, ensures it's the latest
            photoDataUri = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(formData.photoFile as Blob);
            });
        }

        // Combine manual symptoms and classification result
        let combinedSymptoms = symptomTags.join(', ');
        if (classificationResult) {
            combinedSymptoms += (combinedSymptoms ? ', ' : '') + `Possible rash type: ${classificationResult}`;
        }

        const input: GeneratePrescriptionInput = {
            name: formData.name,
            age: parseInt(formData.age, 10),
            weight: parseFloat(formData.weight),
            vitals: formData.vitals,
            symptoms: combinedSymptoms, // Use combined symptoms
            photoDataUri: photoDataUri,
        };

         // Validate numeric inputs
        if (isNaN(input.age) || isNaN(input.weight)) {
            throw new Error("Age and Weight must be valid numbers.");
        }

      console.log("[RxAI Page] Sending input to AI:", input);
      const prescriptionResult = await generatePrescription(input);
      console.log("[RxAI Page] Received AI result:", prescriptionResult);

       // Check for errors within the AI response structure itself
       if (prescriptionResult.prescription === "Error generating prescription.") {
           throw new Error(prescriptionResult.rationale); // Throw the error message from the AI
       }

      setResult(prescriptionResult);
       // TODO: Add logic to save prescriptionResult to Firestore (`clinics/{id}/prescriptions`)
       // e.g., savePrescriptionToFirestore(prescriptionResult);
       toast({ title: isSecondOpinion ? "Second Opinion Received" : "Recommendation Generated", description: "AI analysis complete." });

    } catch (err) {
      console.error(`Error generating ${isSecondOpinion ? 'second opinion' : 'prescription'}:`, err);
       const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate ${isSecondOpinion ? 'second opinion' : 'recommendation'}: ${errorMessage}`);
       toast({ title: "AI Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

   const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied!", description: "Details copied to clipboard." });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({ title: "Copy Failed", description: "Could not copy text to clipboard.", variant: "destructive" });
    });
  };


  return (
    <div className="grid gap-6 lg:grid-cols-2 animate-fadeIn">
      <Card className="panel-primary lg:col-span-1"> {/* Use primary panel style */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
             <BrainCircuit className="w-6 h-6 text-primary" /> RxAI Clinical Decision Support
          </CardTitle>
          <CardDescription>Enter patient details for AI-powered recommendations. Provide accurate inputs for best results.</CardDescription>
        </CardHeader>
        {/* Pass the main submit handler to the form */}
        <form onSubmit={(e) => handleSubmit(e, false)}>
          <CardContent className="space-y-4">
            {/* Patient Demographics */}
             <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
                 <legend className="text-sm font-medium px-1">Patient Info</legend>
                 <div className="space-y-2">
                     <Label htmlFor="name">Name*</Label>
                     <Input id="name" value={formData.name} onChange={handleInputChange} required />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                         <Label htmlFor="age">Age*</Label>
                         <Input id="age" type="number" value={formData.age} onChange={handleInputChange} required placeholder="Years"/>
                     </div>
                     <div className="space-y-2">
                         <Label htmlFor="weight">Weight (kg)*</Label>
                         <Input id="weight" type="number" step="0.1" value={formData.weight} onChange={handleInputChange} required placeholder="kg"/>
                     </div>
                 </div>
             </fieldset>

            {/* Vitals and Symptoms */}
             <fieldset className="grid grid-cols-1 gap-4 border p-4 rounded-md">
                 <legend className="text-sm font-medium px-1">Clinical Data</legend>
                 <div className="space-y-2">
                   <Label htmlFor="vitals">Vitals*</Label>
                   <Input id="vitals" placeholder="e.g., BP 120/80, HR 70, Temp 37.0°C, SpO2 98%" value={formData.vitals} onChange={handleInputChange} required />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="symptoms-input">Symptoms* (type and press Enter or Comma)</Label>
                    <Input
                        id="symptoms-input"
                        placeholder="e.g., fever, cough, sore throat"
                        value={currentSymptom}
                        onChange={(e) => setCurrentSymptom(e.target.value)}
                        onKeyDown={handleSymptomKeyDown}
                        disabled={isLoading}
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2 min-h-[24px]">
                        {symptomTags.map(tag => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1 py-0.5 px-2">
                            {tag}
                            <button type="button" onClick={() => removeSymptomTag(tag)} className="ml-1 opacity-70 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring rounded-full">
                            <X className="h-3 w-3" />
                            </button>
                        </Badge>
                        ))}
                    </div>
                 </div>
             </fieldset>


            {/* Optional Photo Upload */}
             <fieldset className="grid grid-cols-1 gap-4 border p-4 rounded-md">
                 <legend className="text-sm font-medium px-1">Symptom Photo (Optional)</legend>
                 <div className="space-y-2">
                    <Label htmlFor="photo">Upload Image (e.g., rash)</Label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <Input id="photo" type="file" accept="image/*" onChange={handlePhotoUpload} className="flex-1" disabled={isLoading} />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => classifyImage(photoPreviewUri!)}
                            disabled={!photoPreviewUri || isClassifying || isLoading}
                        >
                             {isClassifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4"/>}
                             {isClassifying ? 'Classifying...' : 'Classify Rash'}
                        </Button>
                    </div>
                    {photoPreviewUri && (
                        <div className="mt-2 border p-2 rounded-md inline-block relative">
                        <img src={photoPreviewUri} alt="Symptom Preview" className="max-h-32 rounded" />
                        {classificationResult && (
                            <Badge variant="default" className="absolute bottom-1 right-1 text-xs">{classificationResult}</Badge>
                        )}
                         {isClassifying && (
                            <div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded">
                                <Loader2 className="h-5 w-5 animate-spin text-primary"/>
                            </div>
                        )}
                        </div>
                    )}
                 </div>
             </fieldset>

          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
             <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                {isLoading ? 'Generating...' : 'Get Recommendation'}
             </Button>
             {/* TODO: Add Adverse Event Reporting Button logic */}
             <Button variant="outline" type="button" disabled={isLoading} onClick={() => console.log("Report Adverse Event clicked")} className="w-full sm:w-auto">
                 <AlertCircle className="mr-2 h-4 w-4" /> Report Adverse Event
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="panel-primary lg:col-span-1"> {/* Use primary panel style */}
        <CardHeader>
          <CardTitle>AI Recommendation</CardTitle>
          <CardDescription>Review the AI analysis below. Verify before clinical use.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && !result && ( // Show skeleton only when loading initial result
             <div className="space-y-6">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Separator/>
                 <Skeleton className="h-8 w-1/2" />
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-3/4" />
             </div>
          )}
          {error && (
             <div className="text-destructive flex items-center gap-2 p-4 bg-destructive/10 rounded-md border border-destructive/50">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
             </div>
          )}
          {result && ( // Show result card content once available
            <div className="space-y-6">
                {/* Confidence Score Section */}
                <div>
                    <Label className="text-base font-semibold flex items-center justify-between">
                        Confidence Score:
                        <Badge variant={result.confidenceScore >= 70 ? "default" : "destructive"} className="ml-2">
                            {result.confidenceScore}%
                         </Badge>
                     </Label>
                    <Progress value={result.confidenceScore} className="mt-2 h-2" />
                    {result.secondOpinionNeeded && result.confidenceScore < 70 && (
                        <div className="mt-3 flex flex-col sm:flex-row items-center gap-2 p-3 bg-warning/10 border border-warning/50 rounded-md text-sm">
                             <BadgeHelp className="w-5 h-5 text-warning shrink-0"/>
                             <span className="text-warning-foreground flex-1">Confidence is low. Consider reviewing details or getting a second opinion.</span>
                             {/* Pass second opinion flag to handler */}
                            <Button variant="outline" size="sm" onClick={(e) => handleSubmit(e, true)} disabled={isLoading}>
                                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                                Get Second Opinion
                            </Button>
                        </div>
                    )}
                </div>
                 <Separator />
                {/* Prescription */}
                <div>
                    <Label className="text-base font-semibold">Prescription</Label>
                     <div className="flex items-start justify-between mt-1 p-3 bg-muted rounded-md border">
                        <p className="text-foreground flex-1 mr-2">{result.prescription}</p>
                         <Button variant="ghost" size="icon" onClick={() => copyToClipboard(result.prescription)} className="h-7 w-7 shrink-0">
                          <ClipboardCopy className="h-4 w-4" />
                           <span className="sr-only">Copy Prescription</span>
                        </Button>
                     </div>
                </div>
                {/* Rationale */}
                <div>
                  <Label className="text-base font-semibold">Rationale</Label>
                  <p className="text-muted-foreground mt-1">{result.rationale}</p>
                </div>
                 {/* Dosage Guidelines */}
                <div>
                  <Label className="text-base font-semibold">Dosage Guidelines</Label>
                  <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{result.dosageGuidelines}</p>
                </div>
                {/* Citations */}
                 {result.citations && result.citations.length > 0 && (
                    <div>
                      <Label className="text-base font-semibold">Citations</Label>
                       <ul className="mt-1 space-y-1 list-disc pl-5">
                         {result.citations.map((citation, index) => (
                           <li key={index} className="text-xs text-muted-foreground">
                             <span className="font-medium text-foreground">{citation.source}:</span> {citation.reference}
                             {/* TODO: Add logic to make citation.reference a link if it's a URL */}
                           </li>
                         ))}
                       </ul>
                    </div>
                 )}
                 <Separator />
                 {/* Feedback Area */}
                  <div>
                     <Label className="text-sm font-medium">Was this recommendation helpful?</Label>
                     <div className="flex gap-2 mt-2">
                         <Button variant="outline" size="sm" onClick={() => console.log("Feedback: Helpful")}>
                             <ThumbsUp className="mr-1.5 h-4 w-4"/> Helpful
                         </Button>
                          <Button variant="outline" size="sm" onClick={() => console.log("Feedback: Not Helpful")}>
                             <ThumbsDown className="mr-1.5 h-4 w-4"/> Not Helpful
                         </Button>
                     </div>
                  </div>
            </div>
          )}
          {/* Initial Placeholder */}
          {!isLoading && !result && !error && (
            <div className="text-center text-muted-foreground h-40 flex items-center justify-center">
              Enter patient details and click "Get Recommendation" to see results here.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for cleaner code
import { X } from 'lucide-react'; // Make sure X is imported if used in Badge
