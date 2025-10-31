'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ClinicalTrial {
  id: string;
  title: string;
  status: string;
  summary: string;
  url: string;
}

export function RDAlerts() {
  const [trials, setTrials] = useState<ClinicalTrial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTrials = async () => {
      try {
        const response = await fetch('/api/pharmanet/clinical-trials');
        if (!response.ok) {
          throw new Error('Failed to fetch clinical trials');
        }
        const data = await response.json();
        setTrials(data);
      } catch (error) {
        console.error('Error fetching clinical trials:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch clinical trials. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrials();
  }, [toast]);

  const handleGenerateSummary = async (trialId: string) => {
    setIsGeneratingSummary(trialId);
    try {
      const response = await fetch('/api/pharmanet/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trialId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const { summary } = await response.json();
      setTrials((prev) =>
        prev.map((trial) =>
          trial.id === trialId ? { ...trial, summary } : trial
        )
      );
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate summary. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingSummary(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>R&D Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : trials.length > 0 ? (
              trials.map((trial) => (
                <Card key={trial.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-medium">{trial.title}</h3>
                        <Badge variant="outline">{trial.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGenerateSummary(trial.id)}
                              disabled={isGeneratingSummary === trial.id}
                            >
                              {isGeneratingSummary === trial.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                              <span className="sr-only">Generate Summary</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-medium">AI Summary</h4>
                              <p className="text-sm text-muted-foreground">
                                {trial.summary}
                              </p>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a
                            href={trial.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">View Full Trial</span>
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No clinical trials found
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 
