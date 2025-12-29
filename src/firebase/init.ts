
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
  // If already initialized, return the existing instance.
  if (firebaseServices) {
    return firebaseServices;
  }
  
  // Build the config object inside the function to ensure env vars are loaded.
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  // Validate that all required environment variables are present.
  const isConfigured = !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  );

  const app = getApps().length ? getApp() : initializeApp(isConfigured ? firebaseConfig : {});

  firebaseServices = {
    firebaseApp: app,
    firestore: getFirestore(app),
    auth: getAuth(app),
    isConfigured: isConfigured,
  };
  
  return firebaseServices;
}
