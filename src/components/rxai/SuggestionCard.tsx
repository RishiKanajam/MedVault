import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, RefreshCw, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SuggestionCardProps {
  suggestion: {
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
}

export function SuggestionCard({ suggestion, onSave, onRerun, onNew, isLoading }: SuggestionCardProps) {
  const { toast } = useToast();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>AI Suggestion</CardTitle>
          <Badge variant={suggestion.confidence >= 70 ? "default" : "secondary"}>
            Confidence: {suggestion.confidence}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Recommended Drug Class</h3>
              <p className="text-muted-foreground">{suggestion.drugClass}</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Dosage</h3>
              <p className="text-muted-foreground">{suggestion.dosage}</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Duration</h3>
              <p className="text-muted-foreground">{suggestion.duration}</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Medical Citations</h3>
              <div className="space-y-4">
                {suggestion.citations.map((citation, index) => (
                  <div key={index} className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">{citation.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{citation.abstract}</p>
                    <a 
                      href={citation.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Read more
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onRerun}
          disabled={isLoading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Rerun Analysis
        </Button>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={onNew}
            disabled={isLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Case
          </Button>
          <Button
            onClick={onSave}
            disabled={isLoading}
          >
            <Save className="mr-2 h-4 w-4" />
            Save to Records
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 