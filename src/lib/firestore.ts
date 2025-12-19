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
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { initializeFirebase } from '@/firebase'; // Menggunakan inisialisasi terpusat
import type { UserProfile, Cave, Spot, KioskSettings } from './types';
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
      return { id: docSnap.id, ...docSnap.data() } as UserProfile;
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
      role: 'free',
    };
    const userRef = doc(db, 'users', user.uid);

    try {
        await setDoc(userRef, { ...userProfileData, updatedAt: serverTimestamp()}, { merge: true });
        const createdProfile: UserProfile = {
            id: user.uid,
            ...userProfileData,
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
    // Re-throw the error so the calling function knows it failed
    throw error;
  }
}

// --- Cave Functions (Client-Side) ---

export async function getCaves(includeInactive = false): Promise<Cave[]> {
  const cavesRef = collection(db, 'caves');
  const q = includeInactive ? query(cavesRef) : query(cavesRef, where('isActive', '==', true));
  
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Cave));
  } catch (error: any) {
     if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: '/caves',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
    throw error;
  }
}

export async function getCave(id: string): Promise<Cave | null> {
    const docRef = doc(db, 'caves', id);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Cave;
        }
        return null;
    } catch (error: any) {
         if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `/caves/${id}`,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        throw error;
    }
}

export function addCave(caveData: Omit<Cave, 'id'>): Promise<string> {
    return new Promise((resolve, reject) => {
        addDoc(collection(db, 'caves'), caveData)
            .then(docRef => {
                resolve(docRef.id);
            })
            .catch(error => {
                if (error.code === 'permission-denied') {
                    const permissionError = new FirestorePermissionError({
                        path: '/caves',
                        operation: 'create',
                        requestResourceData: caveData,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                }
                reject(error);
            });
    });
}

export function updateCave(id: string, caveData: Partial<Omit<Cave, 'id'>>) {
    const docRef = doc(db, 'caves', id);
    updateDoc(docRef, caveData).catch((error) => {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `/caves/${id}`,
                operation: 'update',
                requestResourceData: caveData,
            });
            errorEmitter.emit('permission-error', permissionError);
        }
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
