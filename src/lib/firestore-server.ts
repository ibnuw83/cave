import 'server-only';
import { safeGetAdminApp } from '@/firebase/admin';
import { Location, Spot } from './types';

// Fungsi ini sekarang menggunakan safeGetAdminApp untuk menghindari crash jika Admin SDK tidak terinisialisasi.
const getDb = () => {
    const app = safeGetAdminApp();
    // Log ini penting untuk debugging masalah server-side rendering.
    if (!app) {
        console.warn(`[Firestore Server] Firebase Admin SDK tidak tersedia. Pengambilan data sisi server dinonaktifkan.`);
    }
    return app?.db;
}

export async function getLocations(includeInactive = false): Promise<Location[]> {
    const db = getDb();
    if (!db) return []; // Kembalikan array kosong jika DB tidak tersedia
    
    try {
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('locations');

        // Filter lokasi yang tidak aktif jika tidak diminta sebaliknya
        if (!includeInactive) {
            query = query.where('isActive', '==', true);
        }
        
        const snapshot = await query.get();
        if (snapshot.empty) {
            return [];
        }
        
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
    } catch (error: any) {
        console.error("[Firestore Server] Gagal mengambil getLocations:", error.message);
        // Kembalikan array kosong jika terjadi kesalahan
        return [];
    }
}

export async function getLocation(id: string): Promise<Location | null> {
    const db = getDb();
    if (!db) return null; // Kembalikan null jika DB tidak tersedia
    
    try {
        const docRef = db.collection('locations').doc(id);
        const docSnap = await docRef.get();

        // Jika dokumen tidak ada, kembalikan null
        if (!docSnap.exists) {
            return null;
        }

        const location = { id: docSnap.id, ...docSnap.data() } as Location;

        // PENTING: Periksa apakah lokasi aktif. Jika tidak, perlakukan seolah-olah tidak ditemukan.
        // Ini akan memicu notFound() di page component dengan benar.
        if (!location.isActive) {
            return null;
        }

        return location;
    } catch (error: any) {
        console.error(`[Firestore Server] Gagal mengambil getLocation untuk id ${id}:`, error.message);
        // Kembalikan null jika terjadi kesalahan
        return null;
    }
}

export async function getSpots(locationId: string): Promise<Spot[]> {
    const db = getDb();
    if (!db) return []; // Kembalikan array kosong jika DB tidak tersedia

    try {
        const spotsRef = db.collection('spots');
        const q = spotsRef.where('locationId', '==', locationId);
        const querySnapshot = await q.get();
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Spot));
    } catch (error: any) {
        console.error(`[Firestore Server] Gagal mengambil getSpots untuk locationId ${locationId}:`, error.message);
        return [];
    }
}

export async function getSpotClient(id: string): Promise<Spot | null> {
  const db = getDb();
  if (!db) return null; // Kembalikan null jika DB tidak tersedia

  try {
    const docRef = db.collection('spots').doc(id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() } as Spot;
    }
    return null;
  } catch (error: any) {
    console.error(`[Firestore Server] Gagal mengambil getSpotClient untuk id ${id}:`, error.message);
    return null;
  }
}
