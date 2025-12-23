
import { adminDb } from '@/firebase/admin';
import type { Location, Spot, UserProfile, KioskSettings, PricingTier } from './types';

// --- Location Functions (Server-Side) ---

export async function getLocations(includeInactive = false): Promise<Location[]> {
  try {
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = adminDb.collection('locations');
    if (!includeInactive) {
      query = query.where('isActive', '==', true);
    }
    const snapshot = await query.get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
  } catch (error) {
    console.error('[Firestore Admin] Error fetching locations:', error);
    throw error; // Re-throw to be caught by the page
  }
}

export async function getLocation(id: string): Promise<Location | null> {
  try {
    const docRef = adminDb.collection('locations').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.warn(`[Firestore Admin] Document not found at path: locations/${id}`);
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() } as Location;
  } catch (error) {
    console.error(`[Firestore Admin] Error fetching location ${id}:`, error);
    throw error; // Re-throw to be caught by the page
  }
}

// --- Spot Functions (Server-Side) ---

export async function getSpotsForLocation(locationId: string): Promise<Spot[]> {
  try {
    const spotsRef = adminDb.collection('spots');
    const snapshot = await spotsRef.where('locationId', '==', locationId).get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Spot));
  } catch (error) {
    console.error(`[Firestore Admin] Error fetching spots for location ${locationId}:`, error);
    throw error;
  }
}

export async function getSpot(id: string): Promise<Spot | null> {
  try {
    const docRef = adminDb.collection('spots').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      console.warn(`[Firestore Admin] Document not found at path: spots/${id}`);
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() } as Spot;
  } catch (error) {
    console.error(`[Firestore Admin] Error fetching spot ${id}:`, error);
    throw error;
  }
}

// --- Kiosk & Pricing Functions (Server-Side) ---
export async function getKioskSettings(): Promise<KioskSettings | null> {
  try {
    const docRef = adminDb.collection('kioskSettings').doc('main');
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() } as KioskSettings;
  } catch (error) {
    console.error('[Firestore Admin] Error fetching kiosk settings:', error);
    throw error;
  }
}

export async function getPricingTiers(): Promise<PricingTier[]> {
  try {
    const tiersRef = adminDb.collection('pricingTiers');
    const snapshot = await tiersRef.orderBy('order', 'asc').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PricingTier));
  } catch (error) {
    console.error('[Firestore Admin] Error fetching pricing tiers:', error);
    throw error;
  }
}


// --- User Management Functions (Server-Side for API routes) ---

export async function getAllUsersAdmin(): Promise<UserProfile[]> {
    const snapshot = await adminDb.collection('users').get();
    const users: UserProfile[] = [];
    snapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() } as UserProfile);
    });
    return users;
}

export async function createUserAdmin(data: { email: string, password?: string, displayName: string, role: UserProfile['role'] }) {
    const { email, password, displayName, role } = data;

    const userRecord = await (await import('@/firebase/admin')).adminAuth.createUser({
        email,
        password,
        displayName,
    });

    await adminDb.collection('users').doc(userRecord.uid).set({
        email,
        displayName,
        role,
        updatedAt: new Date(),
    });

    return userRecord;
}


export async function updateUserStatusAdmin(uid: string, disabled: boolean): Promise<void> {
    await (await import('@/firebase/admin')).adminAuth.updateUser(uid, { disabled });
}

export async function deleteUserAdmin(uid: string): Promise<void> {
  const adminAuth = (await import('@/firebase/admin')).adminAuth;
  const batch = adminDb.batch();
  
  // Delete from Auth
  await adminAuth.deleteUser(uid);
  
  // Delete from Firestore
  const userDocRef = adminDb.collection('users').doc(uid);
  batch.delete(userDocRef);
  
  await batch.commit();
}
