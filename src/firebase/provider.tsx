
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { initializeFirebase } from '@/firebase/init'; // UPDATED IMPORT
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

export const FirebaseContext = createContext<FirebaseServices | undefined>(undefined);

export const FirebaseClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // The initializeFirebase function is now isomorphic and can be called directly.
  const services = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseContext.Provider value={services}>
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

    
