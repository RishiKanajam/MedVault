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
import { PageShell, PageHeader } from '@/components/layout/page';

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
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: Upload to storage and get URL
    const objectUrl = URL.createObjectURL(file);
    setUploading(true);
    setTimeout(() => {
      setPhotoURL(objectUrl);
      setUploading(false);
      toast({ title: 'Profile picture updated (mock)', description: 'This is a mock. Implement real upload.' });
    }, 1200);
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
    return (
      <PageShell>
        <Skeleton className="mx-auto h-64 w-full max-w-md rounded-2xl bg-muted" />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Profile"
        title="Your Operator Card"
        description="Refresh your display details so teammates know who’s behind every action."
      />
      <div className="mx-auto flex min-h-[40vh] w-full max-w-md items-center justify-center">
        <Card className="w-full panel-primary">
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
    </PageShell>
  );
}
