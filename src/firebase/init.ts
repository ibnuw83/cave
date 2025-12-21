
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
// This function is ISOMORPHIC and can run on both server and client.
export function initializeFirebase() {
  if (!getApps().length) {
    // In a server environment where environment variables are directly available,
    // this would be the place to initialize, but for simplicity and to match
    // the current setup, we rely on the firebaseConfig object which is also isomorphic.
    return getSdks(initializeApp(firebaseConfig));
  }
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}
