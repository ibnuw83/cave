
'use server';
import { safeGetAdminApp } from '@/firebase/admin';
import { Location, Spot, UserProfile } from './types';
import { UserRecord } from 'firebase-admin/auth';
import { firestore } from 'firebase-admin';

// Fungsi ini sekarang menggunakan safeGetAdminApp untuk menghindari crash jika Admin SDK tidak terinisialisasi.
const getAdminServices = () => {
    const app = safeGetAdminApp();
    if (!app) {
        console.warn(`[Firestore Admin] Firebase Admin SDK tidak tersedia. Pengambilan data sisi server dinonaktifkan.`);
        return { db: null, auth: null };
    }
    return app;
}

export async function getLocations(includeInactive = false): Promise<Location[]> {
    const { db } = getAdminServices();
    if (!db) return []; 
    
    try {
        let locationsRef: firestore.Query<firestore.DocumentData> = db.collection('locations');
        if (!includeInactive) {
            locationsRef = locationsRef.where('isActive', '==', true);
        }
        const snapshot = await locationsRef.get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
    } catch (error: any) {
        // Log the error but return an empty array to prevent crashing the page
        console.error("[Firestore Admin] Gagal mengambil getLocations:", error.message);
        return [];
    }
}

export async function getLocation(id: string): Promise<Location | null> {
    const { db, adminApp } = getAdminServices(); // Dapatkan adminApp juga
    
    // DEBUG LOGS
    if (adminApp?.options) {
      console.log('[DEBUG] project:', adminApp.options.projectId);
    }

    if (!db) {
        console.error("[Firestore Admin] Gagal mendapatkan koneksi DB di getLocation.");
        return null;
    }
    
    try {
        const docRef = db.collection('locations').doc(id);
        const docSnap = await docRef.get();

        // DEBUG LOGS
        console.log('exists:', docSnap.exists);

        if (!docSnap.exists) {
            console.warn(`[Firestore Admin] Dokumen tidak ditemukan di path: locations/${id}`);
            return null;
        }

        return { id: docSnap.id, ...docSnap.data() } as Location;

    } catch (error: any) {
        console.error(`[Firestore Admin] Gagal mengambil getLocation untuk id ${id}:`, error.message);
        return null;
    }
}

export async function getSpots(locationId: string): Promise<Spot[]> {
    const { db } = getAdminServices();
    if (!db) {
         return [];
    }

    try {
        const spotsRef = db.collection('spots');
        const q = spotsRef.where('locationId', '==', locationId);
        const querySnapshot = await q.get();
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Spot));
    } catch (error: any) {
        console.error(`[Firestore Admin] Gagal mengambil getSpots untuk locationId ${locationId}:`, error.message);
        return [];
    }
}

export async function getSpot(id: string): Promise<Spot | null> {
  const { db } = getAdminServices();
  if (!db) {
    return null;
  }

  try {
    const docRef = db.collection('spots').doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
        return null;
    }
    
    return { id: docSnap.id, ...docSnap.data() } as Spot;
  } catch (error: any) {
    console.error(`[Firestore Admin] Gagal mengambil getSpot untuk id ${id}:`, error.message);
    return null;
  }
}

export async function getAllUsersAdmin(): Promise<UserProfile[]> {
  const { db, auth } = getAdminServices();
  if (!db || !auth) return [];
  
  try {
    const listUsersResult = await auth.listUsers();
    const uids = listUsersResult.users.map(u => u.uid);
    if (uids.length === 0) return [];
    
    const usersRef = db.collection('users');
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
    console.error("[Firestore Admin] Gagal mengambil getAllUsersAdmin:", error.message);
    return [];
  }
}

export async function createUserAdmin(data: { email: string, password?: string, displayName: string, role: UserProfile['role'] }): Promise<UserRecord> {
  const { auth, db } = getAdminServices();
  if (!auth || !db) throw new Error("Admin SDK tidak terinisialisasi.");

  // Create user in Auth
  const userRecord = await auth.createUser({
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
  await db.collection('users').doc(userRecord.uid).set({
    ...userProfile,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });

  return userRecord;
}


export async function deleteUserAdmin(uid: string): Promise<void> {
  const { auth, db } = getAdminServices();
  if (!auth || !db) throw new Error("Admin SDK tidak terinisialisasi.");

  // Delete from Auth
  await auth.deleteUser(uid);

  // Delete from Firestore
  await db.collection('users').doc(uid).delete();
}

export async function updateUserStatusAdmin(uid: string, disabled: boolean): Promise<void> {
    const { auth } = getAdminServices();
    if (!auth) throw new Error("Admin SDK tidak terinisialisasi.");

    await auth.updateUser(uid, { disabled });
}
