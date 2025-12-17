
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


// --- User Profile Functions ---

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    return { uid, ...docSnap.data() } as UserProfile;
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
  
  await setDoc(userRef, userProfileData);
  return { uid: user.uid, ...userProfileData } as UserProfile;
}


export async function getAllUsers(): Promise<UserProfile[]> {
  const usersRef = collection(db, 'users');
  const querySnapshot = await getDocs(usersRef);
  return querySnapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as UserProfile));
}

export async function updateUserRole(uid: string, role: 'free' | 'pro' | 'admin') {
  const userRef = doc(db, 'users', uid);
  const dataToUpdate = { role, updatedAt: serverTimestamp() };
  await updateDoc(userRef, dataToUpdate);
}

// --- Cave Functions ---

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

export async function addCave(caveData: Omit<Cave, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'caves'), caveData);
    return docRef.id;
}

export async function updateCave(id: string, caveData: Partial<Omit<Cave, 'id'>>) {
    const docRef = doc(db, 'caves', id);
    await updateDoc(docRef, caveData);
}

export async function deleteCave(id: string): Promise<void> {
    const caveDocRef = doc(db, 'caves', id);
    const spotsQuery = query(collection(db, 'spots'), where('caveId', '==', id));
    
    const batch = writeBatch(db);
    const spotsSnapshot = await getDocs(spotsQuery);
    spotsSnapshot.forEach(spotDoc => {
        batch.delete(spotDoc.ref);
    });
    batch.delete(caveDocRef);
    await batch.commit();
}


// --- Spot Functions ---

export async function getSpots(caveId: string): Promise<Spot[]> {
  const spotsRef = collection(db, 'spots');
  const q = query(
    spotsRef,
    where('caveId', '==', caveId),
    orderBy('order')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Spot));
}

export async function getAllSpots(): Promise<Spot[]> {
    const spotsRef = collection(db, 'spots');
    const q = query(spotsRef);
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

export async function addSpot(spotData: Omit<Spot, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'spots'), spotData);
    return docRef.id;
}

export async function updateSpot(id: string, spotData: Partial<Omit<Spot, 'id'>>) {
    const docRef = doc(db, 'spots', id);
    await updateDoc(docRef, spotData);
}

export async function deleteSpot(id: string) {
    const docRef = doc(db, 'spots', id);
    await deleteDoc(docRef);
}

// --- Kiosk Settings Functions ---

const KIOSK_SETTINGS_ID = 'main';

export async function getKioskSettings(): Promise<KioskSettings | null> {
  const docRef = doc(db, 'kioskSettings', KIOSK_SETTINGS_ID);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as KioskSettings;
  }
  return null;
}

export async function saveKioskSettings(settings: Omit<KioskSettings, 'id'>) {
  const docRef = doc(db, 'kioskSettings', KIOSK_SETTINGS_ID);
  await setDoc(docRef, settings, { merge: true });
}
