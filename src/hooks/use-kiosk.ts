
'use client';

import { useEffect } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useKioskHeartbeat(kioskId: string, currentSpotId?: string) {
  useEffect(() => {
    if (!kioskId) return;
    const ref = doc(db, 'kioskDevices', kioskId);

    const t = setInterval(() => {
      // Use non-blocking write
      setDoc(ref, {
        status: 'online',
        currentSpotId: currentSpotId || null,
        updatedAt: serverTimestamp(),
      }, { merge: true }).catch((err) => {
          // Silently fail. Errors will be picked up by global handler if they are permission errors.
          console.warn('Kiosk heartbeat failed:', err.message);
      });
    }, 5000);

    return () => clearInterval(t);
  }, [kioskId, currentSpotId]);
}

export function useKioskControl(onControl: (c: any) => void) {
  useEffect(() => {
    const ref = doc(db, 'kioskControl', 'global');
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        onControl(snap.data());
      }
    }, (error) => {
        console.warn('Kiosk control listener failed:', error.message);
    });
    return () => unsub();
  }, [onControl]);
}
