
import * as admin from 'firebase-admin';
import type { UserProfile, Spot } from './types';

// This is a simplified initialization. In a real project, consider how you manage service accounts.
if (!admin.apps.length) {
    try {
        // First, try to use service account from environment variable
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('Firebase Admin SDK initialized with service account from environment variable.');
        } else {
             // Fallback to Application Default Credentials
            admin.initializeApp();
            console.log('Firebase Admin SDK initialized with Application Default Credentials.');
        }
    } catch (e: any) {
        console.error('Failed to initialize Firebase Admin SDK:', e.message);
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
  try {
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) return null;
     const data = snap.data() as any;
     // The UID is the document ID, so it's not in the data payload.
    return { uid, ...data } as UserProfile;
  } catch (error) {
    console.error(`Failed to get user profile for ${uid}:`, error);
    return null;
  }
}
