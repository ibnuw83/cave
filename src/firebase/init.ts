import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

export function initializeFirebase() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  return {
    firebaseApp: app,
    firestore: getFirestore(app),
    auth: getAuth(app),
  };
}
