'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { auth, db } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [geminiResult, setGeminiResult] = useState<string | null>(null);
  const { toast } = useToast();

  const testGemini = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/test-gemini');
      const data = await response.json();
      
      if (data.success) {
        setGeminiResult(data.message);
        toast({
          title: 'Success',
          description: 'Gemini API test successful!',
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to test Gemini API',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const testFirebase = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('No user logged in');
      }

      const testRef = collection(db, 'test');
      await addDoc(testRef, {
        userId: user.uid,
        timestamp: new Date(),
        test: 'Firebase connection test'
      });

      toast({
        title: 'Success',
        description: 'Firebase connection test successful!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to test Firebase',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Integration Tests</h1>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gemini API Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testGemini} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Gemini API'}
            </Button>
            {geminiResult && (
              <p className="mt-4 text-sm text-muted-foreground">
                Result: {geminiResult}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Firebase Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testFirebase} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Firebase Connection'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 