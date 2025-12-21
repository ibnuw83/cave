
import 'server-only';
import { safeGetAdminApp } from '@/firebase/admin';
import { Location, Spot } from './types';

// Fungsi ini sekarang menggunakan safeGetAdminApp untuk menghindari crash jika Admin SDK tidak terinisialisasi.
const getDb = () => {
    const app = safeGetAdminApp();
    if (!app) {
        console.warn(`[Firestore Admin] Firebase Admin SDK tidak tersedia. Pengambilan data sisi server dinonaktifkan.`);
    }
    return app?.db;
}

export async function getLocations(): Promise<Location[]> {
    const db = getDb();
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
    const db = getDb();
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
    const db = getDb();
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
  const db = getDb();
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

    