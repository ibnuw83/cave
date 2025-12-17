import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import type { UserProfile, Cave, Spot } from './types';
import { FirestorePermissionError } from './errors';
import { errorEmitter } from './error-emitter';

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

export async function getCaves(): Promise<Cave[]> {
  const cavesRef = collection(db, 'caves');
  const q = query(cavesRef, where('isActive', '==', true));
  
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
      // Return an empty array or handle it as you see fit, but don't re-throw
      return [];
    }
    // For other errors, you might still want to throw them
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
