'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { User as UserIcon, UploadCloud } from 'lucide-react';

export default function ProfilePage() {
  const auth = useAuth();
  if (!auth) throw new Error('AuthProvider is missing');
  const { user, profile, authLoading, updateProfileData } = auth;
  const { toast } = useToast();
  const [name, setName] = useState(profile?.name || user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || user?.photoURL || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // TODO: Upload to storage and get URL
      setUploading(true);
      setTimeout(() => {
        setPhotoURL(URL.createObjectURL(e.target.files![0]));
        setUploading(false);
        toast({ title: 'Profile picture updated (mock)', description: 'This is a mock. Implement real upload.' });
      }, 1200);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // TODO: Save name and photoURL to Firestore/profile
    setTimeout(() => {
      setSaving(false);
      updateProfileData({ name, photoURL });
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
    }, 1000);
  };

  if (authLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Skeleton className="w-96 h-64" /></div>;
  }

  return (
    <div className="flex justify-center items-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md panel-primary">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your personal information</CardDescription>
        </CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={photoURL} alt={name} />
                <AvatarFallback><UserIcon /></AvatarFallback>
              </Avatar>
              <label htmlFor="profile-photo" className="absolute bottom-0 right-0 bg-background rounded-full p-1 shadow cursor-pointer border border-border">
                <UploadCloud className="h-5 w-5 text-primary" />
                <input id="profile-photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={uploading} />
              </label>
            </div>
            <div className="w-full space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">Name</label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required aria-label="Name" />
            </div>
            <div className="w-full space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">Email</label>
              <Input id="email" value={profile?.email || user?.email || ''} disabled aria-label="Email" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={saving || uploading}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 