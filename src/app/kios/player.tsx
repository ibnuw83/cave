'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Spot, KioskSettings } from '@/lib/types';

interface Props {
  settings: KioskSettings;
  spots: (Spot & { duration: number })[];
}

export default function KioskPlayer({ settings, spots }: Props) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Memoize the playlist so shuffle doesn't happen on every render
  const playlist = useMemo(() => 
    settings.mode === 'shuffle'
      ? [...spots].sort(() => Math.random() - 0.5)
      : spots,
    [spots, settings.mode]
  );

  const current = playlist[index];

  useEffect(() => {
    // Jika tidak ada playlist, jangan lakukan apa-apa
    if (!playlist || playlist.length === 0) return;

    // fullscreen paksa
    document.documentElement.requestFullscreen?.().catch(() => {});

    const handleTimeout = () => {
      setIndex((prev) => (prev + 1) % playlist.length);
    };
    
    // Pastikan durasi valid sebelum mengatur timer
    const duration = current?.duration ? current.duration * 1000 : 30000; // Default 30 detik
    
    timerRef.current = window.setTimeout(handleTimeout, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [index, playlist, current]); // Menambahkan playlist dan current ke dependency array

  if (!current) {
    return (
       <div className="flex h-screen items-center justify-center bg-black text-white">
        <p className="text-xl animate-pulse">Menyiapkan daftar putar...</p>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden">
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
