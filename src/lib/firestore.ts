
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
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import type { UserProfile, Cave, Spot, KioskSettings } from './types';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';


// --- User Profile Functions ---

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return { uid, ...docSnap.data() } as UserProfile;
    }
  } catch (error: any) {
     if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: `/users/${uid}`,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
    console.error("Error getting user profile:", error);
  }
  return null;
}

export async function createUserProfile(user: User): Promise<UserProfile> {
  const userProfileData: Omit<UserProfile, 'uid'> = {
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: 'free',
    updatedAt: serverTimestamp(),
  };
  const userRef = doc(db, 'users', user.uid);
  
  try {
      await setDoc(userRef, userProfileData);
  } catch(error: any) {
      if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `/users/${user.uid}`,
                operation: 'create',
                requestResourceData: userProfileData,
            });
            errorEmitter.emit('permission-error', permissionError);
      }
      // Re-throw the error so the caller knows the operation failed.
      throw error;
  }
  return { uid: user.uid, ...userProfileData } as UserProfile;
}


export async function getAllUsersAdmin(): Promise<UserProfile[]> {
  const usersRef = collection(db, 'users');
  try {
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as UserProfile));
  } catch (error: any) {
    if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: '/users',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
     console.error("Error getting all users:", error);
     return []; // Return empty array on error
  }
}

export async function updateUserRole(uid: string, role: 'free' | 'pro' | 'admin') {
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
    // Re-throw the error so the caller (client component) knows the operation failed.
    throw error;
  }
}

// --- Cave Functions ---

export async function getCaves(includeInactive = false): Promise<Cave[]> {
  const cavesRef = collection(db, 'caves');
  const q = includeInactive ? query(cavesRef) : query(cavesRef, where('isActive', '==', true));
  
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Cave));
  } catch (error) {
    console.error("Error getting caves:", error);
    return []; // Return empty array on error
  }
}

export async function getCave(id: string): Promise<Cave | null> {
    const docRef = doc(db, 'caves', id);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Cave;
        }
    } catch (error) {
        console.error(`Error getting cave ${id}:`, error);
    }
    return null;
}

export async function addCave(caveData: Omit<Cave, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'caves'), caveData).catch(error => {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: '/caves',
                operation: 'create',
                requestResourceData: caveData,
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        throw error;
    });
    return docRef.id;
}

export async function updateCave(id: string, caveData: Partial<Omit<Cave, 'id'>>) {
    const docRef = doc(db, 'caves', id);
    await updateDoc(docRef, caveData).catch(error => {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `/caves/${id}`,
                operation: 'update',
                requestResourceData: caveData,
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        throw error;
    });
}

export async function deleteCave(id: string): Promise<void> {
  const caveDocRef = doc(db, 'caves', id);
  const spotsQuery = query(collection(db, 'spots'), where('caveId', '==', id));
  
  const batch = writeBatch(db);
  
  try {
    const spotsSnapshot = await getDocs(spotsQuery);
    spotsSnapshot.forEach(spotDoc => {
        batch.delete(spotDoc.ref);
    });
    batch.delete(caveDocRef);
    await batch.commit();
  } catch (error: any) {
      if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `/caves/${id} and associated spots`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
      }
      throw error;
  }
}


// --- Spot Functions ---

export async function getSpots(caveId: string): Promise<Spot[]> {
  const spotsRef = collection(db, 'spots');
  const q = query(
    spotsRef,
    where('caveId', '==', caveId)
  );
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Spot));
  } catch(error: any) {
    if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: `/spots where caveId==${caveId}`,
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
    console.error(`Error getting spots for cave ${caveId}:`, error);
    return [];
  }
}

export async function getSpot(id: string): Promise<Spot | null> {
  const docRef = doc(db, 'spots', id);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Spot;
    }
  } catch(error: any) {
      if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `/spots/${id}`,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
      }
      console.error(`Error getting spot ${id}:`, error);
  }
  return null;
}

export async function addSpot(spotData: Omit<Spot, 'id'>): Promise<string | null> {
    const docRef = await addDoc(collection(db, 'spots'), spotData).catch(error => {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: '/spots',
                operation: 'create',
                requestResourceData: spotData,
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        throw error;
    });
    return docRef.id;
}

export async function updateSpot(id: string, spotData: Partial<Omit<Spot, 'id'>>) {
  const docRef = doc(db, 'spots', id);
  await updateDoc(docRef, spotData).catch(error => {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `/spots/${id}`,
                operation: 'update',
                requestResourceData: spotData,
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        throw error;
    });
}

export async function deleteSpot(id: string) {
  const docRef = doc(db, 'spots', id);
  await deleteDoc(docRef).catch(error => {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `/spots/${id}`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        throw error;
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
  } catch (error) {
      console.error("Error getting kiosk settings:", error);
  }
  return null;
}

export async function saveKioskSettings(settings: Omit<KioskSettings, 'id'>) {
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
