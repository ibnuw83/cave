
'use client';
import {
    createContext,
    useContext,
    ReactNode,
} from 'react';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseApp } from 'firebase/app';
import { firebaseApp, auth, firestore } from '.';

type FirebaseContextValue = {
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
};

export const FirebaseContext = createContext<FirebaseContextValue | undefined>(
    undefined
);

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
    return (
        <FirebaseContext.Provider value={{ app: firebaseApp, auth, firestore }}>
            {children}
        </FirebaseContext.Provider>
    );
};

export const FirebaseClientProvider = ({ children }: { children: ReactNode }) => {
    return <FirebaseProvider>{children}</FirebaseProvider>;
};


export const useFirebase = (): FirebaseContextValue => {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useFirebase must be used within a FirebaseProvider');
    }
    return context;
}

export const useFirebaseApp = (): FirebaseApp => {
    return useFirebase().app;
};

export const useFirestore = (): Firestore => {
    return useFirebase().firestore;
};

export const useAuth = (): Auth => {
    return useFirebase().auth;
};
