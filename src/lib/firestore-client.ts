'use client';

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
import { initializeFirebase } from '@/firebase'; // Menggunakan inisialisasi terpusat
import type { UserProfile, Location, Spot, KioskSettings, PricingTier } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// HANYA MENGGUNAKAN SATU INSTANCE DB DARI INISIALISASI PUSAT
const { firestore: db } = initializeFirebase();

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
    const userProfileData: Omit<UserProfile, 'id' | 'updatedAt' | 'role'> = {
      displayName: user.displayName || user.email?.split('@')[0] || 'Pengguna Baru',
      email: user.email,
      photoURL: user.photoURL,
    };
    const userRef = doc(db, 'users', user.uid);

    try {
        const userDataWithRole = { ...userProfileData, role: 'free' as const, updatedAt: serverTimestamp() };
        await setDoc(userRef, userDataWithRole, { merge: true });
        const createdProfile: UserProfile = {
            id: user.uid,
            ...userProfileData,
            role: 'free',
            updatedAt: new Date(), // Use local date for immediate feedback
        } as UserProfile
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
    return updateDoc(userRef, dataToUpdate).catch(error => {
      if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: `/users/${uid}`,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
      }
      throw error;
    });
}


export async function getAllUsersAdmin(): Promise<UserProfile[]> {
  const usersRef = collection(db, 'users');
  try {
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as UserProfile));
  } catch (error: any) {
    if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: '/users',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
     throw error;
  }
}

export async function updateUserRole(uid: string, role: UserProfile['role']) {
  const userRef = doc(db, 'users', uid);
  const dataToUpdate = { role, updatedAt: serverTimestamp() };

  try {
    await updateDoc(userRef, dataToUpdate);
  } catch (error: any) {
    if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: `/users/${uid}`,
            operation: 'update',
            requestResourceData: { role },
        });
        errorEmitter.emit('permission-error', permissionError);
    }
    // Re-throw the error so the calling function knows it failed
    throw error;
  }
}

// --- Location Functions (Client-Side) ---

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

export function addLocation(locationData: Omit<Location, 'id'>): Promise<string> {
    return new Promise((resolve, reject) => {
        addDoc(collection(db, 'locations'), locationData)
            .then(docRef => {
                resolve(docRef.id);
            })
            .catch(error => {
                if (error.code === 'permission-denied') {
                    const permissionError = new FirestorePermissionError({
                        path: '/locations',
                        operation: 'create',
                        requestResourceData: locationData,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                }
                reject(error);
            });
    });
}

export function updateLocation(id: string, locationData: Partial<Omit<Location, 'id'>>) {
    const docRef = doc(db, 'locations', id);
    updateDoc(docRef, locationData).catch((error) => {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `/locations/${id}`,
                operation: 'update',
                requestResourceData: locationData,
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    });
}


export async function deleteLocation(id: string): Promise<void> {
  const locationDocRef = doc(db, 'locations', id);
  const spotsQuery = query(collection(db, 'spots'), where('locationId', '==', id));
  
  const batch = writeBatch(db);
  
  try {
    const spotsSnapshot = await getDocs(spotsQuery);
    spotsSnapshot.forEach(spotDoc => {
        batch.delete(spotDoc.ref);
    });
    batch.delete(locationDocRef);
    await batch.commit();
  } catch (error: any) {
      if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `/locations/${id} and associated spots`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
      }
      throw error;
  }
}


// --- Spot Functions (Client-Side) ---

export async function getAllSpotsForAdmin(): Promise<Spot[]> {
  const spotsRef = collection(db, 'spots');
  try {
    const querySnapshot = await getDocs(spotsRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Spot));
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      const permissionError = new FirestorePermissionError({
        path: '/spots',
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
    }
    throw error;
  }
}


export async function getSpotsClient(locationId: string): Promise<Spot[]> {
  const spotsRef = collection(db, 'spots');
  const q = query(
    spotsRef,
    where('locationId', '==', locationId)
  );
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Spot));
  } catch(error: any) {
    if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: `/spots where locationId==${locationId}`,
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

export function addSpot(spotData: Omit<Spot, 'id'>): Promise<string> {
    return new Promise((resolve, reject) => {
        addDoc(collection(db, 'spots'), spotData)
            .then(docRef => {
                resolve(docRef.id);
            })
            .catch(error => {
                if (error.code === 'permission-denied') {
                    const permissionError = new FirestorePermissionError({
                        path: '/spots',
                        operation: 'create',
                        requestResourceData: spotData,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                }
                reject(error);
            });
    });
}

export function updateSpot(id: string, spotData: Partial<Omit<Spot, 'id'>>) {
  const docRef = doc(db, 'spots', id);
  updateDoc(docRef, spotData).catch((error) => {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `/spots/${id}`,
                operation: 'update',
                requestResourceData: spotData,
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    });
}

export function deleteSpot(id: string) {
  const docRef = doc(db, 'spots', id);
  deleteDoc(docRef).catch((error) => {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `/spots/${id}`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    });
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

export function saveKioskSettings(settings: Partial<KioskSettings>) {
    const docRef = doc(db, 'kioskSettings', KIOSK_SETTINGS_ID);
    setDoc(docRef, settings, { merge: true }).catch((error) => {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: '/kioskSettings/main',
                operation: 'update',
                requestResourceData: settings,
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    });
}

// --- Kiosk Control Functions (Admin only) ---
export function setKioskControl(control: any) {
    const docRef = doc(db, 'kioskControl', 'global');
    setDoc(docRef, control, { merge: true }).catch((error) => {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: '/kioskControl/global',
                operation: 'update',
                requestResourceData: control,
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    });
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

    