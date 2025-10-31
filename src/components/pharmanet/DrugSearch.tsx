'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, AlertCircle } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Drug {
  name: string;
  rxcui: string;
  description: string;
}

interface DrugSearchProps {
  onSelect: (drug: Drug) => void;
}

export function DrugSearch({ onSelect }: DrugSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Drug[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const { toast } = useToast();

  useEffect(() => {
    const searchDrugs = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/pharmanet/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (!response.ok) {
          throw new Error('Failed to search drugs');
        }
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Error searching drugs:', error);
        setError('Failed to search drugs. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to search drugs. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    searchDrugs();
  }, [debouncedQuery, toast]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for a drug..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          disabled={isLoading}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : results.length > 0 ? (
          results.map((drug) => (
            <Card
              key={drug.rxcui}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSelect(drug)}
            >
              <CardContent className="p-4">
                <h3 className="font-medium">{drug.name}</h3>
                <p className="text-sm text-muted-foreground">{drug.description}</p>
              </CardContent>
            </Card>
          ))
        ) : query ? (
          <p className="text-center text-muted-foreground py-4">
            No drugs found
          </p>
        ) : null}
      </div>
    </div>
  );
} 
