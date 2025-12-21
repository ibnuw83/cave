import { safeGetAdminApp } from '@/firebase/admin';
import { Location, Spot } from './types';

// This function now uses safeGetAdminApp to avoid crashing if the Admin SDK isn't initialized.
const getDb = () => {
    const app = safeGetAdminApp();
    if (!app) {
        console.warn(`[Firestore Server] Firebase Admin SDK is not available. Server-side data fetching is disabled.`);
    }
    return app?.db;
}

export async function getLocations(includeInactive = false): Promise<Location[]> {
    const db = getDb();
    if (!db) return [];
    
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('locations');

    if (!includeInactive) {
        query = query.where('isActive', '==', true);
    }
    
    const snapshot = await query.get();
    if (snapshot.empty) {
        return [];
    }
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
}

export async function getLocation(id: string): Promise<Location | null> {
    const db = getDb();
    if (!db) return null;
    
    const docRef = db.collection('locations').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        return null;
    }

    return { id: docSnap.id, ...docSnap.data() } as Location;
}

export async function getSpots(locationId: string): Promise<Spot[]> {
    const db = getDb();
    if (!db) return [];

    const spotsRef = db.collection('spots');
    const q = spotsRef.where('locationId', '==', locationId);
    const querySnapshot = await q.get();
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Spot));
}

export async function getSpotClient(id: string): Promise<Spot | null> {
  const db = getDb();
  if (!db) return null;

  const docRef = db.collection('spots').doc(id);
  const docSnap = await docRef.get();
  if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as Spot;
  }
  return null;
}
