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

  const refreshUserProfile = useCallback(async () => {
    if (!auth.currentUser) return;
    setIsProfileLoading(true);
    try {
      const profile = await getUserProfileClient(auth.currentUser.uid);
      setUserProfile(profile);
    } finally {
      setIsProfileLoading(false);
    }
  }, [auth]);

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
      setIsProfileLoading(true);

      try {
        let profile = await getUserProfileClient(firebaseUser.uid);

        if (!profile) {
          profile = await createUserProfile(firebaseUser);
          toast({ title: "Selamat Datang 👋" });
        }

        setUserProfile(profile);
      } catch (err) {
        console.error(err);
        setAuthError(err as Error);
        await auth.signOut();
      } finally {
        setIsProfileLoading(false);
      }
    });

    return () => unsub();
  }, [auth, toast]);

  return {
    user,
    userProfile,
    isUserLoading,
    isProfileLoading,
    authError,
    refreshUserProfile,
  };
}
