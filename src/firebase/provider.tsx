
'use client';

import React, { createContext, useContext, ReactNode, useEffect, useMemo } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { initializeFirebase } from '@/firebase/init';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';
import { useToast } from '@/hooks/use-toast';

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
          console.warn('[PERMISSION DENIED]', {
            path: error.request,
          });
        }
    };
    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);
  return null;
}

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  isConfigured: boolean;
}

export const FirebaseContext = createContext<FirebaseServices | null>(null);

export const FirebaseClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Memoize the initialization to ensure it runs only once on the client.
  const services = useMemo(() => initializeFirebase(), []);

  if (!services.isConfigured) {
    // If initialization failed, render a helpful message instead of the app.
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#2A2B32', color: '#ACB9C9', minHeight: '100vh' }}>
        <h1 style={{ fontSize: '24px', color: '#E6B81C' }}>Konfigurasi Firebase Tidak Ditemukan</h1>
        <p>Aplikasi berjalan, tetapi tidak dapat terhubung ke Firebase.</p>
        <p>Untuk menggunakan fitur yang memerlukan database (seperti login, melihat lokasi, dll.), harap atur variabel lingkungan (environment variables) di platform hosting Anda (misalnya, Vercel).</p>
        <p>Anda perlu mengatur semua variabel yang dimulai dengan `NEXT_PUBLIC_FIREBASE_`.</p>
        <p>Setelah itu, Anda perlu men-deploy ulang aplikasi agar perubahan tersebut terbaca.</p>
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={services}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServices => {
  const context = useContext(FirebaseContext);

  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseClientProvider.');
  }
  
  return context;
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
