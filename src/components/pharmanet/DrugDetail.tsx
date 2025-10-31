'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface DrugDetail {
  name: string;
  rxcui: string;
  description: string;
  dosageForms: string[];
  strengths: string[];
  interactions: Array<{
    drug: string;
    severity: 'mild' | 'moderate' | 'severe';
    description: string;
  }>;
}

interface DrugDetailProps {
  drug: DrugDetail;
  onClose: () => void;
}

export function DrugDetail({ drug, onClose }: DrugDetailProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const response = await fetch('/api/pharmanet/verify-show-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          drugName: drug.name,
          rxcui: drug.rxcui,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Verification failed');
      }

      const data = await response.json();
      
      if (!data.verified) {
        toast({
          title: 'Access Denied',
          description: data.reason || 'You do not have permission to view sensitive drug details.',
          variant: 'destructive',
        });
        return;
      }

      setShowDetails(true);
      toast({
        title: 'Access Granted',
        description: 'You can now view the sensitive drug details.',
      });
    } catch (error) {
      console.error('Error verifying access:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to verify access. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{drug.name}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
          <p>{drug.description}</p>
        </div>

        {!showDetails ? (
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                This drug has sensitive information that requires verification to view.
              </AlertDescription>
            </Alert>
            <Button
              onClick={handleVerify}
              disabled={isVerifying}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify to View Details
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Available Forms</h3>
              <div className="flex flex-wrap gap-2">
                {drug.dosageForms.map((form) => (
                  <Badge key={form} variant="secondary">
                    {form}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Available Strengths</h3>
              <div className="flex flex-wrap gap-2">
                {drug.strengths.map((strength) => (
                  <Badge key={strength} variant="outline">
                    {strength}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Drug Interactions</h3>
              <div className="space-y-3">
                {drug.interactions.map((interaction, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{interaction.drug}</span>
                      <Badge
                        variant={
                          interaction.severity === 'severe'
                            ? 'destructive'
                            : interaction.severity === 'moderate'
                            ? 'secondary'
                            : 'default'
                        }
                      >
                        {interaction.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {interaction.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
