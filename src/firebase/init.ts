
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  isConfigured: boolean;
}

// A memoized instance of the Firebase services
let firebaseServices: FirebaseServices | null = null;

export function initializeFirebase(): FirebaseServices {
  // This check ensures that on the client side, initialization only happens once.
  if (typeof window !== 'undefined' && firebaseServices) {
    return firebaseServices;
  }
  
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  const isConfigured = !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  );

  // This function should only ever be called on the client,
  // but we keep this check for absolute safety.
  if (typeof window !== 'undefined') {
      if (!isConfigured) {
        console.error("Firebase config is not valid. Check your environment variables.");
        // Return a non-configured state to be handled by the provider
        return {
            firebaseApp: null as any,
            firestore: null as any,
            auth: null as any,
            isConfigured: false,
        };
      }
      
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      
      // Memoize the initialized services
      firebaseServices = {
        firebaseApp: app,
        firestore: getFirestore(app),
        auth: getAuth(app),
        isConfigured,
      };

      return firebaseServices;
  }

  // This part should ideally not be reached if the provider is set up correctly.
  // It acts as a fallback for server-side execution attempts.
  return {
    firebaseApp: null as any,
    firestore: null as any,
    auth: null as any,
    isConfigured: false,
  };
}
