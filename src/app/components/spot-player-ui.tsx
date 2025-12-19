
'use client';

import { useState, useEffect, useRef } from 'react';
import { Spot } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Play, Pause, Loader2, WandSparkles } from 'lucide-react';
import { canVibrate, vibrate } from '@/lib/haptics';

export default function SpotPlayerUI({ spot }: { spot: Spot }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio and vibration on unmount or spot change
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (canVibrate()) {
        vibrate(0);
      }
    };
  }, [spot.id]);

  const handlePlaybackEnd = () => {
    setIsPlaying(false);
    if (canVibrate()) {
      vibrate(0);
    }
  };

  const handleTogglePlay = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      if (canVibrate()) {
        vibrate(0);
      }
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      try {
        const response = await fetch('/api/narrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: spot.title, description: spot.description }),
        });

        if (!response.ok) {
            throw new Error(`Narration API failed with status: ${response.status}`);
        }

        const { audioUrl } = await response.json();
        
        if (audioRef.current) {
            audioRef.current.pause();
        }

        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = handlePlaybackEnd;
        await audioRef.current.play();

        setIsPlaying(true);

        if (spot.effects?.vibrationPattern) {
          vibrate(spot.effects.vibrationPattern);
        }

      } catch (error) {
        console.error("Failed to play AI narration:", error);
        alert("Gagal memuat narasi AI. Silakan coba lagi.");
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return (
    <>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
            <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white" asChild>
            <Link href={`/cave/${spot.caveId}`}>
                <ChevronLeft className="mr-2 h-5 w-5" />
                Kembali
            </Link>
            </Button>
        </div>

        {/* Footer Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white bg-gradient-to-t from-black/70 to-transparent">
            <h1 className="text-3xl font-bold font-headline mb-1">{spot.title}</h1>
            <p className="text-base text-white/80 max-w-prose">{spot.description}</p>
            
            <div className="mt-6 flex items-center gap-4">
                <Button size="lg" className="rounded-full h-16 w-16 bg-white/30 text-white backdrop-blur-sm hover:bg-white/50" onClick={handleTogglePlay} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                </Button>
                <div className="flex flex-col">
                    <p className="font-bold">Mainkan Narasi AI</p>
                    <p className="text-sm text-white/70 flex items-center gap-1"><WandSparkles className="h-4 w-4"/>Didukung oleh AI</p>
                </div>
            </div>
        </div>
    </>
  );
}
