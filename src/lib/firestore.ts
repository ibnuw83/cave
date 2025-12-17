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
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import type { UserProfile, Cave, Spot, KioskSettings } from './types';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

// User Profile Functions
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return { uid, ...docSnap.data() } as UserProfile;
    }
    return null;
  } catch(e: any) {
    if (e.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
    // Return null or re-throw a non-permission error if needed
    return null;
  }
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
  setDoc(userRef, userProfileData).catch(error => {
      const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'create',
          requestResourceData: userProfileData,
      });
      errorEmitter.emit('permission-error', permissionError);
  });
  return { uid: user.uid, ...userProfileData } as UserProfile;
}


export async function getAllUsers(): Promise<UserProfile[]> {
  const querySnapshot = await getDocs(collection(db, 'users'));
  return querySnapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as UserProfile));
}

export function updateUserRole(uid: string, role: 'free' | 'pro' | 'admin') {
  const userRef = doc(db, 'users', uid);
  const dataToUpdate = { role, updatedAt: serverTimestamp() };
  updateDoc(userRef, dataToUpdate).catch(error => {
      const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: dataToUpdate,
      });
      errorEmitter.emit('permission-error', permissionError);
  });
}

// Cave Functions
export async function getCaves(includeInactive = false): Promise<Cave[]> {
  const cavesRef = collection(db, 'caves');
  const q = includeInactive ? query(cavesRef) : query(cavesRef, where('isActive', '==', true));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Cave));
}

export async function getCave(id: string): Promise<Cave | null> {
    const docRef = doc(db, 'caves', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Cave;
    }
    return null;
}

export function addCave(caveData: Omit<Cave, 'id'>): Promise<string> {
  return new Promise((resolve, reject) => {
    addDoc(collection(db, 'caves'), caveData)
      .then(docRef => {
        resolve(docRef.id);
      })
      .catch(error => {
        const permissionError = new FirestorePermissionError({
          path: '/caves',
          operation: 'create',
          requestResourceData: caveData,
        });
        errorEmitter.emit('permission-error', permissionError);
        reject(error);
      });
  });
}

export function updateCave(id: string, caveData: Partial<Cave>) {
    const docRef = doc(db, 'caves', id);
    updateDoc(docRef, caveData).catch(error => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: caveData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}

export async function deleteCave(id: string): Promise<void> {
    const caveDocRef = doc(db, 'caves', id);
    const spotsQuery = query(collection(db, 'spots'), where('caveId', '==', id));
    
    try {
        const spotsSnapshot = await getDocs(spotsQuery);
        const batch = writeBatch(db);
        spotsSnapshot.forEach(spotDoc => {
          batch.delete(spotDoc.ref);
        });
        batch.delete(caveDocRef);
        await batch.commit();
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: caveDocRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
             throw error;
        }
    }
}


// Spot Functions
export async function getSpots(caveId: string): Promise<Spot[]> {
  const q = query(
    collection(db, 'spots'),
    where('caveId', '==', caveId),
    orderBy('order')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Spot));
}

export async function getAllSpots(): Promise<Spot[]> {
    const querySnapshot = await getDocs(query(collection(db, 'spots'), orderBy('caveId'), orderBy('order')));
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Spot));
}

export async function getSpot(id: string): Promise<Spot | null> {
  const docRef = doc(db, 'spots', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Spot;
  }
  return null;
}

export function addSpot(spotData: Omit<Spot, 'id'>): Promise<string> {
  return new Promise((resolve, reject) => {
    addDoc(collection(db, 'spots'), spotData)
      .then(docRef => {
        resolve(docRef.id);
      })
      .catch(error => {
        const permissionError = new FirestorePermissionError({
          path: '/spots',
          operation: 'create',
          requestResourceData: spotData,
        });
        errorEmitter.emit('permission-error', permissionError);
        reject(error);
      });
  });
}

export function updateSpot(id: string, spotData: Partial<Omit<Spot, 'id'>>) {
    const docRef = doc(db, 'spots', id);
    updateDoc(docRef, spotData).catch(error => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: spotData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}

export function deleteSpot(id: string) {
    const docRef = doc(db, 'spots', id);
    deleteDoc(docRef).catch(error => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}

// Kiosk Settings Functions
const KIOSK_SETTINGS_ID = 'main';

export async function getKioskSettings(): Promise<KioskSettings | null> {
  const docRef = doc(db, 'kioskSettings', KIOSK_SETTINGS_ID);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as KioskSettings;
  }
  return null;
}

export function saveKioskSettings(settings: Omit<KioskSettings, 'id'>) {
  const docRef = doc(db, 'kioskSettings', KIOSK_SETTINGS_ID);
  setDoc(docRef, settings, { merge: true }).catch(error => {
      const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: settings
      });
      errorEmitter.emit('permission-error', permissionError);
  });
}