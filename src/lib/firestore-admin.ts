
import { safeGetAdminApp } from '@/firebase/admin';
import type { Location, Spot, KioskSettings } from './types';
import * as admin from 'firebase-admin';

const adminApp = safeGetAdminApp();
const adminDb = admin.firestore(adminApp);

export async function getSpot(spotId: string): Promise<Spot | null> {
  const spotRef = adminDb.collection('spots').doc(spotId);
  const docSnap = await spotRef.get();
  if (docSnap.exists) {
    return { id: docSnap.id, ...docSnap.data() } as Spot;
  }
  return null;
}


export async function getKioskSettings(): Promise<KioskSettings | null> {
  const docRef = adminDb.collection('kioskSettings').doc('main');
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    return { id: docSnap.id, ...docSnap.data() } as KioskSettings;
  }
  return null;
}
