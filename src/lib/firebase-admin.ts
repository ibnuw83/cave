
import * as admin from 'firebase-admin';
import type { UserProfile, Spot } from './types';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else if (process.env.NODE_ENV === 'development') {
    // In development without a service account, use application default credentials.
    // This requires `gcloud auth application-default login` to be run.
    console.log('Initializing Firebase Admin SDK with Application Default Credentials...');
    admin.initializeApp();
  } else {
    // In production, rely on the environment automatically providing credentials.
    admin.initializeApp();
  }
}

export const auth = admin.auth();
export const db = admin.firestore();


// --- Admin (Server-Side) Functions ---

export async function getSpotAdmin(id: string): Promise<Spot | null> {
  const snap = await db.collection('spots').doc(id).get();
  if (!snap.exists) return null;
  // Note: Timestamps will be Firebase Admin Timestamps, need to be handled if used on client
  const data = snap.data() as any;
  return { id: snap.id, ...data };
}

export async function getUserProfileAdmin(uid: string): Promise<UserProfile | null> {
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists) return null;
   const data = snap.data() as any;
  return { uid: snap.id, ...data };
}
