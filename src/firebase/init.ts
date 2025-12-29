
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// This is the client-side config, now sourced from environment variables.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// A memoized instance of the Firebase services
let firebaseServices: FirebaseServices | null = null;

export function initializeFirebase(): FirebaseServices | null {
  // If already initialized, return the existing instance.
  if (firebaseServices) {
    return firebaseServices;
  }
  
  // Validate that all required environment variables are present.
  const requiredConfigValues = [
    firebaseConfig.apiKey,
    firebaseConfig.authDomain,
    firebaseConfig.projectId,
  ];

  if (requiredConfigValues.some(value => !value)) {
    // This will be caught by the FirebaseClientProvider to show a helpful error message.
    return null;
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  firebaseServices = {
    firebaseApp: app,
    firestore: getFirestore(app),
    auth: getAuth(app),
  };
  
  return firebaseServices;
}
