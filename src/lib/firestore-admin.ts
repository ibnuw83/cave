
import { safeGetAdminApp } from '@/firebase/admin';
import type { Location, Spot, KioskSettings } from './types';
import * as admin from 'firebase-admin';

export async function getSpot(spotId: string): Promise<Spot | null> {
  const services = safeGetAdminApp();
  if (!services) return null;
  const { db } = services;

  const spotRef = db.collection('spots').doc(spotId);
  const docSnap = await spotRef.get();
  if (docSnap.exists) {
    return { id: docSnap.id, ...docSnap.data() } as Spot;
  }
  return null;
}


export async function getKioskSettings(): Promise<KioskSettings | null> {
  const services = safeGetAdminApp();
  if (!services) return null;
  const { db } = services;

  const docRef = db.collection('kioskSettings').doc('main');
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    return { id: docSnap.id, ...docSnap.data() } as KioskSettings;
  }
  return null;
}
