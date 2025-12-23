import { adminDb } from '@/firebase/admin';
import type { KioskSettings, Location, Spot, PricingTier } from './types';

export async function getKioskSettings(): Promise<KioskSettings | null> {
  const docRef = adminDb.collection('kioskSettings').doc('main');
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    return { id: docSnap.id, ...docSnap.data() } as KioskSettings;
  }
  return null;
}

export async function getLocations(): Promise<Location[]> {
  const snapshot = await adminDb.collection('locations').where('isActive', '==', true).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
}

export async function getLocation(id: string): Promise<Location | null> {
  try {
    const docRef = adminDb.collection('locations').doc(id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as Location;
    }
    return null;
  } catch (error) {
    console.error(`[firestore-admin] Failed to get location ${id}:`, error);
    // Returning null will lead to a 404 page, which is appropriate.
    return null;
  }
}

export async function getSpotsForLocation(locationId: string): Promise<Spot[]> {
  const snapshot = await adminDb.collection('spots').where('locationId', '==', locationId).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Spot));
}


export async function getSpot(id: string): Promise<Spot | null> {
    try {
        const docRef = adminDb.collection('spots').doc(id);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            return { id: docSnap.id, ...docSnap.data() } as Spot;
        }
        return null;
    } catch (error) {
        console.error(`[firestore-admin] Failed to get spot ${id}:`, error);
        return null;
    }
}
