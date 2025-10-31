'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

interface SymptomInputFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function SymptomInputForm({ onSubmit, isLoading }: SymptomInputFormProps) {
  const { toast } = useToast();
  const [isVoiceInput, setIsVoiceInput] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    weight: '',
    bloodPressure: '',
    temperature: '',
    symptoms: '',
    photo: null as File | null,
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFormData(prev => ({ ...prev, photo: acceptedFiles[0]! }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.symptoms) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive"
      });
      return;
    }
    onSubmit(formData);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto border-none shadow-lg ring-1 ring-primary/15">
      <CardHeader className="space-y-2 pb-0">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          AI Symptom Intake
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Capture the essentials so the assistant can respond with confidence. Required fields are marked with an asterisk.
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="rounded-xl border border-primary/10 bg-primary/5 p-4 sm:p-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-medium uppercase tracking-wide text-primary">
                Patient Profile
              </h2>
              <p className="text-xs text-muted-foreground">
                Start with who you are speaking to so treatment suggestions stay personal.
              </p>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Patient Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Anaya Patel"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="e.g., 36"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodPressure">Blood Pressure</Label>
                <Input
                  id="bloodPressure"
                  placeholder="e.g., 120/80"
                  value={formData.bloodPressure}
                  onChange={(e) => setFormData(prev => ({ ...prev, bloodPressure: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2 md:col-span-1">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                  placeholder="e.g., 37.2"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/80">
                Symptom Narrative
              </h2>
              <p className="text-xs text-muted-foreground">
                A clear summary helps the AI surface more precise follow-up questions.
              </p>
            </div>
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Label htmlFor="symptoms" className="text-sm font-medium">
                  Symptoms *
                </Label>
                <div className="flex items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1">
                  <span className="text-xs font-medium text-muted-foreground">Voice Input</span>
                  <Switch
                    id="voice-input"
                    checked={isVoiceInput}
                    onCheckedChange={setIsVoiceInput}
                    aria-label="Toggle voice input"
                  />
                </div>
              </div>
              <Textarea
                id="symptoms"
                value={formData.symptoms}
                onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                placeholder="Describe what the patient is experiencing, when it started, and any triggers..."
                required
                className="min-h-[120px] resize-y"
              />
              <p className="text-xs text-muted-foreground">
                Include medication history, recent travel, or other context the AI should factor in.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/80">
                Visual Evidence
              </h2>
              <p className="text-xs text-muted-foreground">
                Attach a clear photo for dermatology or visible symptoms. Only one image is needed.
              </p>
            </div>
            <div
              {...getRootProps()}
              className={cn(
                "group flex h-36 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-muted-foreground/40 bg-background text-center transition-all",
                isDragActive
                  ? "border-primary/70 bg-primary/10"
                  : "hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <input {...getInputProps()} />
              {formData.photo ? (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{formData.photo.name}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, photo: null }));
                    }}
                  >
                    Remove photo
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-8 w-8" />
                  <p className="text-sm font-medium">Drop a file or browse</p>
                  <p className="text-xs">
                    JPG or PNG up to 5MB
                  </p>
                </div>
              )}
            </div>
          </section>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold shadow-sm"
            disabled={isLoading || !formData.name || !formData.age || !formData.symptoms}
          >
            {isLoading ? "Processing..." : "Submit to AI"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 
