'use client';

import {
  doc,
  increment,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Menggunakan satu instance db dari inisialisasi pusat
const { firestore: db } = initializeFirebase();

/**
 * Melacak penayangan spot di mode kios dengan menambah (increment)
 * jumlah penayangan di koleksi kioskStats.
 * @param locationId ID dari lokasi.
 * @param spotId ID dari spot yang dilihat.
 */
export function trackSpotView(locationId: string, spotId: string) {
  const statRef = doc(db, 'kioskStats', locationId);
  const data = {
    spots: {
      [spotId]: increment(1),
    },
    updatedAt: serverTimestamp(),
  };
  
  // Non-blocking write operation with error handling
  setDoc(statRef, data, { merge: true }).catch((error) => {
    if (error.code === 'permission-denied') {
      const permissionError = new FirestorePermissionError({
        path: `/kioskStats/${locationId}`,
        operation: 'update',
        requestResourceData: data,
      });
      errorEmitter.emit('permission-error', permissionError);
    }
    // Tidak melempar error lebih lanjut agar tidak mengganggu pemutaran kios
    console.warn(`Failed to track spot view for ${spotId}:`, error.message);
  });
}
