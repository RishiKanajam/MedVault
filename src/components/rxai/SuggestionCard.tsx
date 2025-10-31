import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, RefreshCw, Plus } from 'lucide-react';

interface SuggestionCardProps {
  suggestion: {
    drugClass: string;
    dosage?: string;
    duration?: string;
    confidence: number;
    citations?: Array<{
      title: string;
      abstract: string;
      url: string;
    }>;
  };
  onSave: () => void;
  onRerun: () => void;
  onNew: () => void;
  isLoading?: boolean;
}

export function SuggestionCard({ suggestion, onSave, onRerun, onNew, isLoading }: SuggestionCardProps) {
  return (
    <Card className="mx-auto w-full max-w-3xl rounded-2xl border border-border/60 bg-background/95 shadow-lg">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-xl font-semibold text-foreground">AI Suggestion</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Suggested intervention based on the latest submission.
          </CardDescription>
        </div>
        <Badge
          variant={suggestion.confidence >= 70 ? 'default' : 'secondary'}
          className="min-w-[140px] justify-center rounded-full bg-primary/10 text-primary"
        >
          Confidence {suggestion.confidence}%
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[420px] pr-4">
          <div className="space-y-6">
            <div className="rounded-xl border border-border/40 bg-muted/30 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Recommended drug class
              </h3>
              <p className="mt-2 text-base text-foreground">{suggestion.drugClass}</p>
            </div>

            {suggestion.dosage && (
              <div className="rounded-xl border border-border/40 bg-background p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dosage</h3>
                <p className="mt-2 text-base text-foreground">{suggestion.dosage}</p>
              </div>
            )}

            {suggestion.duration && (
              <div className="rounded-xl border border-border/40 bg-background p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Duration</h3>
                <p className="mt-2 text-base text-foreground">{suggestion.duration}</p>
              </div>
            )}

            {suggestion.citations && suggestion.citations.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Medical citations
                </h3>
                <div className="space-y-4">
                  {suggestion.citations.map((citation, index) => (
                    <div key={index} className="rounded-xl border border-border/40 bg-background p-4 shadow-sm">
                      <h4 className="text-base font-semibold text-foreground">{citation.title}</h4>
                      <p className="mt-2 text-sm text-muted-foreground">{citation.abstract}</p>
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
                      >
                        Read more
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t border-border/40 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" onClick={onRerun} disabled={isLoading} className="w-full sm:w-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          Rerun Analysis
        </Button>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" onClick={onNew} disabled={isLoading} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Case
          </Button>
          <Button onClick={onSave} disabled={isLoading} className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            Save to Records
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 
