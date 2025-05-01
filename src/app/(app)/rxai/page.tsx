'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Mic, BrainCircuit, AlertCircle, Loader2, ClipboardCopy } from 'lucide-react';
import { generatePrescription, type GeneratePrescriptionOutput } from '@/ai/flows/generate-prescription';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function RxAiPage() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    weight: '',
    vitals: '',
    symptoms: '',
    photoDataUri: '', // Store photo as data URI
  });
  const [symptomTags, setSymptomTags] = useState<string[]>([]);
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratePrescriptionOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

 const handleSymptomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentSymptom.trim()) {
      e.preventDefault();
      if (!symptomTags.includes(currentSymptom.trim())) {
        setSymptomTags([...symptomTags, currentSymptom.trim()]);
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
      const reader = new FileReader();
      reader.onloadend = () => {
         // Ensure the result is a string before setting state
        if (typeof reader.result === 'string') {
          setFormData(prev => ({ ...prev, photoDataUri: reader.result as string }));
          console.log("Photo URI set"); // Debug log
        } else {
            console.error("FileReader result is not a string:", reader.result);
             toast({ title: "Error reading file", description: "Could not read the selected image.", variant: "destructive" });
        }
      };
      reader.onerror = (error) => {
         console.error("FileReader error:", error);
         toast({ title: "File Reading Error", description: "Failed to read the image file.", variant: "destructive" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    // Basic Validation
    if (!formData.name || !formData.age || !formData.weight || !formData.vitals || symptomTags.length === 0) {
      setError('Please fill in all required patient details and symptoms.');
      setIsLoading(false);
       toast({ title: "Missing Information", description: "Ensure all fields are filled.", variant: "destructive" });
      return;
    }

    try {
        const input = {
            name: formData.name,
            age: parseInt(formData.age, 10),
            weight: parseFloat(formData.weight),
            vitals: formData.vitals,
            symptoms: symptomTags.join(', '),
            photoDataUri: formData.photoDataUri || undefined, // Pass undefined if empty
        };

         // Validate numeric inputs
        if (isNaN(input.age) || isNaN(input.weight)) {
            throw new Error("Age and Weight must be valid numbers.");
        }

      const prescriptionResult = await generatePrescription(input);
      setResult(prescriptionResult);
       // TODO: Add logic to save prescriptionResult to Firestore
       console.log("Prescription generated:", prescriptionResult);
       toast({ title: "Prescription Generated", description: "AI recommendation received successfully." });

    } catch (err) {
      console.error('Error generating prescription:', err);
       const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate prescription: ${errorMessage}`);
       toast({ title: "AI Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

   const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied!", description: "Prescription details copied to clipboard." });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({ title: "Copy Failed", description: "Could not copy text to clipboard.", variant: "destructive" });
    });
  };


  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
             <BrainCircuit className="w-6 h-6 text-primary" /> RxAI Clinical Decision Support
          </CardTitle>
          <CardDescription>Enter patient details to get an AI-powered prescription recommendation.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Patient Name</Label>
                    <Input id="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input id="age" type="number" value={formData.age} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input id="weight" type="number" step="0.1" value={formData.weight} onChange={handleInputChange} required />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vitals">Vitals</Label>
              <Input id="vitals" placeholder="e.g., BP 120/80, HR 70, Temp 37.0°C" value={formData.vitals} onChange={handleInputChange} required />
            </div>

             <div className="space-y-2">
              <Label htmlFor="symptoms-input">Symptoms (press Enter to add)</Label>
              <Input
                id="symptoms-input"
                placeholder="e.g., fever, cough, rash"
                 value={currentSymptom}
                 onChange={(e) => setCurrentSymptom(e.target.value)}
                 onKeyDown={handleSymptomKeyDown}
              />
               <div className="flex flex-wrap gap-2 mt-2">
                 {symptomTags.map(tag => (
                   <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                     {tag}
                     <button type="button" onClick={() => removeSymptomTag(tag)} className="ml-1 rounded-full focus:outline-none focus:ring-1 focus:ring-ring">
                       <X className="h-3 w-3" />
                     </button>
                   </Badge>
                 ))}
               </div>
            </div>


            <div className="space-y-2">
              <Label htmlFor="photo">Symptom Photo (Optional)</Label>
              <div className="flex items-center gap-2">
                 <Input id="photo" type="file" accept="image/*" onChange={handlePhotoUpload} className="flex-1" />
                 {/* TODO: Add Hugging Face image analysis trigger */}
              </div>
               {formData.photoDataUri && (
                 <div className="mt-2">
                   <img src={formData.photoDataUri} alt="Symptom Photo Preview" className="max-h-40 rounded-md border" />
                 </div>
               )}
            </div>

            {/* TODO: Add Voice Input Toggle */}
            {/* <div className="flex items-center space-x-2">
                <Switch id="voice-input" />
                <Label htmlFor="voice-input">Enable Voice Input</Label>
                <Mic className="w-4 h-4 text-muted-foreground" />
            </div> */}

          </CardContent>
          <CardFooter className="flex justify-between items-center">
             <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                {isLoading ? 'Generating...' : 'Get Recommendation'}
             </Button>
             {/* TODO: Add Adverse Event Reporting Button */}
             <Button variant="outline" type="button" disabled={isLoading} onClick={() => console.log("Report Adverse Event clicked")}>
                 <AlertCircle className="mr-2 h-4 w-4" /> Report Adverse Event
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>AI Recommendation</CardTitle>
          <CardDescription>Review the generated prescription and rationale below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
             <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          )}
          {error && (
             <div className="text-destructive flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
             </div>
          )}
          {result && !isLoading && (
            <div className="space-y-6">
                <div>
                    <Label className="text-base font-semibold">Prescription:</Label>
                     <div className="flex items-start justify-between mt-1">
                        <p className="text-muted-foreground flex-1 mr-2">{result.prescription}</p>
                         <Button variant="ghost" size="icon" onClick={() => copyToClipboard(result.prescription)} className="h-7 w-7">
                          <ClipboardCopy className="h-4 w-4" />
                           <span className="sr-only">Copy Prescription</span>
                        </Button>
                     </div>
                </div>
                <Separator />
                <div>
                  <Label className="text-base font-semibold">Rationale:</Label>
                  <p className="text-muted-foreground mt-1">{result.rationale}</p>
                </div>
                 <Separator />
                <div>
                  <Label className="text-base font-semibold">Dosage Guidelines & Citations:</Label>
                  <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{result.dosageGuidelines}</p>
                    {/* TODO: Potentially link citations if possible */}
                </div>
            </div>
          )}
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
