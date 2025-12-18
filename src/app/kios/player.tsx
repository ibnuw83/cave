'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Spot, KioskSettings } from '@/lib/types';
import VisitorCounter from '../components/visitor-counter';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useKioskHeartbeat, useKioskControl } from '@/hooks/use-kiosk';


interface Props {
  spots: (Spot & { duration: number })[];
  mode: KioskSettings['mode'];
  kioskId: string;
}

// Logging functions as provided
async function logSpotView(kioskId: string, caveId: string, spotId: string) {
  try {
    await addDoc(collection(db, 'kioskEvents'), {
      type: 'SPOT_VIEW',
      kioskId,
      caveId,
      spotId,
      ts: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to log SPOT_VIEW event:", error);
  }
}

async function logEdge(kioskId: string, caveId: string, fromSpotId: string, toSpotId: string) {
  try {
    await addDoc(collection(db, 'kioskEvents'), {
      type: 'SPOT_EDGE',
      kioskId,
      caveId,
      fromSpotId,
      toSpotId,
      ts: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to log SPOT_EDGE event:", error);
  }
}


export default function KioskPlayer({ spots, mode, kioskId }: Props) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);
  const prevSpotIdRef = useRef<string | null>(null);
  const [kioskEnabled, setKioskEnabled] = useState(true);
  const [kioskMsg, setKioskMsg] = useState('');

  // Memoize the playlist so shuffle doesn't happen on every render
  const playlist = useMemo(() => 
    mode === 'shuffle'
      ? [...spots].sort(() => Math.random() - 0.5)
      : spots,
    [spots, mode]
  );

  const current = playlist[index];
  
  // Kiosk remote control & heartbeat hooks
  useKioskHeartbeat('kiosk-001', current?.id);
  useKioskControl((ctrl) => { 
    if (typeof ctrl.enabled === 'boolean') setKioskEnabled(ctrl.enabled);
    if (typeof ctrl.message === 'string') setKioskMsg(ctrl.message);
    if (ctrl.action === 'RESTART' || ctrl.forceReload === true) {
      window.location.reload();
    }
  });


  useEffect(() => {
    // Stop timer if kiosk is disabled
    if (!kioskEnabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    if (!playlist || playlist.length === 0 || !current) return;
    
    // Log the view and edge transition
    if (current.id) {
        logSpotView(kioskId, current.caveId, current.id);
        if (prevSpotIdRef.current) {
            logEdge(kioskId, current.caveId, prevSpotIdRef.current, current.id);
        }
        prevSpotIdRef.current = current.id;
    }


    const duration = current.duration ? current.duration * 1000 : 30000; // Default 30 detik
    
    timerRef.current = window.setTimeout(() => {
      setIndex((prev) => (prev + 1) % playlist.length);
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [index, playlist, current, kioskId, kioskEnabled]);

  if (!kioskEnabled) {
    return (
      <div className="h-screen w-screen bg-black text-white flex items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-3xl font-bold mb-3">Kios Dinonaktifkan</h1>
          <p className="text-lg text-gray-300">{kioskMsg || 'Silakan hubungi petugas.'}</p>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
       <div className="flex h-screen items-center justify-center bg-black text-white">
        <p className="text-xl animate-pulse">Menyiapkan daftar putar...</p>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden">
      <VisitorCounter kioskId="kiosk-001" enabled />
      <img
        src={current.imageUrl}
        className="absolute inset-0 w-full h-full object-cover"
        alt={current.title}
      />

      <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 text-white">
        <h1 className="text-3xl font-bold font-headline">{current.title}</h1>
        <p className="text-lg text-white/80 mt-2">{current.description}</p>
      </div>

      {current.audioUrl && (
        <audio src={current.audioUrl} autoPlay loop muted />
      )}
    </div>
  );
}
