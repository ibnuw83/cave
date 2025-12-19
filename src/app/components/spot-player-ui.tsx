
'use client';

import { useState, useEffect, useRef } from 'react';
import { Spot } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Play, Pause, Loader2, WandSparkles } from 'lucide-react';
import { canVibrate, vibrate } from '@/lib/haptics';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';


function SpotNavigation({ currentSpotId, allSpots }: { currentSpotId: string, allSpots: Spot[] }) {
    if (allSpots.length <= 1) {
        return null;
    }

    return (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 w-full max-w-sm lg:max-w-md xl:max-w-lg z-20">
            <Carousel opts={{
                align: "start",
                startIndex: allSpots.findIndex(s => s.id === currentSpotId) || 0,
            }}>
                <CarouselContent className="-ml-2">
                    {allSpots.map((spot) => (
                        <CarouselItem key={spot.id} className="basis-1/3 md:basis-1/4 pl-2 group">
                            <Link href={`/spot/${spot.id}`} scroll={false}>
                                <div className={cn(
                                    "relative aspect-square w-full overflow-hidden rounded-md transition-all",
                                    spot.id === currentSpotId ? 'ring-2 ring-accent ring-offset-2 ring-offset-black/50' : 'opacity-60 hover:opacity-100 hover:scale-105'
                                )}>
                                    <Image
                                        src={spot.imageUrl}
                                        alt={spot.title}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 30vw, 15vw"
                                    />
                                    {spot.isPro && (
                                         <div className="absolute inset-0 bg-black/30"></div>
                                    )}
                                </div>
                            </Link>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex -left-10 bg-white/20 border-white/30 hover:bg-white/40 text-white"/>
                <CarouselNext className="hidden sm:flex -right-10 bg-white/20 border-white/30 hover:bg-white/40 text-white"/>
            </Carousel>
        </div>
    );
}


export default function SpotPlayerUI({ spot, userRole, allSpots }: { spot: Spot, userRole: 'free' | 'pro' | 'admin', allSpots: Spot[] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio and vibration on unmount or spot change
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        // If the src is an object URL, revoke it
        if (audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
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
        const narrationText = spot.description; // Always use the spot's description

        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: narrationText }),
        });

        if (!response.ok) {
            throw new Error(`Narration API failed with status: ${response.status}`);
        }

        // Stop any currently playing audio
        if (audioRef.current) {
          audioRef.current.pause();
          if (audioRef.current.src.startsWith('blob:')) {
            URL.revokeObjectURL(audioRef.current.src);
          }
        }
        
        // Handle audio blob response
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        const audio = new Audio(audioUrl);
        audio.onended = () => {
            URL.revokeObjectURL(audioUrl); // Clean up the object URL
            handlePlaybackEnd();
        };
        
        audioRef.current = audio;
        await audio.play();

        setIsPlaying(true);

        if (spot.effects?.vibrationPattern) {
          vibrate(spot.effects.vibrationPattern);
        }

      } catch (error) {
        console.error("Failed to play AI narration:", error);
        alert("Gagal memuat narasi AI. Silakan coba lagi.");
        setIsPlaying(false); // Ensure playing state is reset on error
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

        {/* Spot Navigation */}
        <SpotNavigation currentSpotId={spot.id} allSpots={allSpots} />

        {/* Footer Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white bg-gradient-to-t from-black/70 to-transparent">
            <h1 className="text-3xl font-bold font-headline mb-1">{spot.title}</h1>
            <p className="text-base text-white/80 max-w-prose">{spot.description}</p>
            
            <div className="mt-6 flex items-center gap-4">
                <Button size="lg" className="rounded-full h-16 w-16 bg-white/30 text-white backdrop-blur-sm hover:bg-white/50" onClick={handleTogglePlay} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                </Button>
                <div className="flex flex-col">
                    <p className="font-bold">Mainkan Narasi</p>
                    {(userRole === 'pro' || userRole === 'admin') && (
                      <p className="text-sm text-white/70 flex items-center gap-1"><WandSparkles className="h-4 w-4"/>Didukung oleh AI</p>
                    )}
                </div>
            </div>
        </div>
    </>
  );
}
