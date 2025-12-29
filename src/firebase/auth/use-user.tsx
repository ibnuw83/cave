
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth, useFirestore } from '@/firebase/provider';
import { User, onIdTokenChanged } from 'firebase/auth';
import { UserProfile } from '@/lib/types';
import { getUserProfileClient } from '@/lib/firestore-client';

export function useUser() {
  const auth = useAuth();
  const db = useFirestore();

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);

  const fetchUserProfile = useCallback(async (firebaseUser: User) => {
    setIsProfileLoading(true);
    try {
      const profile = await getUserProfileClient(db, firebaseUser.uid);
      if (profile) {
        setUserProfile(profile);
      } else {
        // This case should ideally not happen for logged-in users
        // as profile should be created on registration.
        // Logging out prevents being in a broken state.
        console.error(`Profile not found for UID: ${firebaseUser.uid}. Logging out.`);
        setAuthError(new Error("User profile does not exist."));
        await auth.signOut();
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      setAuthError(err as Error);
      await auth.signOut(); // Log out on critical profile error
    } finally {
      setIsProfileLoading(false);
    }
  }, [auth, db]);


  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (firebaseUser) => {
      setIsUserLoading(false);

      if (!firebaseUser) {
        setUser(null);
        setUserProfile(null);
        setIsProfileLoading(false);
        return;
      }
      
      setUser(firebaseUser);
      await fetchUserProfile(firebaseUser);

    });

    return () => unsub();
  }, [auth, fetchUserProfile]);


  const refreshUserProfile = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    // Force refresh the token to get latest custom claims
    await currentUser.getIdToken(true);
    
    // After token is refreshed, re-fetch the profile from Firestore
    await fetchUserProfile(currentUser);

  }, [auth, fetchUserProfile]);


  return {
    user,
    userProfile,
    isUserLoading,
    isProfileLoading,
    authError,
    refreshUserProfile,
  };
}
