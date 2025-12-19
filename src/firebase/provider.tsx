'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { UserProfile } from '@/lib/types';
import { getUserProfileClient, createUserProfile } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { initializeFirebase } from '@/firebase'; // Import initialize function

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
}

export interface FirebaseContextState extends Partial<FirebaseServices>, UserAuthState {
  areServicesAvailable: boolean;
}

export interface FirebaseServicesAndUser extends FirebaseServices, UserAuthState {}

export interface UserHookResult { 
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<FirebaseServices | null>(null);
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, 
    userError: null,
    userProfile: null,
    isProfileLoading: true,
  });
  
  const { toast } = useToast();

  // Initialize Firebase services on mount
  useEffect(() => {
    try {
      const firebaseServices = initializeFirebase();
      setServices(firebaseServices);
    } catch (e) {
      console.error("Failed to initialize Firebase:", e);
      setUserAuthState(prev => ({...prev, isUserLoading: false, isProfileLoading: false, userError: e as Error}));
    }
  }, []);

  const handleProfile = useCallback(async (user: User | null, authInstance: Auth) => {
    if (user) {
      setUserAuthState(prev => ({ ...prev, isProfileLoading: true }));
      try {
        let profile = await getUserProfileClient(user.uid);
        if (!profile) {
          toast({ title: "Membuat Profil...", description: "Selamat datang! Kami sedang menyiapkan akun Anda." });
          profile = await createUserProfile(user);
          toast({ title: "Selamat Datang!", description: "Profil baru Anda telah dibuat." });
        }
        setUserAuthState(prev => ({ ...prev, userProfile: profile, isProfileLoading: false, userError: null }));
      } catch (error: any) {
        console.error("Critical error handling user profile:", error);
        toast({
          variant: 'destructive',
          title: 'Gagal Memuat Profil',
          description: 'Ada masalah saat memuat data akun Anda. Silakan coba login kembali.'
        });
        await firebaseSignOut(authInstance);
        setUserAuthState({
          user: null, isUserLoading: false, userError: error, userProfile: null, isProfileLoading: false,
        });
      }
    } else {
      setUserAuthState(prev => ({ ...prev, userProfile: null, isProfileLoading: false }));
    }
  }, [toast]);

  // Set up auth state listener once services are available
  useEffect(() => {
    if (!services) return;

    setUserAuthState(prev => ({ ...prev, isUserLoading: true, isProfileLoading: true }));
    
    const unsubscribe = onAuthStateChanged(
      services.auth,
      (firebaseUser) => {
        setUserAuthState(prev => ({ ...prev, user: firebaseUser, isUserLoading: false, userError: null }));
        handleProfile(firebaseUser, services.auth);
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error, userProfile: null, isProfileLoading: false });
      }
    );
    
    return () => unsubscribe();
  }, [services, handleProfile]);

  const contextValue = useMemo((): FirebaseContextState => ({
    areServicesAvailable: !!services,
    ...services,
    ...userAuthState,
  }), [services, userAuthState]);

  // Wait until services are initialized before rendering children
  if (!services) {
    // You can render a global loader here if you want
    return null; 
  }

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.auth || !context.firestore || !context.firebaseApp) {
    const error = new Error('Firebase core services not available. Check FirebaseProvider setup.');
    console.error(error.message, { context });
    throw error;
  }
  
  return context as FirebaseServicesAndUser;
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

export const useUserHook = (): UserHookResult => {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a FirebaseProvider.');
    }
    const { user, isUserLoading, userError } = context;
    return { user, isUserLoading, userError };
};
