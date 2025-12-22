
import { NextRequest, NextResponse } from 'next/server';
import { safeGetAdminApp } from '@/firebase/admin';
import { cookies } from 'next/headers';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { firestore } from 'firebase-admin';

async function verifyAdmin(req: NextRequest): Promise<DecodedIdToken | null> {
    const admin = safeGetAdminApp();
    if (!admin || !admin.db) {
      console.warn('[ADMIN API] Admin SDK tidak tersedia.');
      return null;
    }
  
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
      console.warn('[ADMIN API] Cookie sesi tidak ditemukan.');
      return null;
    }
  
    try {
      const decoded = await admin.auth.verifySessionCookie(sessionCookie, true);
      const userDoc = await admin.db.collection('users').doc(decoded.uid).get();
      if (userDoc.exists && userDoc.data()?.role === 'admin') {
        return decoded;
      }
      console.warn(`[ADMIN API] Verifikasi gagal: Pengguna ${decoded.uid} bukan admin.`);
      return null;
    } catch (err) {
      console.warn('[ADMIN API] Gagal verifikasi cookie admin:', err);
      return null;
    }
}

async function deleteCollection(db: firestore.Firestore, collectionPath: string, batchSize: number) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(db: firestore.Firestore, query: firestore.Query, resolve: (value: unknown) => void) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        // When there are no documents left, we are done
        resolve(true);
        return;
    }

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}


export async function POST(req: NextRequest) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak: Hanya admin yang diizinkan.' }, { status: 403 });
    }

    const { db } = safeGetAdminApp();
    if (!db) {
         return NextResponse.json({ error: 'Koneksi database gagal.' }, { status: 500 });
    }

    try {
        const cavesCollectionRef = db.collection('caves');
        const locationsCollectionRef = db.collection('locations');

        const cavesSnapshot = await cavesCollectionRef.get();

        if (cavesSnapshot.empty) {
            return NextResponse.json({ message: 'Tidak ada data di koleksi "caves" untuk dimigrasi.' }, { status: 200 });
        }

        const batch = db.batch();
        let migratedCount = 0;

        cavesSnapshot.forEach(doc => {
            const data = doc.data();
            const newDocRef = locationsCollectionRef.doc(doc.id);
            batch.set(newDocRef, data);
            migratedCount++;
        });

        await batch.commit();
        
        // Setelah migrasi berhasil, hapus koleksi 'caves'
        await deleteCollection(db, 'caves', 50);

        return NextResponse.json({ message: `Berhasil memigrasikan ${migratedCount} dokumen dan menghapus koleksi 'caves'.` }, { status: 200 });

    } catch (error: any) {
        console.error(`[API] Gagal melakukan migrasi data:`, error);
        return NextResponse.json({ error: error.message || 'Terjadi kesalahan saat migrasi.' }, { status: 500 });
    }
}
