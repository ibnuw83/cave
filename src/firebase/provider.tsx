'use client';

// Guard untuk memastikan komponen ini tidak pernah dirender di server.
if (typeof window === 'undefined') {
  throw new Error('FirebaseClientProvider must only run on the client');
}

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
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
}

// Initialize Firebase services once when the module is loaded.
// This creates a stable, singleton instance.
const firebaseServices = initializeFirebase();

export const FirebaseContext = createContext<FirebaseServices | undefined>(undefined);

export const FirebaseClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <FirebaseContext.Provider value={firebaseServices}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServices => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
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

    