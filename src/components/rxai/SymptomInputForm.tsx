'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Mic, MicOff, Upload } from 'lucide-react';
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
      setFormData(prev => ({ ...prev, photo: acceptedFiles[0] }));
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Patient Information & Symptoms</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Patient Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature">Temperature (°C)</Label>
            <Input
              id="temperature"
              type="number"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="symptoms">Symptoms *</Label>
              <div className="flex items-center space-x-2">
                <Label htmlFor="voice-input" className="text-sm">Voice Input</Label>
                <Switch
                  id="voice-input"
                  checked={isVoiceInput}
                  onCheckedChange={setIsVoiceInput}
                />
              </div>
            </div>
            <Textarea
              id="symptoms"
              value={formData.symptoms}
              onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
              placeholder="Describe the symptoms..."
              required
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Rash Photo (Optional)</Label>
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25"
              )}
            >
              <input {...getInputProps()} />
              {formData.photo ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{formData.photo.name}</p>
                  <Button variant="outline" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    setFormData(prev => ({ ...prev, photo: null }));
                  }}>
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop a photo here, or click to select
                  </p>
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !formData.name || !formData.age || !formData.symptoms}
          >
            {isLoading ? "Processing..." : "Submit to AI"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 