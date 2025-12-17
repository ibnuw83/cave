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
import type { UserProfile, Cave, Spot } from './types';
import { FirestorePermissionError } from './errors';
import { errorEmitter } from './error-emitter';

// User Profile Functions
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', uid);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { uid, ...docSnap.data() } as UserProfile;
    }
    return null;
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'get',
      });
      errorEmitter.emit('permission-error', permissionError);
    }
    throw error;
  }
}

export async function createUserProfile(user: User): Promise<UserProfile> {
  const userProfile: Omit<UserProfile, 'uid'> = {
    email: user.email,
    displayName: user.displayName,
    role: 'free',
    updatedAt: serverTimestamp(),
  };
  const docRef = doc(db, 'users', user.uid);
  try {
    await setDoc(docRef, userProfile);
    return { uid: user.uid, ...userProfile } as UserProfile;
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'create',
        requestResourceData: userProfile,
      });
      errorEmitter.emit('permission-error', permissionError);
    }
    throw error;
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const usersRef = collection(db, 'users');
  try {
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as UserProfile));
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: usersRef.path, operation: 'list' }));
      return [];
    }
    throw error;
  }
}

export async function updateUserRole(uid: string, role: 'free' | 'pro' | 'admin'): Promise<void> {
  const docRef = doc(db, 'users', uid);
  const payload = { role, updatedAt: serverTimestamp() };
  try {
    await updateDoc(docRef, payload);
  } catch (error: any) {
     if (error.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: payload }));
    }
    throw error;
  }
}

// Cave Functions
export async function getCaves(includeInactive = false): Promise<Cave[]> {
  const cavesRef = collection(db, 'caves');
  const q = includeInactive ? query(cavesRef) : query(cavesRef, where('isActive', '==', true));
  
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Cave));
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      const permissionError = new FirestorePermissionError({
        path: cavesRef.path,
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      return [];
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
          path: docRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
      throw error;
    }
}

export async function addCave(caveData: Omit<Cave, 'id'>): Promise<string> {
    const cavesRef = collection(db, 'caves');
    try {
        const docRef = await addDoc(cavesRef, caveData);
        return docRef.id;
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: cavesRef.path, operation: 'create', requestResourceData: caveData }));
        }
        throw error;
    }
}

export async function updateCave(id: string, caveData: Partial<Cave>): Promise<void> {
    const docRef = doc(db, 'caves', id);
    try {
        await updateDoc(docRef, caveData);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: caveData }));
        }
        throw error;
    }
}

export async function deleteCave(id: string): Promise<void> {
    const caveDocRef = doc(db, 'caves', id);
    try {
      const spotsQuery = query(collection(db, 'spots'), where('caveId', '==', id));
      const spotsSnapshot = await getDocs(spotsQuery);
      
      const batch = writeBatch(db);
      spotsSnapshot.forEach(spotDoc => {
        batch.delete(spotDoc.ref);
      });
      batch.delete(caveDocRef);
      
      await batch.commit();

    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: caveDocRef.path, operation: 'delete' }));
        }
        throw error;
    }
}


// Spot Functions
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
  } catch (error: any) {
     if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
          path: spotsRef.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
         return [];
      }
      throw error;
  }
}

export async function getAllSpots(): Promise<Spot[]> {
    const spotsRef = collection(db, 'spots');
    try {
        const querySnapshot = await getDocs(query(spotsRef, orderBy('caveId'), orderBy('order')));
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Spot));
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: spotsRef.path, operation: 'list' }));
            return [];
        }
        throw error;
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
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'get',
      });
      errorEmitter.emit('permission-error', permissionError);
    }
    throw error;
  }
}

export async function addSpot(spotData: Omit<Spot, 'id'>): Promise<string> {
    const spotsRef = collection(db, 'spots');
    try {
        const docRef = await addDoc(spotsRef, spotData);
        return docRef.id;
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: spotsRef.path, operation: 'create', requestResourceData: spotData }));
        }
        throw error;
    }
}

export async function updateSpot(id: string, spotData: Partial<Omit<Spot, 'id'>>): Promise<void> {
    const docRef = doc(db, 'spots', id);
    try {
        await updateDoc(docRef, spotData);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: spotData }));
        }
        throw error;
    }
}

export async function deleteSpot(id: string): Promise<void> {
    const docRef = doc(db, 'spots', id);
    try {
        await deleteDoc(docRef);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
        }
        throw error;
    }
}
