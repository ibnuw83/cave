'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Spot } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, Pause } from 'lucide-react';

type PlaylistItem = Spot & { duration: number };

export default function KioskModeClient({ playlist, mode }: { playlist: PlaylistItem[], mode: 'loop' | 'shuffle' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const currentSpot = playlist[currentIndex];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const playNext = useCallback(() => {
    if (mode === 'shuffle') {
        // Pick a random index that is different from the current one
        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * playlist.length);
        } while (playlist.length > 1 && nextIndex === currentIndex);
        setCurrentIndex(nextIndex);
    } else { // 'loop' mode
        setCurrentIndex((prevIndex) => (prevIndex + 1) % playlist.length);
    }
  }, [playlist.length, mode, currentIndex]);

  useEffect(() => {
    // Cleanup previous audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    // Setup new audio
    if (currentSpot?.audioUrl) {
      audioRef.current = new Audio(currentSpot.audioUrl);
      if(!isPaused) {
        audioRef.current.play().catch(e => console.error("Kiosk audio play failed:", e));
      }
    } else {
        audioRef.current = null;
    }

    // Reset progress
    setProgress(0);

    // Clear previous timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    
    if(!isPaused) {
        // Timer to switch to the next spot
        timerRef.current = setTimeout(playNext, currentSpot.duration * 1000);
    
        // Timer for progress bar
        const startTime = Date.now();
        progressRef.current = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const newProgress = (elapsedTime / (currentSpot.duration * 1000)) * 100;
            if (newProgress <= 100) {
                setProgress(newProgress);
            } else {
                 if (progressRef.current) clearInterval(progressRef.current);
            }
        }, 100);
    }


    // Cleanup on component unmount or when spot changes
    return () => {
      audioRef.current?.pause();
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [currentIndex, currentSpot, playNext, isPaused]);

  const togglePause = () => {
      setIsPaused(prev => !prev);
  }

  if (!currentSpot) {
    return <div className="h-screen w-screen bg-black" />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-black" onClick={togglePause}>
      <Image
        src={currentSpot.imageUrl}
        alt={currentSpot.title}
        fill
        className="object-cover z-0 transition-opacity duration-1000"
        quality={100}
        priority
        data-ai-hint="cave background"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10 z-10"></div>
      
      {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
              <div className="bg-black/50 p-8 rounded-full">
                <Pause className="h-32 w-32 text-white" />
              </div>
          </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 lg:p-16 flex flex-col justify-end z-20 text-white">
        <Card className="bg-black/50 border-white/20 backdrop-blur-sm animate-in fade-in-50 slide-in-from-bottom-10 duration-700">
          <CardHeader>
            <CardTitle className="text-3xl md:text-5xl font-bold font-headline text-white">{currentSpot.title}</CardTitle>
            <CardDescription className="text-lg md:text-2xl text-white/80 pt-4">{currentSpot.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
             <Progress value={progress} className="w-full h-2 bg-white/20 [&>div]:bg-white" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
