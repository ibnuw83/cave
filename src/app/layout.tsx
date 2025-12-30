
'use client';

import './globals.css';
import Script from 'next/script';
import React, { createContext, useContext, ReactNode, useMemo, useEffect, useState, useCallback } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, onIdTokenChanged, User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { UserProfile } from '@/lib/types';
import { getUserProfileClient } from '@/lib/firestore-client';
import { Loader2 } from 'lucide-react';

// --- Firebase Service Context ---

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

const FirebaseContext = createContext<FirebaseServices | null>(null);

export const useFirebase = (): FirebaseServices => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within a FirebaseProvider.');
  return context;
};

export const useAuth = (): Auth => useFirebase().auth;
export const useFirestore = (): Firestore => useFirebase().firestore;
export const useFirebaseApp = (): FirebaseApp => useFirebase().firebaseApp;

// --- User Context ---

interface UserContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  isUserLoading: boolean;
  isProfileLoading: boolean;
  authError: Error | null;
  refreshUserProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export const useUser = (): UserContextValue => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};

const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const firebaseServices = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false); // Default to false
  const [authError, setAuthError] = useState<Error | null>(null);

  const fetchUserProfile = useCallback(async (firebaseUser: User | null) => {
    // Only fetch if there is a valid user object.
    if (!firebaseUser || !firebaseServices) {
      setUserProfile(null);
      setIsProfileLoading(false);
      return;
    }

    setIsProfileLoading(true);
    try {
      const profile = await getUserProfileClient(firebaseServices.firestore, firebaseUser.uid, {
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
      });
      setUserProfile(profile);
    } catch (err) {
      console.error("Failed to fetch or create user profile:", err);
      setAuthError(err as Error);
    } finally {
      setIsProfileLoading(false);
    }
  }, [firebaseServices]);

  useEffect(() => {
    if (!firebaseServices) return;
    
    const { auth } = firebaseServices;

    const unsub = onIdTokenChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsUserLoading(false);
      
      // Fetch profile only after user state is confirmed
      await fetchUserProfile(firebaseUser);

      // Handle session cookie management
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        fetch('/api/login', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => console.error("Session login failed:", err));
      } else {
        fetch('/api/logout', { method: 'POST' }).catch(err => console.error("Session logout failed:", err));
      }
    });

    return () => unsub();
  }, [firebaseServices, fetchUserProfile]);


  const refreshUserProfile = useCallback(async () => {
    if (!firebaseServices) return;
    const currentUser = firebaseServices.auth.currentUser;
    if (!currentUser) return;
    await currentUser.getIdToken(true);
    await fetchUserProfile(currentUser);
  }, [firebaseServices, fetchUserProfile]);

  const value = useMemo(() => ({
    user,
    userProfile,
    isUserLoading,
    isProfileLoading,
    authError,
    refreshUserProfile,
  }), [user, userProfile, isUserLoading, isProfileLoading, authError, refreshUserProfile]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// --- Combined Provider & Root Layout ---

function FirebaseErrorListener() {
  const { toast } = useToast();
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      if (error instanceof FirestorePermissionError) {
        toast({
          variant: 'destructive',
          title: 'Akses Ditolak',
          description: 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
        });
        console.warn('[PERMISSION DENIED]', { path: error.request.path });
      }
    };
    errorEmitter.on('permission-error', handleError);
    return () => errorEmitter.off('permission-error', handleError);
  }, [toast]);
  return null;
}

const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    const firebaseConfig = {
      apiKey: "AIzaSyCtd9HYSC9rbV72CrwJ8jNmpbni4GfQpxo",
      authDomain: "cave-57567.firebaseapp.com",
      projectId: "cave-57567",
      storageBucket: "cave-57567.appspot.com",
      messagingSenderId: "862428789556",
      appId: "1:862428789556:web:0941e0856737894942c361",
      measurementId: "G-7DTNV0C4ZV"
    };

    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    setServices({
      firebaseApp: app,
      firestore: getFirestore(app),
      auth: getAuth(app),
    });
  }, []);


  if (!services) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <FirebaseContext.Provider value={services}>
      <UserProvider>
        <FirebaseErrorListener />
        {children}
      </UserProvider>
    </FirebaseContext.Provider>
  );
};

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  const adSenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Rye&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2A2B32" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-status-bar" content="#2A2B32" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {adSenseClientId && (
          <Script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseClientId}`} crossOrigin="anonymous" strategy="afterInteractive" />
        )}
      </head>
      <body className="font-body antialiased">
        <FirebaseProvider>
          {children}
          <Toaster />
        </FirebaseProvider>
      </body>
    </html>
  );
}
