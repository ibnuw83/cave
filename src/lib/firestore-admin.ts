
import { adminDb } from '@/firebase/admin';
import type { Location, Spot, UserProfile, KioskSettings, PricingTier } from './types';
import { getAuth } from 'firebase-admin/auth';

// --- Location Functions ---

export async function getLocations(includeInactive = false): Promise<Location[]> {
  const locationsRef = adminDb.collection('locations');
  const q = includeInactive ? locationsRef : locationsRef.where('isActive', '==', true);
  try {
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
  } catch (error) {
    console.error('[Firestore Admin] CRITICAL: Error fetching locations. Path: /locations', error);
    throw new Error('Gagal mengambil data lokasi dari server.');
  }
}

export async function getLocation(id: string): Promise<Location | null> {
  const docRef = adminDb.collection('locations').doc(id);
  try {
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as Location;
    }
    console.warn(`[Firestore Admin] Document not found at path: locations/${id}`);
    return null;
  } catch (error) {
    console.error(`[Firestore Admin] CRITICAL: Error fetching location. Path: /locations/${id}`, error);
    throw new Error(`Gagal mengambil data lokasi ${id} dari server.`);
  }
}

// --- Spot Functions ---

export async function getSpotsForLocation(locationId: string): Promise<Spot[]> {
  const spotsRef = adminDb.collection('spots');
  const q = spotsRef.where('locationId', '==', locationId);
  try {
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Spot));
  } catch (error) {
    console.error(`[Firestore Admin] CRITICAL: Error fetching spots for location ${locationId}. Path: /spots`, error);
    throw new Error(`Gagal mengambil data spot untuk lokasi ${locationId} dari server.`);
  }
}

export async function getSpot(id: string): Promise<Spot | null> {
  const docRef = adminDb.collection('spots').doc(id);
  try {
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as Spot;
    }
    console.warn(`[Firestore Admin] Document not found at path: spots/${id}`);
    return null;
  } catch (error) {
    console.error(`[Firestore Admin] CRITICAL: Error fetching spot. Path: /spots/${id}`, error);
    throw new Error(`Gagal mengambil data spot ${id} dari server.`);
  }
}

// --- User Functions ---

export async function getAllUsersAdmin(): Promise<UserProfile[]> {
    const userRecords = await getAuth().listUsers();
    const users: UserProfile[] = await Promise.all(
        userRecords.users.map(async (user) => {
            const userDoc = await adminDb.collection('users').doc(user.uid).get();
            const userProfile: UserProfile = {
                id: user.uid,
                email: user.email || null,
                displayName: user.displayName || null,
                photoURL: user.photoURL || null,
                role: 'free', // default
                disabled: user.disabled,
                updatedAt: new Date(user.metadata.lastSignInTime || user.metadata.creationTime),
            };
            if (userDoc.exists) {
                const docData = userDoc.data();
                userProfile.role = docData?.role || 'free';
            }
            return userProfile;
        })
    );
    return users;
}

export async function createLocation(data: Omit<Location, 'id' | 'miniMap'>): Promise<Location> {
    const dataToSave = {
      ...data,
      miniMap: { nodes: [], edges: [] }
    };
    const docRef = await adminDb.collection('locations').add(dataToSave);
    return { id: docRef.id, ...dataToSave };
}

export async function updateLocation(id: string, data: Partial<Location>): Promise<void> {
    const docRef = adminDb.collection('locations').doc(id);
    await docRef.update({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
}

export async function deleteLocation(id: string): Promise<void> {
    const batch = adminDb.batch();
    const locationRef = adminDb.collection('locations').doc(id);
    
    batch.delete(locationRef);

    const spotsQuery = adminDb.collection('spots').where('locationId', '==', id);
    const spotsSnapshot = await spotsQuery.get();
    spotsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
}


export async function getAllSpots(): Promise<Spot[]> {
  const spotsSnapshot = await adminDb.collection('spots').get();
  return spotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Spot));
}


export async function createSpot(data: Omit<Spot, 'id'>): Promise<Spot> {
    const docRef = await adminDb.collection('spots').add(data);
    return { id: docRef.id, ...data };
}

export async function updateSpot(id: string, data: Partial<Spot>): Promise<void> {
    const docRef = adminDb.collection('spots').doc(id);
    await docRef.update({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
}

export async function deleteSpot(id: string): Promise<void> {
    const docRef = adminDb.collection('spots').doc(id);
    await docRef.delete();
}

export async function createUserAdmin(data: { email: string, password?: string, displayName: string, role: UserProfile['role'] }) {
    const userRecord = await getAuth().createUser({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        emailVerified: true,
    });
    
    await adminDb.collection('users').doc(userRecord.uid).set({
        displayName: data.displayName,
        email: data.email,
        role: data.role,
        photoURL: userRecord.photoURL || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return userRecord;
}

export async function updateUserStatusAdmin(uid: string, disabled: boolean) {
    await getAuth().updateUser(uid, { disabled });
}

export async function deleteUserAdmin(uid: string) {
    await getAuth().deleteUser(uid);
    await adminDb.collection('users').doc(uid).delete();
}

// --- Settings & Tiers Functions ---

export async function getKioskSettings(): Promise<KioskSettings | null> {
  const docRef = adminDb.collection('kioskSettings').doc('main');
   try {
    const docSnap = await docRef.get();
    if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() } as KioskSettings;
    }
    return null;
  } catch (error) {
    console.error(`[Firestore Admin] CRITICAL: Error fetching kiosk settings.`, error);
    throw new Error('Gagal mengambil pengaturan kios dari server.');
  }
}

export async function getPricingTiers(): Promise<PricingTier[]> {
    const tiersRef = adminDb.collection('pricingTiers');
    const q = tiersRef.orderBy('order', 'asc');
    try {
        const querySnapshot = await q.get();
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PricingTier));
    } catch (error) {
       console.error(`[Firestore Admin] CRITICAL: Error fetching pricing tiers.`, error);
       throw new Error('Gagal mengambil paket harga dari server.');
    }
}
