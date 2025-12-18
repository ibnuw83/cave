'use client';

import { Cave, Spot, KioskSettings } from '@/lib/types';
import { useKioskPlayer } from '@/hooks/use-kiosk-player';
import { useEffect, useState } from 'react';
import ExitPin from './exit-pin';

interface Props {
  cave: Cave;
  spots: (Spot & { duration: number })[];
  settings: KioskSettings;
}

export default function KioskPlayer({ cave, spots, settings }: Props) {
  const { currentSpot } = useKioskPlayer(spots, settings);
  const [showPin, setShowPin] = useState(false);

  // fullscreen lock
  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  }, []);

  // block keyboard shortcuts
  useEffect(() => {
    const blockKeys = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' ||
        (e.ctrlKey && e.key === 'r') ||
        e.key === 'F11'
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', blockKeys);
    return () => window.removeEventListener('keydown', blockKeys);
  }, []);


  // 5 tap exit
  let tapCount = 0;
  let tapTimer: any = null;

  const handleTap = () => {
    tapCount++;
    clearTimeout(tapTimer);

    if (tapCount >= 5) {
      setShowPin(true);
      tapCount = 0;
    }

    tapTimer = setTimeout(() => {
      tapCount = 0;
    }, 1500);
  };

  if (!currentSpot) {
    return <div className="text-white p-10">Tidak ada spot</div>;
  }

  return (
    <div
      className="h-screen w-screen bg-black text-white flex flex-col"
      onClick={handleTap}
    >
      {/* IMAGE */}
      <div
        className="flex-1 bg-cover bg-center"
        style={{ backgroundImage: `url(${currentSpot.imageUrl})` }}
      />

      {/* INFO */}
      <div className="p-6 bg-black/70">
        <h1 className="text-3xl font-bold">{currentSpot.title}</h1>
        <p className="mt-2 text-lg">{currentSpot.description}</p>
      </div>

      {/* AUDIO */}
      {currentSpot.audioUrl && (
        <audio
          src={currentSpot.audioUrl}
          autoPlay
          playsInline
          key={currentSpot.id} // Add key to re-mount audio element on spot change
        />
      )}

      {showPin && <ExitPin onClose={() => setShowPin(false)} />}
    </div>
  );
}
