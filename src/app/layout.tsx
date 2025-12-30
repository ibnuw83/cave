
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
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);

  const fetchUserProfile = useCallback(async (firebaseUser: User) => {
    if (!firebaseServices) return;
    setIsProfileLoading(true);
    try {
      const profile = await getUserProfileClient(firebaseServices.firestore, firebaseUser.uid);
      if (profile) {
        setUserProfile(profile);
      } else {
        console.error(`Profile not found for UID: ${firebaseUser.uid}. Logging out.`);
        setAuthError(new Error("User profile does not exist."));
        await firebaseServices.auth.signOut();
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      setAuthError(err as Error);
      await firebaseServices.auth.signOut();
    } finally {
      setIsProfileLoading(false);
    }
  }, [firebaseServices]);

  useEffect(() => {
    if (!firebaseServices) return;
    
    const { auth } = firebaseServices;

    const unsub = onIdTokenChanged(auth, async (firebaseUser) => {
      setIsUserLoading(false);
      if (!firebaseUser) {
        setUser(null);
        setUserProfile(null);
        setIsProfileLoading(false);
        const response = await fetch('/api/logout', { method: 'POST' });
        if (!response.ok) {
          console.error("Failed to clear session cookie on logout.");
        }
      } else {
        setUser(firebaseUser);
        const token = await firebaseUser.getIdToken();
        await fetch('/api/login', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        await fetchUserProfile(firebaseUser);
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
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    };

    const configured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

    if (configured) {
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      setServices({
        firebaseApp: app,
        firestore: getFirestore(app),
        auth: getAuth(app),
      });
    } else {
      setIsConfigured(false);
    }
  }, []);


  if (!isConfigured) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#2A2B32', color: '#ACB9C9', minHeight: '100vh', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', color: '#E6B81C' }}>Konfigurasi Firebase Tidak Ditemukan</h1>
          <p>Aplikasi berjalan, tetapi tidak dapat terhubung ke Firebase.</p>
          <p>Untuk menggunakan fitur yang memerlukan database, harap atur variabel lingkungan di platform hosting Anda (misalnya, Vercel).</p>
          <p>Anda perlu mengatur semua variabel yang dimulai dengan `NEXT_PUBLIC_FIREBASE_`.</p>
          <p>Setelah itu, Anda perlu men-deploy ulang aplikasi agar perubahan tersebut terbaca.</p>
        </div>
      </div>
    );
  }
  
  if (!services) {
    // While services are being initialized, show a loader.
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
