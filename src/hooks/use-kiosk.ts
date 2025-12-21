'use client';

import { useEffect } from 'react';
import { onSnapshot, setDoc, serverTimestamp, DocumentReference } from 'firebase/firestore';

export function useKioskHeartbeat(kioskDeviceRef: DocumentReference, currentSpotId?: string) {
  useEffect(() => {
    if (!kioskDeviceRef) return;
    const t = setInterval(() => {
      setDoc(kioskDeviceRef, {
        status: 'online',
        currentSpotId: currentSpotId || null,
        updatedAt: serverTimestamp(),
      }, { merge: true }).catch((err) => {
          console.warn('Kiosk heartbeat failed:', err.message);
      });
    }, 5000);

    return () => clearInterval(t);
  }, [kioskDeviceRef, currentSpotId]);
}

export function useKioskControl(kioskControlRef: DocumentReference, onControl: (c: any) => void) {
  useEffect(() => {
    if (!kioskControlRef) return;
    const unsub = onSnapshot(kioskControlRef, (snap) => {
      if (snap.exists()) {
        onControl(snap.data());
      }
    }, (error) => {
        console.warn('Kiosk control listener failed:', error.message);
    });
    return () => unsub();
  }, [kioskControlRef, onControl]);
}
