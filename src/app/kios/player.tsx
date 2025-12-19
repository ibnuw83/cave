'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Spot, KioskSettings } from '@/lib/types';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useKioskHeartbeat, useKioskControl } from '@/hooks/use-kiosk';
import { Progress } from '@/components/ui/progress';

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
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const prevSpotIdRef = useRef<string | null>(null);
  const [kioskEnabled, setKioskEnabled] = useState(true);
  const [kioskMsg, setKioskMsg] = useState('');
  const [isFading, setIsFading] = useState(false);

  const playlist = useMemo(() => 
    mode === 'shuffle'
      ? [...spots].sort(() => Math.random() - 0.5)
      : spots,
    [spots, mode]
  );

  const current = playlist[index];
  
  useKioskHeartbeat('kiosk-001', current?.id);
  useKioskControl((ctrl) => { 
    if (typeof ctrl.enabled === 'boolean') setKioskEnabled(ctrl.enabled);
    if (typeof ctrl.message === 'string') setKioskMsg(ctrl.message);
    if (ctrl.action === 'RESTART' || ctrl.forceReload === true) {
      window.location.reload();
    }
  });

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
  };

  const changeSpot = useCallback(() => {
     setIsFading(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % playlist.length);
        setIsFading(false);
      }, 500); // Wait for fade out
  }, [playlist.length]);


  useEffect(() => {
    clearTimers();
    if (!kioskEnabled || !playlist || playlist.length === 0 || !current) return;
    
    // Log the view and edge transition
    if (current.id) {
        logSpotView(kioskId, current.caveId, current.id);
        if (prevSpotIdRef.current) {
            logEdge(kioskId, current.caveId, prevSpotIdRef.current, current.id);
        }
        prevSpotIdRef.current = current.id;
    }

    const duration = current.duration ? current.duration * 1000 : 30000;
    
    // Set main timer to change spot
    timerRef.current = window.setTimeout(changeSpot, duration);
    
    // Set timer for progress bar
    const startTime = Date.now();
    setProgress(100);
    progressTimerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(newProgress);
        if (newProgress <= 0) {
            if(progressTimerRef.current) clearInterval(progressTimerRef.current);
        }
    }, 100);

    return clearTimers;
  }, [index, playlist, current, kioskId, kioskEnabled, changeSpot]);

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
      <Progress value={progress} className="absolute top-0 left-0 right-0 z-20 h-1 rounded-none bg-white/20 border-none" />

      <img
        key={current.id}
        src={current.imageUrl}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100 scale-105'}`}
        alt={current.title}
        style={{ transformOrigin: 'center center' }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      <div className={`absolute bottom-0 w-full p-8 text-white transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
        <h1 className="text-4xl font-bold font-headline mb-2">{current.title}</h1>
        <p className="text-lg text-white/80 mt-2 max-w-3xl">{current.description}</p>
      </div>

      {current.audioUrl && (
        <audio src={current.audioUrl} autoPlay loop muted />
      )}
    </div>
  );
}
