
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
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import type { UserProfile, Cave, Spot, KioskSettings } from './types';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

// --- Generic Error Handlers ---

const handleGetDocError = (error: any, docRef: DocumentReference) => {
    if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
    // Re-throw other errors or handle them as needed
    throw error;
}

const handleGetDocsError = (error: any, collRef: CollectionReference | query) => {
     if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: (collRef as CollectionReference).path || "complex query", // a bit of a hack for queries
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
    // Re-throw other errors
    throw error;
}


// --- User Profile Functions ---

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return { uid, ...docSnap.data() } as UserProfile;
    }
    return null;
  } catch(error) {
    handleGetDocError(error, userRef);
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
      if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'create',
            requestResourceData: userProfileData,
        });
        errorEmitter.emit('permission-error', permissionError);
      } else {
        throw error;
      }
  });
  return { uid: user.uid, ...userProfileData } as UserProfile;
}


export async function getAllUsers(): Promise<UserProfile[]> {
  const usersRef = collection(db, 'users');
  try {
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as UserProfile));
  } catch(error) {
      handleGetDocsError(error, usersRef);
      return [];
  }
}

export function updateUserRole(uid: string, role: 'free' | 'pro' | 'admin') {
  const userRef = doc(db, 'users', uid);
  const dataToUpdate = { role, updatedAt: serverTimestamp() };
  updateDoc(userRef, dataToUpdate).catch(error => {
       if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
      } else {
        throw error;
      }
  });
}

// --- Cave Functions ---

export async function getCaves(includeInactive = false): Promise<Cave[]> {
  const cavesRef = collection(db, 'caves');
  const q = includeInactive ? query(cavesRef) : query(cavesRef, where('isActive', '==', true));
  
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Cave));
  } catch (error) {
    handleGetDocsError(error, cavesRef);
    return [];
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
    } catch(error) {
        handleGetDocError(error, docRef);
        return null;
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

export function updateCave(id: string, caveData: Partial<Cave>) {
    const docRef = doc(db, 'caves', id);
    updateDoc(docRef, caveData).catch(error => {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: caveData,
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
            throw error;
        }
    });
}

export function deleteCave(id: string): Promise<void> {
    const caveDocRef = doc(db, 'caves', id);
    const spotsQuery = query(collection(db, 'spots'), where('caveId', '==', id));
    
    return new Promise(async (resolve, reject) => {
        try {
            const spotsSnapshot = await getDocs(spotsQuery);
            const batch = writeBatch(db);
            spotsSnapshot.forEach(spotDoc => {
              batch.delete(spotDoc.ref);
            });
            batch.delete(caveDocRef);
            await batch.commit();
            resolve();
        } catch (error: any) {
            if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: `batch write (delete cave: ${id})`,
                    operation: 'delete',
                });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                 console.error("Batch delete failed:", error);
            }
            reject(error); // reject promise for the UI to handle
        }
    });
}


// --- Spot Functions ---

export async function getSpots(caveId: string): Promise<Spot[]> {
  const spotsRef = collection(db, 'spots');
  const q = query(
    spotsRef,
    where('caveId', '==', caveId),
    orderBy('order')
  );
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Spot));
  } catch (error) {
    handleGetDocsError(error, q);
    return [];
  }
}

export async function getAllSpots(): Promise<Spot[]> {
    const spotsRef = collection(db, 'spots');
    try {
        const q = query(spotsRef, orderBy('caveId'), orderBy('order'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Spot));
    } catch (error) {
        handleGetDocsError(error, spotsRef);
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
    return null;
  } catch (error) {
      handleGetDocError(error, docRef);
      return null;
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
    updateDoc(docRef, spotData).catch(error => {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: spotData,
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
            throw error;
        }
    });
}

export function deleteSpot(id: string) {
    const docRef = doc(db, 'spots', id);
    deleteDoc(docRef).catch(error => {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
            throw error;
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
  } catch (error) {
    handleGetDocError(error, docRef);
    return null;
  }
}

export function saveKioskSettings(settings: Omit<KioskSettings, 'id'>) {
  const docRef = doc(db, 'kioskSettings', KIOSK_SETTINGS_ID);
  setDoc(docRef, settings, { merge: true }).catch(error => {
       if (error.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
              path: docRef.path,
              operation: 'update',
              requestResourceData: settings
          });
          errorEmitter.emit('permission-error', permissionError);
       } else {
           throw error;
       }
  });
}


    