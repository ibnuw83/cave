'use client';

import { useEffect, useRef, useState } from 'react';
import { Spot, KioskSettings } from '@/lib/types';

export function useKioskPlayer(
  spots: Spot[],
  settings: KioskSettings
) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const playlist = settings.mode === 'shuffle'
    ? [...spots].sort(() => Math.random() - 0.5)
    : spots;

  const currentSpot = playlist[index];

  useEffect(() => {
    if (!currentSpot) return;

    const duration =
      settings.playlist.find(p => p.spotId === currentSpot.id)?.duration ?? 30;

    timerRef.current = setTimeout(() => {
      setIndex((prev) => (prev + 1) % playlist.length);
    }, duration * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index, currentSpot, playlist, settings]);

  const next = () => setIndex((i) => (i + 1) % playlist.length);
  const prev = () => setIndex((i) => (i - 1 + playlist.length) % playlist.length);

  return {
    currentSpot,
    index,
    total: playlist.length,
    next,
    prev,
  };
}
