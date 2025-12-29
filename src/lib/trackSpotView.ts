'use client';

import {
  doc,
  increment,
  setDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const THROTTLE_INTERVAL_MS = 5 * 60 * 1000; // 5 menit

/**
 * Melacak penayangan spot di mode kios dengan menambah (increment)
 * jumlah penayangan di koleksi kioskStats, dengan throttling.
 * @param db Instance Firestore yang akan digunakan.
 * @param locationId ID dari lokasi.
 * @param spotId ID dari spot yang dilihat.
 */
export function trackSpotView(db: Firestore, locationId: string, spotId: string) {
  // Hanya berjalan di browser
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  const lastTrackedKey = `lastTracked_${spotId}`;
  const lastTrackedTime = parseInt(window.localStorage.getItem(lastTrackedKey) || '0', 10);
  const now = Date.now();

  if (now - lastTrackedTime < THROTTLE_INTERVAL_MS) {
    // Masih dalam periode throttle, jangan lakukan apa-apa
    return;
  }
  
  // Perbarui waktu pelacakan di localStorage
  window.localStorage.setItem(lastTrackedKey, now.toString());

  const statRef = doc(db, 'kioskStats', locationId);
  const data = {
    spots: {
      [spotId]: increment(1),
    },
    updatedAt: serverTimestamp(),
  };
  
  setDoc(statRef, data, { merge: true }).catch((error) => {
    if (error.code === 'permission-denied') {
      const permissionError = new FirestorePermissionError({
        path: `/kioskStats/${locationId}`,
        operation: 'update',
        requestResourceData: data,
      });
      errorEmitter.emit('permission-error', permissionError);
    }
    console.warn(`Failed to track spot view for ${spotId}:`, error.message);
  });
}
