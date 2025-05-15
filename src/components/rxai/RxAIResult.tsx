'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Save, RefreshCw } from 'lucide-react';

interface RxAIResultProps {
  result: {
    drugClass: string;
    dosage: string;
    duration: string;
    confidence: number;
    citations: Array<{
      title: string;
      abstract: string;
      url: string;
    }>;
  };
  onSave: () => void;
  onRerun: () => void;
  onNew: () => void;
  isLoading?: boolean;
  error?: string;
}

export function RxAIResult({
  result,
  onSave,
  onRerun,
  onNew,
  isLoading,
  error
}: RxAIResultProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Analyzing Symptoms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={onRerun} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>AI Recommendation</CardTitle>
          <Badge
            variant={result.confidence >= 70 ? "default" : "secondary"}
            className="ml-2"
          >
            {result.confidence}% Confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Drug Class</h3>
            <p className="text-lg font-medium">{result.drugClass}</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Dosage</h3>
            <p className="text-lg font-medium">{result.dosage}</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Duration</h3>
            <p className="text-lg font-medium">{result.duration}</p>
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="citations">
            <AccordionTrigger>View Citations</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {result.citations.map((citation, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium">{citation.title}</h4>
                    <p className="text-sm text-muted-foreground">{citation.abstract}</p>
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Read full paper
                    </a>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save to History"}
          </Button>
          {result.confidence < 70 && (
            <Button
              onClick={onRerun}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Get Second Opinion
            </Button>
          )}
          <Button
            onClick={onNew}
            variant="ghost"
            className="flex-1"
          >
            Start New
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 