
'use server';
import { adminDb, adminAuth } from '@/firebase/admin';
import { Location, Spot, UserProfile } from './types';
import { UserRecord } from 'firebase-admin/auth';
import { firestore } from 'firebase-admin';


export async function getLocations(includeInactive = false): Promise<Location[]> {
    try {
        let locationsRef: firestore.Query<firestore.DocumentData> = adminDb.collection('locations');
        if (!includeInactive) {
            locationsRef = locationsRef.where('isActive', '==', true);
        }
        const snapshot = await locationsRef.get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
    } catch (error: any) {
        console.error("[Firestore Admin] Failed to getLocations:", error.message);
        return [];
    }
}

export async function getLocation(id: string): Promise<Location | null> {
    try {
        const docRef = adminDb.collection('locations').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            console.warn(`[Firestore Admin] Document not found at path: locations/${id}`);
            return null;
        }

        return { id: docSnap.id, ...docSnap.data() } as Location;

    } catch (error: any) {
        console.error(`[Firestore Admin] Failed to getLocation for id ${id}:`, error.message);
        return null;
    }
}

export async function getSpots(locationId: string): Promise<Spot[]> {
    try {
        const spotsRef = adminDb.collection('spots');
        const q = spotsRef.where('locationId', '==', locationId);
        const querySnapshot = await q.get();
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Spot));
    } catch (error: any) {
        console.error(`[Firestore Admin] Failed to getSpots for locationId ${locationId}:`, error.message);
        return [];
    }
}

export async function getSpot(id: string): Promise<Spot | null> {
  try {
    const docRef = adminDb.collection('spots').doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
        return null;
    }
    
    return { id: docSnap.id, ...docSnap.data() } as Spot;
  } catch (error: any) {
    console.error(`[Firestore Admin] Failed to getSpot for id ${id}:`, error.message);
    return null;
  }
}

export async function getAllUsersAdmin(): Promise<UserProfile[]> {
  try {
    const listUsersResult = await adminAuth.listUsers();
    const uids = listUsersResult.users.map(u => u.uid);
    if (uids.length === 0) return [];
    
    const usersRef = adminDb.collection('users');
    const querySnapshot = await usersRef.where(firestore.FieldPath.documentId(), 'in', uids).get();
    const profilesByUid = querySnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = { id: doc.id, ...doc.data() } as UserProfile;
        return acc;
    }, {} as Record<string, UserProfile>);

    return listUsersResult.users.map(userRecord => {
        const profile = profilesByUid[userRecord.uid];
        return {
            ...profile,
            id: userRecord.uid,
            displayName: userRecord.displayName || profile?.displayName,
            email: userRecord.email || profile?.email,
            photoURL: userRecord.photoURL || profile?.photoURL,
            disabled: userRecord.disabled,
            role: profile?.role || 'free',
            updatedAt: profile?.updatedAt || userRecord.metadata.lastSignInTime,
        };
    });

  } catch (error: any) {
    console.error("[Firestore Admin] Failed to getAllUsersAdmin:", error.message);
    return [];
  }
}

export async function createUserAdmin(data: { email: string, password?: string, displayName: string, role: UserProfile['role'] }): Promise<UserRecord> {
  // Create user in Auth
  const userRecord = await adminAuth.createUser({
    email: data.email,
    emailVerified: true,
    password: data.password,
    displayName: data.displayName,
    disabled: false,
  });

  // Create user profile in Firestore
  const userProfile: Omit<UserProfile, 'id' | 'updatedAt'> = {
    displayName: userRecord.displayName || data.displayName,
    email: userRecord.email || data.email,
    photoURL: userRecord.photoURL || null,
    role: data.role,
  };
  await adminDb.collection('users').doc(userRecord.uid).set({
    ...userProfile,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });

  return userRecord;
}


export async function deleteUserAdmin(uid: string): Promise<void> {
  // Delete from Auth
  await adminAuth.deleteUser(uid);

  // Delete from Firestore
  await adminDb.collection('users').doc(uid).delete();
}

export async function updateUserStatusAdmin(uid: string, disabled: boolean): Promise<void> {
    await adminAuth.updateUser(uid, { disabled });
}
