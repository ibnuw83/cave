
'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Spot, KioskSettings } from '@/lib/types';
import VisitorCounter from '../components/visitor-counter';

interface Props {
  spots: (Spot & { duration: number })[];
  mode: KioskSettings['mode'];
  kioskId: string;
}

export default function KioskPlayer({ spots, mode, kioskId }: Props) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Memoize the playlist so shuffle doesn't happen on every render
  const playlist = useMemo(() => 
    mode === 'shuffle'
      ? [...spots].sort(() => Math.random() - 0.5)
      : spots,
    [spots, mode]
  );

  const current = playlist[index];

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    if (!playlist || playlist.length === 0 || !current) return;

    const duration = current.duration ? current.duration * 1000 : 30000; // Default 30 detik
    
    timerRef.current = window.setTimeout(() => {
      setIndex((prev) => (prev + 1) % playlist.length);
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [index, playlist, current]);

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
