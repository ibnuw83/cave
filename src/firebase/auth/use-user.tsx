
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/firebase/provider';
import { User, onIdTokenChanged } from 'firebase/auth';
import { UserProfile } from '@/lib/types';
import { getUserProfileClient, createUserProfile } from '@/lib/firestore-client';
import { useToast } from '@/hooks/use-toast';

export function useUser() {
  const auth = useAuth();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);

  const fetchUserProfile = useCallback(async (firebaseUser: User) => {
    setIsProfileLoading(true);
    try {
      let profile = await getUserProfileClient(firebaseUser.uid);

      if (!profile) {
        // This likely means it's a brand new user.
        profile = await createUserProfile(firebaseUser);
        toast({ title: "Selamat Datang 👋", description: "Akun Anda telah berhasil dibuat." });
      }

      setUserProfile(profile);
    } catch (err) {
      console.error("Failed to fetch or create user profile:", err);
      setAuthError(err as Error);
      await auth.signOut(); // Log out on critical profile error
    } finally {
      setIsProfileLoading(false);
    }
  }, [auth, toast]);


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
      // Fetch profile immediately. The claims might be stale, but we get basic info.
      // The crucial part is what happens next.
      await fetchUserProfile(firebaseUser);

    });

    return () => unsub();
  }, [auth, fetchUserProfile]);


  const refreshUserProfile = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    // This is the key: force refresh the token to get latest custom claims
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
