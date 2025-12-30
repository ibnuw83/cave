

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
  Firestore,
} from 'firebase/firestore';
import type { User, Auth } from 'firebase/auth';
import type { UserProfile, Location, Spot, KioskSettings, PricingTier, CaveMapNode } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// --- User Profile Functions ---

export async function getUserProfileClient(db: Firestore, uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.updatedAt instanceof Timestamp) {
        data.updatedAt = data.updatedAt.toDate();
      }
      return { id: docSnap.id, ...data } as UserProfile;
    }
    return null;
  } catch (error: any) {
     if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({ path: `/users/${uid}`, operation: 'get' });
        errorEmitter.emit('permission-error', permissionError);
    }
    throw error;
  }
}

export async function createUserProfile(db: Firestore, user: User, role: UserProfile['role'] = 'free'): Promise<UserProfile> {
    const userRef = doc(db, 'users', user.uid);

    const existingProfile = await getDoc(userRef);
    if (existingProfile.exists()) {
      return { id: user.uid, ...existingProfile.data() } as UserProfile;
    }
    
    const userProfileData: Omit<UserProfile, 'id' | 'updatedAt'> = {
      displayName: user.displayName || user.email?.split('@')[0] || 'Pengguna Baru',
      email: user.email,
      photoURL: user.photoURL,
      role: role,
      disabled: false,
    };

    try {
        await setDoc(userRef, { ...userProfileData, updatedAt: serverTimestamp() });
        const createdProfile: UserProfile = {
            id: user.uid,
            ...userProfileData,
            updatedAt: new Date(),
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
        throw error;
    }
}


export async function updateUserProfile(db: Firestore, uid: string, data: Partial<Pick<UserProfile, 'displayName' | 'photoURL'>>) {
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

// --- Location Functions ---

export async function getLocations(db: Firestore, includeInactive = false): Promise<Location[]> {
  const locationsRef = collection(db, 'locations');
  const q = includeInactive ? query(locationsRef) : query(locationsRef, where('isActive', '==', true));
  
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Location));
  } catch (error: any) {
     if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({ path: '/locations', operation: 'list' });
        errorEmitter.emit('permission-error', permissionError);
    }
    throw error;
  }
}

export async function getLocationClient(db: Firestore, id: string): Promise<Location | null> {
    const docRef = doc(db, 'locations', id);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Location;
        }
        return null;
    } catch (error: any) {
         if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({ path: `/locations/${id}`, operation: 'get' });
            errorEmitter.emit('permission-error', permissionError);
        }
        throw error;
    }
}

// --- Spot Functions ---

export async function getSpotsForLocation(db: Firestore, locationId: string): Promise<Spot[]> {
  const spotsRef = collection(db, 'spots');
  // The orderBy clause is removed to prevent requiring a composite index.
  // Sorting should be handled on the client-side after fetching.
  const q = query(spotsRef, where('locationId', '==', locationId));
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Spot));
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      const permissionError = new FirestorePermissionError({ path: `/spots`, operation: 'list' });
      errorEmitter.emit('permission-error', permissionError);
    }
    throw error;
  }
}

export async function updateLocationMiniMapWithSpot(db: Firestore, spot: Spot, allSpotsInLocation: Spot[]) {
  const locationRef = doc(db, 'locations', spot.locationId);

  try {
    const locationSnap = await getDoc(locationRef);
    if (!locationSnap.exists()) throw new Error('Location not found');

    const locationData = locationSnap.data() as Location;
    const miniMap = locationData.miniMap ?? { nodes: [], edges: [] };

    let nodeExists = miniMap.nodes.some(n => n.id === spot.id);
    if (!nodeExists) {
      const newNode: CaveMapNode = { id: spot.id, label: spot.title, x: 50, y: 50 };
      miniMap.nodes.push(newNode);
    } else {
        miniMap.nodes = miniMap.nodes.map(n => n.id === spot.id ? { ...n, label: spot.title } : n);
    }

    const sortedSpots = [...allSpotsInLocation.filter(s => s.id !== spot.id), spot].sort((a,b) => a.order - b.order);
    const currentIndex = sortedSpots.findIndex(s => s.id === spot.id);
    
    if (currentIndex > 0) {
      const prevSpot = sortedSpots[currentIndex - 1];
      const edgeExists = miniMap.edges.some(e => (e.from === prevSpot.id && e.to === spot.id) || (e.from === spot.id && e.to === prevSpot.id));
      if (!edgeExists) {
        miniMap.edges.push({ from: prevSpot.id, to: spot.id });
      }
    }

    await updateDoc(locationRef, { miniMap });

  } catch (error) {
    console.error("Failed to update minimap:", error);
  }
}


export async function getSpotClient(db: Firestore, id: string): Promise<Spot | null> {
  const docRef = doc(db, 'spots', id);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Spot;
    }
    return null;
  } catch(error: any) {
      if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({ path: `/spots/${id}`, operation: 'get' });
            errorEmitter.emit('permission-error', permissionError);
      }
      throw error;
  }
}


// --- Kiosk Settings Functions ---

const KIOSK_SETTINGS_ID = 'main';

export async function getKioskSettings(db: Firestore): Promise<KioskSettings | null> {
  const docRef = doc(db, 'kioskSettings', KIOSK_SETTINGS_ID);
   try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as KioskSettings;
    }
    return null;
  } catch (error: any) {
    if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({ path: `/kioskSettings/${KIOSK_SETTINGS_ID}`, operation: 'get' });
        errorEmitter.emit('permission-error', permissionError);
    }
    throw error;
  }
}

export async function saveKioskSettings(db: Firestore, settings: Partial<KioskSettings>) {
    const docRef = doc(db, 'kioskSettings', KIOSK_SETTINGS_ID);
    try {
        await setDoc(docRef, settings, { merge: true });
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({ path: '/kioskSettings/main', operation: 'update', requestResourceData: settings });
            errorEmitter.emit('permission-error', permissionError);
        }
        throw error;
    }
}

// --- Kiosk Control Functions (Admin only) ---
export async function setKioskControl(db: Firestore, control: any) {
    const docRef = doc(db, 'kioskControl', 'global');
    try {
        await setDoc(docRef, control, { merge: true });
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({ path: '/kioskControl/global', operation: 'update', requestResourceData: control });
            errorEmitter.emit('permission-error', permissionError);
        }
        throw error;
    }
}

// --- Pricing Tier Functions ---

export async function getPricingTiers(db: Firestore): Promise<PricingTier[]> {
    const tiersRef = collection(db, 'pricingTiers');
    const q = query(tiersRef, orderBy('order', 'asc'));
    try {
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PricingTier));
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: '/pricingTiers', operation: 'list' }));
        }
        throw error;
    }
}

export async function setPricingTier(db: Firestore, tier: PricingTier): Promise<void> {
    const tierRef = doc(db, 'pricingTiers', tier.id);
    try {
        await setDoc(tierRef, tier, { merge: true });
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `/pricingTiers/${tier.id}`, operation: 'update', requestResourceData: tier }));
        }
        throw error;
    }
}

export async function deletePricingTier(db: Firestore, tierId: string): Promise<void> {
    const tierRef = doc(db, 'pricingTiers', tierId);
    try {
        await deleteDoc(tierRef);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `/pricingTiers/${tierId}`, operation: 'delete' }));
        }
        throw error;
    }
}

// --- Kiosk Analytics Functions ---
export async function trackKioskSpotView(db: Firestore, locationId: string, spotId: string): Promise<void> {
    const statRef = doc(db, 'kioskStats', locationId);
    const data = {
        spots: { [spotId]: increment(1) },
        updatedAt: serverTimestamp()
    };
    try {
        await setDoc(statRef, data, { merge: true });
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `/kioskStats/${locationId}`, operation: 'update', requestResourceData: data }));
        }
        console.warn(`Failed to track kiosk view for spot ${spotId}:`, error.message);
    }
}
