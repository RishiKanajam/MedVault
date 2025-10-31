import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { AvatarImage } from '@/components/ui/avatar';
import { updateProfile, User as FirebaseUser } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

interface ProfileSectionProps {
  user: FirebaseUser;
  profile: { name?: string; photoURL?: string; email?: string };
}

export default function ProfileSection({ user, profile }: ProfileSectionProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.name || '');
  const [avatar] = useState(profile?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!auth) {
        throw new Error('Firebase auth is not initialized');
      }
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName, photoURL: avatar });
      }
      if (user?.uid) {
        if (!db) {
          throw new Error('Firestore is not initialized');
        }
        await updateDoc(doc(db, 'users', user.uid), { name: displayName, photoURL: avatar });
      }
      toast({ title: 'Profile updated' });
      setEditing(false);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // TODO: Implement avatar upload logic

  return (
    <Card>
      <CardHeader>
        <Avatar>
          <AvatarImage src={avatar} />
        </Avatar>
        <div>{displayName}</div>
        <div>{user?.email}</div>
        <Button onClick={() => setEditing(true)}>Edit</Button>
      </CardHeader>
      {editing && (
        <CardContent>
          <Input value={displayName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)} />
          {/* TODO: Avatar upload */}
          <Button onClick={handleSave} disabled={isSaving}>Save</Button>
        </CardContent>
      )}
    </Card>
  );
} 
