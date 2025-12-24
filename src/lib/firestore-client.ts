
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
  orderBy,
  increment,
  Timestamp,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { initializeFirebase } from '@/firebase/init';
import type { UserProfile, Location, Spot, KioskSettings, PricingTier } from '../types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { getAuth } from 'firebase/auth';

// HANYA MENGGUNAKAN SATU INSTANCE DB DARI INISIALISASI PUSAT
const { firestore: db, auth } = initializeFirebase();

// --- User Profile Functions (Client-Side) ---

export async function getUserProfileClient(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Convert Firestore Timestamp to Date for client-side usage
      if (data.updatedAt instanceof Timestamp) {
        data.updatedAt = data.updatedAt.toDate();
      }
      return { id: docSnap.id, ...data } as UserProfile;
    }
    return null;
  } catch (error: any) {
     if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: `/users/${uid}`,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
    throw error;
  }
}

export async function createUserProfile(user: User): Promise<UserProfile> {
    const userProfileData: Omit<UserProfile, 'id' | 'updatedAt'> = {
      displayName: user.displayName || user.email?.split('@')[0] || 'Pengguna Baru',
      email: user.email,
      photoURL: user.photoURL,
      role: 'free' as const,
      disabled: false,
    };
    const userRef = doc(db, 'users', user.uid);

    try {
        await setDoc(userRef, { ...userProfileData, updatedAt: serverTimestamp() }, { merge: true });
        
        // After setting, we return a client-side object with a local date
        const createdProfile: UserProfile = {
            id: user.uid,
            ...userProfileData,
            updatedAt: new Date(), // Use local date for immediate feedback
        };
        return createdProfile;
    } catch (error: any) {
         if (error.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: `/users/${user.uid}`,
            operation: 'create',
            requestResourceData: userProfileData,
          });
          errorEmitter.emit('permission-error', permissionError);
        }
        // Re-throw to be caught by the caller
        throw error;
    }
}


export async function updateUserProfile(uid: string, data: Partial<Pick<UserProfile, 'displayName' | 'photoURL'>>) {
    const userRef = doc(db, 'users', uid);
    const dataToUpdate = { ...data, updatedAt: serverTimestamp() };
    try {
        await updateDoc(userRef, dataToUpdate);
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: `/users/${uid}`,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
      }
      throw error;
    }
}

export async function updateUserRole(uid: string, role: UserProfile['role']) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Authentication required.");
  
  const token = await currentUser.getIdToken();
  
  const response = await fetch('/api/admin/users/role', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ uid, role })
  });

  if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update user role.');
  }

  // After a successful server update, the client should refresh its token
  // to get the new claims. This is handled in the component calling this function.
}

// --- Location Functions (Client-Side for Admin Panel & Public View) ---

export async function getLocations(includeInactive = false): Promise<Location[]> {
  const locationsRef = collection(db, 'locations');
  const q = includeInactive ? query(locationsRef) : query(locationsRef, where('isActive', '==', true));
  
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Location));
  } catch (error: any) {
     if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: '/locations',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
    throw error;
  }
}

export async function getLocationClient(id: string): Promise<Location | null> {
    const docRef = doc(db, 'locations', id);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Location;
        }
        return null;
    } catch (error: any) {
         if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `/locations/${id}`,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        throw error;
    }
}

// --- Spot Functions (Client-Side) ---

export async function getSpotsForLocation(locationId: string): Promise<Spot[]> {
  const spotsRef = collection(db, 'spots');
  const q = query(spotsRef, where('locationId', '==', locationId));
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Spot));
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      const permissionError = new FirestorePermissionError({
        path: `/spots`, // Simplified path for query
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
    }
    throw error;
  }
}


export async function getSpotClient(id: string): Promise<Spot | null> {
  const docRef = doc(db, 'spots', id);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Spot;
    }
    return null;
  } catch(error: any) {
      if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `/spots/${id}`,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
      }
      throw error;
  }
}


// --- Kiosk Settings Functions ---

const KIOSK_SETTINGS_ID = 'main';

export async function getKioskSettings(): Promise<KioskSettings | null> {
  const docRef = doc(db, 'kioskSettings', KIOSK_SETTINGS_ID);
   try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as KioskSettings;
    }
    return null;
  } catch (error: any) {
    if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: `/kioskSettings/${KIOSK_SETTINGS_ID}`,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
    throw error;
  }
}

export async function saveKioskSettings(settings: Partial<KioskSettings>) {
    const docRef = doc(db, 'kioskSettings', KIOSK_SETTINGS_ID);
    try {
        await setDoc(docRef, settings, { merge: true });
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: '/kioskSettings/main',
                operation: 'update',
                requestResourceData: settings,
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        throw error;
    }
}

// --- Kiosk Control Functions (Admin only) ---
export async function setKioskControl(control: any) {
    const docRef = doc(db, 'kioskControl', 'global');
    try {
        await setDoc(docRef, control, { merge: true });
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: '/kioskControl/global',
                operation: 'update',
                requestResourceData: control,
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        throw error;
    }
}

// --- Pricing Tier Functions ---

export async function getPricingTiers(): Promise<PricingTier[]> {
    const tiersRef = collection(db, 'pricingTiers');
    const q = query(tiersRef, orderBy('order', 'asc'));
    try {
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PricingTier));
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: '/pricingTiers',
                operation: 'list',
            }));
        }
        throw error;
    }
}

export async function setPricingTier(tier: PricingTier): Promise<void> {
    const tierRef = doc(db, 'pricingTiers', tier.id);
    try {
        await setDoc(tierRef, tier, { merge: true });
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `/pricingTiers/${tier.id}`,
                operation: 'update',
                requestResourceData: tier,
            }));
        }
        throw error;
    }
}

export async function deletePricingTier(tierId: string): Promise<void> {
    const tierRef = doc(db, 'pricingTiers', tierId);
    try {
        await deleteDoc(tierRef);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `/pricingTiers/${tierId}`,
                operation: 'delete',
            }));
        }
        throw error;
    }
}

// --- Kiosk Analytics Functions ---
export async function trackKioskSpotView(locationId: string, spotId: string): Promise<void> {
    const statRef = doc(db, 'kioskStats', locationId);
    const data = {
        spots: {
            [spotId]: increment(1)
        },
        updatedAt: serverTimestamp()
    };
    try {
        await setDoc(statRef, data, { merge: true });
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `/kioskStats/${locationId}`,
                operation: 'update',
                requestResourceData: data,
            }));
        }
        // Don't re-throw, as this is a background task
        console.warn(`Failed to track kiosk view for spot ${spotId}:`, error.message);
    }
}


    
