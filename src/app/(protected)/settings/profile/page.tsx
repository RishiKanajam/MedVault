
'use client'; // Mark as client component

import React, { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider"; // Use the correct context hook
import { auth, db } from "@/firebase"; // Use correct firebase path
import { updateProfile as updateAuthProfile } from "firebase/auth"; // Rename to avoid conflict
import { doc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ProfileSettingsPage = () => {
  const { user: authUser, profile, authLoading } = useAuth(); // Get user and profile from context
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState(""); // Add state for photo URL
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with profile data when available
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.name || "");
      setPhotoURL(profile.photoURL || "");
    }
  }, [profile]);

  const handleDisplayNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(event.target.value);
  };

  const handlePhotoURLChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoURL(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (!authUser) {
      console.error("No authenticated user found.");
      toast({ title: "Error", description: "Authentication required.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      // Update Firestore first (more reliable for immediate UI updates via listener)
      const userDocRef = doc(db, "users", authUser.uid);
      await updateDoc(userDocRef, {
           name: displayName,
           photoURL: photoURL
       });
       console.log("Firestore profile updated.");

      // Then update Firebase Authentication profile (optional, for consistency)
      await updateAuthProfile(authUser, { displayName: displayName, photoURL: photoURL });
      console.log("Firebase Auth profile updated.");


      toast({ title: "Profile Updated", description: "Your profile has been updated successfully!" });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Update Failed", description: "Could not update profile.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  if (authLoading) {
      return (
          <Card className="panel-primary w-full max-w-lg mx-auto">
              <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
              <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
              </CardContent>
              <CardFooter><Skeleton className="h-10 w-24" /></CardFooter>
          </Card>
      );
  }


  return (
      <Card className="panel-primary w-full max-w-lg mx-auto">
          <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your display name and profile picture URL.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                          type="text"
                          id="displayName"
                          value={displayName}
                          onChange={handleDisplayNameChange}
                          required
                          disabled={isLoading}
                      />
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="photoURL">Photo URL</Label>
                      <Input
                          type="url"
                          id="photoURL"
                          value={photoURL}
                          onChange={handlePhotoURLChange}
                          disabled={isLoading}
                          placeholder="https://example.com/avatar.png"
                      />
                  </div>
                  {/* Add other profile fields if needed */}
              </CardContent>
              <CardFooter>
                  <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {isLoading ? "Saving..." : "Update Profile"}
                  </Button>
              </CardFooter>
          </form>
      </Card>
  );
};

export default ProfileSettingsPage;
