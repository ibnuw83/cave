
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
  if (firebaseServices && typeof window !== 'undefined') {
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

  // IMPORTANT: This block should only run on the client-side.
  // We check for `window` to ensure we're not on the server.
  if (typeof window !== 'undefined') {
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      firebaseServices = {
        firebaseApp: app,
        firestore: getFirestore(app),
        auth: getAuth(app),
        isConfigured,
      };
      return firebaseServices;
  }

  // On the server, we return a "not configured" state for the client-side app.
  // The actual server-side admin logic is handled in `firebase/admin.ts`.
  return {
    firebaseApp: null as any,
    firestore: null as any,
    auth: null as any,
    isConfigured: false,
  };
}
