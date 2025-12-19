'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { UserProfile } from '@/lib/types';
import { getUserProfileClient, createUserProfile } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';

interface FirebaseProviderProps {
  children: ReactNode;
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

export interface FirebaseContextState {
  areServicesAvailable: boolean; 
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; 
  user: User | null;
  isUserLoading: boolean; 
  userError: Error | null;
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
}

export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
}

export interface UserHookResult { 
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}


export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);


// This internal component contains all the hooks and logic.
// It will only be rendered when all Firebase services are available.
const FirebaseProviderContent: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
    const { toast } = useToast();
    const [userAuthState, setUserAuthState] = useState<UserAuthState>({
        user: null,
        isUserLoading: true, 
        userError: null,
        userProfile: null,
        isProfileLoading: true,
    });

    const handleProfile = useCallback(async (user: User | null) => {
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
            await firebaseSignOut(auth);
            setUserAuthState({
                user: null,
                isUserLoading: false,
                userError: error,
                userProfile: null,
                isProfileLoading: false,
            });
        }
        } else {
        setUserAuthState(prev => ({ ...prev, userProfile: null, isProfileLoading: false }));
        }
    }, [auth, toast]);

    useEffect(() => {
        setUserAuthState({ user: null, isUserLoading: true, userError: null, userProfile: null, isProfileLoading: true });
        const unsubscribe = onAuthStateChanged(
        auth,
        (firebaseUser) => {
            setUserAuthState(prev => ({ ...prev, user: firebaseUser, isUserLoading: false, userError: null }));
            handleProfile(firebaseUser);
        },
        (error) => {
            console.error("FirebaseProvider: onAuthStateChanged error:", error);
            setUserAuthState({ user: null, isUserLoading: false, userError: error, userProfile: null, isProfileLoading: false });
        }
        );
        return () => unsubscribe();
    }, [auth, handleProfile]);

    const contextValue = useMemo((): FirebaseContextState => ({
        areServicesAvailable: true,
        firebaseApp: firebaseApp,
        firestore: firestore,
        auth: auth,
        ...userAuthState,
    }), [firebaseApp, firestore, auth, userAuthState]);

    return (
        <FirebaseContext.Provider value={contextValue}>
            <FirebaseErrorListener />
            {children}
        </FirebaseContext.Provider>
    );
};


export const FirebaseProvider: React.FC<FirebaseProviderProps> = (props) => {
  const { children, auth } = props;

  // This is the only conditional logic, happening BEFORE any hooks are called.
  // It renders either the content or a fallback, ensuring hook consistency.
  if (!auth) {
    const errorState: FirebaseContextState = {
        areServicesAvailable: false,
        firebaseApp: null,
        firestore: null,
        auth: null,
        user: null,
        isUserLoading: false,
        userError: new Error("Auth service not provided."),
        userProfile: null,
        isProfileLoading: false,
    };
    return (
      <FirebaseContext.Provider value={errorState}>
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <p className="text-destructive">Firebase Auth not configured.</p>
        </div>
      </FirebaseContext.Provider>
    );
  }
  
  // If auth exists, we render the internal component which safely calls hooks.
  return <FirebaseProviderContent {...props}>{children}</FirebaseProviderContent>;
};



export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable) {
    const error = new Error('Firebase core services not available. Check FirebaseProvider props.');
    console.error(error.message, { context });
    throw error;
  }

  return {
    firebaseApp: context.firebaseApp!,
    firestore: context.firestore!,
    auth: context.auth!,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
    userProfile: context.userProfile,
    isProfileLoading: context.isProfileLoading,
  };
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

export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};
