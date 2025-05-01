// src/app/settings/profile/page.tsx

import { auth, db } from "@/firebase"; // Your Firebase initialization
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";

const ProfileSettings = () => {
  const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || "");

  const handleDisplayNameChange = (event: any) => {
    setDisplayName(event.target.value);
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    if (!auth.currentUser) {
      console.error("No authenticated user found.");
      return;
    }

    const user = auth.currentUser;

    try {
      // Update Firebase Authentication
      await updateProfile(user, { displayName });

      // Update Firestore
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { displayName });

      console.log("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="displayName">Display Name:</label>
        <input
          type="text"
          id="displayName"
          value={displayName}
          onChange={handleDisplayNameChange}
        />
      </div>
      <button type="submit">Update Profile</button>
    </form>
  );
};

export default ProfileSettings;