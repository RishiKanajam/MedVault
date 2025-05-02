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
    console.log(`Simulating save of prescription for ${patientInfo.name} to clinic ${clinicId}:`, prescription);
    // const prescriptionData = {
    //     ...prescription,
    //     patientName: patientInfo.name,
    //     patientAge: patientInfo.age,
    //     patientWeight: patientInfo.weight,
    //     patientVitals: patientInfo.vitals,
    //     patientSymptoms: patientInfo.symptoms,
    //     createdAt: serverTimestamp()
    // };
    // await addDoc(collection(db, `clinics/${clinicId}/prescriptions`), prescriptionData);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate save delay
};


export default function RxAiPage() {
  const { profile, authLoading } = useAuth(); // Get profile for clinicId
  const clinicId = profile?.clinicId;
  const [formData, setFormData] = useState<Omit<GeneratePrescriptionInput, 'age' | 'weight' | 'symptoms' | 'photoDataUri'> & { age: string; weight: string; photoFile: File | null }>({
    name: '', age: '', weight: '', vitals: '', photoFile: null,
  });
  const [photoPreviewUri, setPhotoPreviewUri] = useState<string | null>(null);
  const [symptomTags, setSymptomTags] = useState<string[]>([]);
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationResult, setClassificationResult] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratePrescriptionOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false); // Saving state
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

 const handleSymptomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && currentSymptom.trim()) {
      e.preventDefault();
      const newTag = currentSymptom.trim().replace(/,$/, '');
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
      reader.onloadend = () => setPhotoPreviewUri(reader.result as string);
      reader.readAsDataURL(file);
    } else {
        setFormData(prev => ({ ...prev, photoFile: null }));
        setPhotoPreviewUri(null);
        setClassificationResult(null);
    }
  };

  const classifyImage = async (imageDataUri: string) => {
    if (!imageDataUri) return;
    setIsClassifying(true);
    setClassificationResult(null);
    try {
      const classification = await classifyRashImage(imageDataUri);
      setClassificationResult(classification);
      toast({ title: "Image Classified", description: `Detected: ${classification}` });
    } catch (err) {
      toast({ title: "Classification Failed", description: err instanceof Error ? err.message : "Could not classify image.", variant: "destructive" });
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, isSecondOpinion = false) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    if (!isSecondOpinion) setResult(null);

    if (!formData.name || !formData.age || !formData.weight || !formData.vitals || symptomTags.length === 0) {
      setError('Please fill in all required patient details and symptoms.');
      setIsLoading(false);
      toast({ title: "Missing Information", description: "Ensure all fields are filled.", variant: "destructive" });
      return;
    }

    try {
        let photoDataUri: string | undefined = undefined;
        if (formData.photoFile) {
            photoDataUri = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(formData.photoFile as Blob);
            });
        }

        let combinedSymptoms = symptomTags.join(', ');
        if (classificationResult) {
            combinedSymptoms += (combinedSymptoms ? ', ' : '') + `Possible rash type: ${classificationResult}`;
        }

        const input: GeneratePrescriptionInput = {
            name: formData.name,
            age: parseInt(formData.age, 10),
            weight: parseFloat(formData.weight),
            vitals: formData.vitals,
            symptoms: combinedSymptoms,
            photoDataUri: photoDataUri,
        };

        if (isNaN(input.age) || isNaN(input.weight)) throw new Error("Age and Weight must be valid numbers.");

        console.log("[RxAI] Calling generatePrescription with input:", input); // Debug log
        const prescriptionResult = await generatePrescription(input);
        console.log("[RxAI] Received result:", prescriptionResult); // Debug log

        if (prescriptionResult.prescription === "Error generating prescription.") throw new Error(prescriptionResult.rationale);

        setResult(prescriptionResult);
        toast({ title: isSecondOpinion ? "Second Opinion Received" : "Recommendation Generated", description: "AI analysis complete." });

    } catch (err) {
        console.error("[RxAI] Error during generation:", err); // Debug log
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
      toast({ title: "Copy Failed", description: "Could not copy text to clipboard.", variant: "destructive" });
    });
  };

  // Handler to save the prescription
  const handleSavePrescription = async () => {
    if (!result || !clinicId) {
        toast({ title: "Cannot Save", description: "No recommendation result or clinic ID available.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
        // Prepare patient info subset for saving
        const patientInfo = {
            name: formData.name,
            age: parseInt(formData.age, 10),
            weight: parseFloat(formData.weight),
            vitals: formData.vitals,
            symptoms: symptomTags.join(', ') + (classificationResult ? `, Possible rash type: ${classificationResult}` : ''),
        };
        await savePrescriptionToFirestore(clinicId, result, patientInfo);
        toast({ title: "Saved", description: "Recommendation saved to patient history (simulated)." });
    } catch (error) {
        toast({ title: "Save Error", description: "Could not save the recommendation.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
};


  if (authLoading) {
       return <div className="p-6"><Skeleton className="h-[70vh] w-full bg-muted" /></div>; // Use muted bg
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 animate-fadeIn p-6"> {/* Added padding */}
      <Card className="panel-primary lg:col-span-1"> {/* Use white panel */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
             <BrainCircuit className="w-6 h-6 text-primary" /> RxAI Clinical Decision Support
          </CardTitle>
          <CardDescription>Enter patient details for AI-powered recommendations.</CardDescription>
        </CardHeader>
        <form onSubmit={(e) => handleSubmit(e, false)}>
          <CardContent className="space-y-4">
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
             <fieldset className="grid grid-cols-1 gap-4 border p-4 rounded-md">
                 <legend className="text-sm font-medium px-1">Clinical Data</legend>
                 <div className="space-y-2">
                   <Label htmlFor="vitals">Vitals*</Label>
                   <Input id="vitals" placeholder="e.g., BP 120/80, HR 70, Temp 37.0°C" value={formData.vitals} onChange={handleInputChange} required />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="symptoms-input">Symptoms* (type and press Enter or Comma)</Label>
                    <Input id="symptoms-input" placeholder="e.g., fever, cough" value={currentSymptom} onChange={(e) => setCurrentSymptom(e.target.value)} onKeyDown={handleSymptomKeyDown} disabled={isLoading}/>
                    <div className="flex flex-wrap gap-1.5 mt-2 min-h-[24px]">
                        {symptomTags.map(tag => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1 py-0.5 px-2">
                            {tag}
                            <button type="button" onClick={() => removeSymptomTag(tag)} className="ml-1 opacity-70 hover:opacity-100 focus:outline-none"><X className="h-3 w-3" /></button>
                        </Badge>
                        ))}
                    </div>
                 </div>
             </fieldset>
             <fieldset className="grid grid-cols-1 gap-4 border p-4 rounded-md">
                 <legend className="text-sm font-medium px-1">Symptom Photo (Optional)</legend>
                 <div className="space-y-2">
                    <Label htmlFor="photo">Upload Image (e.g., rash)</Label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <Input id="photo" type="file" accept="image/*" onChange={handlePhotoUpload} className="flex-1" disabled={isLoading} />
                        <Button type="button" variant="outline" size="sm" onClick={() => classifyImage(photoPreviewUri!)} disabled={!photoPreviewUri || isClassifying || isLoading}>
                             {isClassifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4"/>}
                             {isClassifying ? 'Classifying...' : 'Classify Rash'}
                        </Button>
                    </div>
                    {photoPreviewUri && (
                        <div className="mt-2 border p-2 rounded-md inline-block relative">
                            <img src={photoPreviewUri} alt="Symptom Preview" className="max-h-32 rounded" />
                            {classificationResult && <Badge variant="default" className="absolute bottom-1 right-1 text-xs">{classificationResult}</Badge>}
                            {isClassifying && (<div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded"><Loader2 className="h-5 w-5 animate-spin text-primary"/></div>)}
                        </div>
                    )}
                 </div>
             </fieldset>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
             <Button type="submit" disabled={isLoading || !clinicId} className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                {isLoading ? 'Generating...' : 'Get Recommendation'}
             </Button>
             <Button variant="outline" type="button" disabled={isLoading} onClick={() => console.log("Report Adverse Event clicked")} className="w-full sm:w-auto">
                 <AlertCircle className="mr-2 h-4 w-4" /> Report Adverse Event
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="panel-primary lg:col-span-1"> {/* Use white panel */}
        <CardHeader>
          <CardTitle>AI Recommendation</CardTitle>
          <CardDescription>Review the AI analysis below. Verify before clinical use.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && !result && ( <div className="space-y-6"><Skeleton className="h-8 w-3/4 bg-muted" /><Skeleton className="h-4 w-full bg-muted" /><Skeleton className="h-4 w-5/6 bg-muted" /><Separator/><Skeleton className="h-8 w-1/2 bg-muted" /><Skeleton className="h-4 w-full bg-muted" /><Skeleton className="h-4 w-full bg-muted" /><Skeleton className="h-4 w-3/4 bg-muted" /></div> )}
          {error && ( <div className="text-destructive flex items-center gap-2 p-4 bg-destructive/10 rounded-md border border-destructive/50"><AlertCircle className="w-5 h-5" /><p>{error}</p></div> )}
          {result && (
            <div className="space-y-6">
                <div>
                    <Label className="text-base font-semibold flex items-center justify-between">Confidence Score: <Badge variant={result.confidenceScore >= 70 ? "default" : "destructive"} className="ml-2">{result.confidenceScore}%</Badge></Label>
                    <Progress value={result.confidenceScore} className="mt-2 h-2" />
                    {result.secondOpinionNeeded && result.confidenceScore < 70 && (
                        <div className="mt-3 flex flex-col sm:flex-row items-center gap-2 p-3 bg-warning/10 border border-warning/50 rounded-md text-sm">
                             <BadgeHelp className="w-5 h-5 text-warning shrink-0"/>
                             <span className="text-warning-foreground flex-1">Confidence is low. Consider second opinion.</span>
                            <Button variant="outline" size="sm" onClick={(e) => handleSubmit(e, true)} disabled={isLoading}>
                                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                                Get Second Opinion
                            </Button>
                        </div>
                    )}
                </div>
                 <Separator />
                <div>
                    <Label className="text-base font-semibold">Prescription</Label>
                     <div className="flex items-start justify-between mt-1 p-3 bg-muted rounded-md border">
                        <p className="text-foreground flex-1 mr-2">{result.prescription}</p>
                         <Button variant="ghost" size="icon" onClick={() => copyToClipboard(result.prescription)} className="h-7 w-7 shrink-0"><ClipboardCopy className="h-4 w-4" /><span className="sr-only">Copy</span></Button>
                     </div>
                </div>
                <div>
                  <Label className="text-base font-semibold">Rationale</Label>
                  <p className="text-muted-foreground mt-1">{result.rationale}</p>
                </div>
                <div>
                  <Label className="text-base font-semibold">Dosage Guidelines</Label>
                  <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{result.dosageGuidelines}</p>
                </div>
                 {result.citations && result.citations.length > 0 && (
                    <div>
                      <Label className="text-base font-semibold">Citations</Label>
                       <ul className="mt-1 space-y-1 list-disc pl-5">
                         {result.citations.map((citation, index) => (
                           <li key={index} className="text-xs text-muted-foreground">
                             <span className="font-medium text-foreground">{citation.source}:</span> {citation.reference}
                           </li>
                         ))}
                       </ul>
                    </div>
                 )}
                 <Separator />
                  <div>
                     <Label className="text-sm font-medium">Was this recommendation helpful?</Label>
                     <div className="flex gap-2 mt-2">
                         <Button variant="outline" size="sm" onClick={() => console.log("Feedback: Helpful")}><ThumbsUp className="mr-1.5 h-4 w-4"/> Helpful</Button>
                         <Button variant="outline" size="sm" onClick={() => console.log("Feedback: Not Helpful")}><ThumbsDown className="mr-1.5 h-4 w-4"/> Not Helpful</Button>
                     </div>
                  </div>
                  {/* Save Button */}
                   <Button onClick={handleSavePrescription} disabled={isSaving || !clinicId} className="w-full">
                     {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                     {isSaving ? 'Saving...' : 'Save to Patient History'}
                  </Button>
            </div>
          )}
          {!isLoading && !result && !error && ( <div className="text-center text-muted-foreground h-40 flex items-center justify-center">Enter patient details and click "Get Recommendation".</div> )}
        </CardContent>
      </Card>
    </div>
  );
}