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

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { uid, ...docSnap.data() } as UserProfile;
  }
  return null;
}

export async function createUserProfile(user: User): Promise<UserProfile> {
  const userProfile: Omit<UserProfile, 'uid'> = {
    email: user.email,
    displayName: user.displayName,
    role: 'free',
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'users', user.uid), userProfile);
  return { uid: user.uid, ...userProfile } as UserProfile;
}

export async function getCaves(): Promise<Cave[]> {
  const q = query(collection(db, 'caves'), where('isActive', '==', true));
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

export async function getSpots(caveId: string): Promise<Spot[]> {
  const q = query(
    collection(db, 'spots'),
    where('caveId', '==', caveId),
    orderBy('order')
  );
  const querySnapshot = await getDocs(q);
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
