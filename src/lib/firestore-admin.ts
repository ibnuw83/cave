
import 'server-only';
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

export async function getLocations(): Promise<Location[]> {
    const { db } = getAdminServices();
    if (!db) return []; 
    
    try {
        const query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('locations').where('isActive', '==', true);
        
        const snapshot = await query.get();
        if (snapshot.empty) {
            return [];
        }
        
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
    } catch (error: any) {
        console.error("[Firestore Admin] Gagal mengambil getLocations:", error.message);
        return [];
    }
}

export async function getLocation(id: string): Promise<Location | null> {
    const { db } = getAdminServices();
    if (!db) return null; 
    
    try {
        const docRef = db.collection('locations').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return null;
        }

        const location = { id: docSnap.id, ...docSnap.data() } as Location;

        // Pemeriksaan penting: hanya kembalikan jika lokasi aktif
        if (!location.isActive) {
            return null;
        }

        return location;
    } catch (error: any) {
        console.error(`[Firestore Admin] Gagal mengambil getLocation untuk id ${id}:`, error.message);
        return null;
    }
}

export async function getSpots(locationId: string): Promise<Spot[]> {
    const { db } = getAdminServices();
    if (!db) return []; 

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
  if (!db) return null;

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
  const { db } = getAdminServices();
  if (!db) return [];
  
  const usersRef = db.collection('users');
  try {
    const querySnapshot = await usersRef.get();
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as UserProfile));
  } catch (error: any) {
    // We don't use the permission error emitter here since this is a server-only function
    // and errors should be logged on the server.
    console.error("[Firestore Admin] Gagal mengambil getAllUsersAdmin:", error.message);
    // Return empty array on failure
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
    
