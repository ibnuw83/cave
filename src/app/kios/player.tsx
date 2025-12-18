'use client';

import { Cave, Spot, KioskSettings } from '@/lib/types';
import { useKioskPlayer, type KioskMode } from '@/hooks/use-kiosk-player';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Minimize, LockKeyhole } from 'lucide-react';
import { GyroViewer } from '@/app/components/gyro-viewer';


type PlaylistItem = { spotId: string; duration: number };

export default function KioskPlayer(props: {
  spots: Spot[];
  playlist: PlaylistItem[];
  mode: KioskMode;
  className?: string;
  onExitRequested?: () => void; // trigger PIN modal outside
}) {
  const { spots, playlist, mode, className, onExitRequested } = props;

  // build ordered list based on playlist spotId order
  const playlistSpots = useMemo(() => {
    const byId = new Map(spots.map(s => [s.id, s]));
    return playlist.map(p => byId.get(p.spotId)).filter(Boolean) as Spot[];
  }, [spots, playlist]);

  const getDurationSec = (spot: Spot) => {
    const p = playlist.find(x => x.spotId === spot.id);
    return p?.duration;
  };

  const { currentSpot, orderedSpots, state, actions } = useKioskPlayer({
    spots: playlistSpots,
    mode,
    defaultDurationSec: 30,
    getDurationSec,
    autoplay: true,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Preload next assets (image + audio)
  useEffect(() => {
    const i = orderedSpots.findIndex(s => s.id === currentSpot?.id);
    if (i < 0) return;
    const next = orderedSpots[(i + 1) % orderedSpots.length];
    if (next?.imageUrl) {
      const img = new Image();
      img.src = next.imageUrl;
    }
    if (next?.audioUrl) {
      const a = document.createElement('audio');
      a.preload = 'auto';
      a.src = next.audioUrl;
    }
  }, [currentSpot?.id, orderedSpots]);

  // Apply vibration pattern (if supported)
  useEffect(() => {
    if (!currentSpot) return;
    const pattern = currentSpot.effects?.vibrationPattern;
    if (!pattern?.length) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      // vibrate once at spot start
      (navigator as any).vibrate(pattern);
    }
  }, [currentSpot?.id]);

  // Autoplay narration audio per spot (if exists)
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!currentSpot?.audioUrl) {
      a.pause();
      a.removeAttribute('src');
a.load();
      return;
    }

    a.src = currentSpot.audioUrl;
    a.muted = state.isMuted;
    a.currentTime = 0;

    if (state.isPlaying) {
      // Browser kiosk biasanya aman kalau user pernah tap sekali untuk enable audio
      a.play().catch(() => {
        // diam saja; UI punya tombol unmute/play
      });
    } else {
      a.pause();
    }
  }, [currentSpot?.audioUrl, state.isPlaying, state.isMuted]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // ignore
    }
  };

  // keep fullscreen state synced
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  if (!currentSpot) {
    return (
      <Card className={cn('p-6', className)}>
        <p className="text-muted-foreground">Playlist kosong. Isi dulu di Admin Kios.</p>
      </Card>
    );
  }

  return (
    <div className={cn('relative w-full h-[calc(100vh-0px)] bg-black', className)}>
      {/* Background image */}
      <GyroViewer imageUrl={currentSpot.imageUrl} className="absolute inset-0 opacity-90" />
      
      {/* Content */}
      <div className="relative z-10 flex h-full flex-col">
        <header className="p-4 md:p-6">
          <div className="max-w-4xl">
            <h1 className="text-white text-2xl md:text-4xl font-bold leading-tight">
              {currentSpot.title}
            </h1>
            <p className="text-white/80 mt-2 md:text-lg line-clamp-3">
              {currentSpot.description}
            </p>
            {currentSpot.isPro && (
              <span className="inline-block mt-3 text-xs px-2 py-1 rounded bg-amber-400/20 text-amber-200 border border-amber-200/30">
                PRO Spot
              </span>
            )}
          </div>
        </header>

        <div className="mt-auto p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Controls */}
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="icon" onClick={actions.goPrev}>
                <SkipBack className="h-5 w-5" />
              </Button>

              {state.isPlaying ? (
                <Button variant="secondary" size="icon" onClick={actions.pause}>
                  <Pause className="h-5 w-5" />
                </Button>
              ) : (
                <Button variant="secondary" size="icon" onClick={actions.play}>
                  <Play className="h-5 w-5" />
                </Button>
              )}

              <Button variant="secondary" size="icon" onClick={actions.goNext}>
                <SkipForward className="h-5 w-5" />
              </Button>

              <Button variant="secondary" size="icon" onClick={actions.toggleMute}>
                {state.isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>

              <Button variant="secondary" size="icon" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </Button>

              <Button
                variant="secondary"
                size="icon"
                onClick={onExitRequested}
                title="Keluar (PIN)"
              >
                <LockKeyhole className="h-5 w-5" />
              </Button>
            </div>

            {/* Timer */}
            <div className="text-white/90 flex items-center gap-3">
              <div className="text-sm md:text-base">
                Spot {state.index + 1}/{orderedSpots.length} • Mode: {mode.toUpperCase()}
              </div>
              <div className="text-sm md:text-base font-semibold">
                {String(Math.floor(state.secondsLeft / 60)).padStart(2, '0')}:
                {String(state.secondsLeft % 60).padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>

      </div>

      <audio ref={audioRef} preload="auto" />
    </div>
  );
}
