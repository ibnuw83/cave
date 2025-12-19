
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Spot } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Play, Pause, Loader2, Maximize, Minimize } from 'lucide-react';
import { canVibrate, vibrate } from '@/lib/haptics';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';


function SpotNavigation({ currentSpotId, allSpots, isVisible }: { currentSpotId: string, allSpots: Spot[], isVisible: boolean }) {
    if (allSpots.length <= 1) {
        return null;
    }

    const currentSpotIndex = allSpots.findIndex(s => s.id === currentSpotId);

    return (
        <div 
            className={cn(
                "absolute top-16 left-1/2 -translate-x-1/2 w-full max-w-xs md:max-w-sm lg:max-w-lg xl:max-w-2xl z-30 transition-opacity duration-300",
                isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={(e) => e.stopPropagation()} // Prevent carousel clicks from hiding UI
        >
            <Carousel opts={{
                align: "start",
                startIndex: currentSpotIndex >= 0 ? currentSpotIndex : 0,
            }}>
                <CarouselContent className="-ml-1">
                    {allSpots.map((spot) => (
                        <CarouselItem key={spot.id} className="basis-1/5 md:basis-1/6 pl-1 group">
                             <Link href={`/spot/${spot.id}`} scroll={false} className="pointer-events-auto">
                                <div className={cn(
                                    "relative aspect-[4/3] w-full overflow-hidden rounded-md transition-all",
                                    spot.id === currentSpotId ? 'ring-2 ring-accent ring-offset-2 ring-offset-black/50' : 'opacity-60 hover:opacity-100 hover:scale-105'
                                )}>
                                    <Image
                                        src={spot.imageUrl}
                                        alt={spot.title}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 20vw, 10vw"
                                    />
                                    {spot.isPro && (
                                         <div className="absolute inset-0 bg-black/30"></div>
                                    )}
                                </div>
                            </Link>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex -left-12 bg-white/20 border-white/30 hover:bg-white/40 text-white pointer-events-auto"/>
                <CarouselNext className="hidden sm:flex -right-12 bg-white/20 border-white/30 hover:bg-white/40 text-white pointer-events-auto"/>
            </Carousel>
        </div>
    );
}


export default function SpotPlayerUI({ spot, userRole, allSpots }: { spot: Spot, userRole: 'free' | 'pro' | 'admin', allSpots: Spot[] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUIVisible, setIsUIVisible] = useState(true);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

   const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const resetUiTimeout = useCallback(() => {
    if (uiTimeoutRef.current) {
        clearTimeout(uiTimeoutRef.current);
    }
    uiTimeoutRef.current = setTimeout(() => {
        setIsUIVisible(false);
    }, 5000); // 5 seconds of inactivity
  }, []);

  const showUI = useCallback(() => {
    setIsUIVisible(true);
    resetUiTimeout();
  }, [resetUiTimeout]);

  // Handle various events to show UI
  useEffect(() => {
    const handleActivity = () => showUI();
    const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // If in fullscreen, default behavior is to exit, which is fine.
        // If not in fullscreen, navigate back.
        if (!document.fullscreenElement) {
            router.push(`/cave/${spot.caveId}`);
        }
      } else {
        handleActivity(); // Show UI on any other key press
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Initial setup
    resetUiTimeout();

    return () => {
      if (uiTimeoutRef.current) {
        clearTimeout(uiTimeoutRef.current);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [router, spot.caveId, showUI, resetUiTimeout]);

  
  // Cleanup audio and vibration on unmount or spot change
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
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

  const handleTogglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation(); 

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      if (canVibrate()) {
        vibrate(0);
      }
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      try {
        const narrationText = spot.description;

        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: narrationText }),
        });

        if (!response.ok) {
            throw new Error(`Narration API failed with status: ${response.status}`);
        }

        if (audioRef.current) {
          audioRef.current.pause();
          if (audioRef.current.src.startsWith('blob:')) {
            URL.revokeObjectURL(audioRef.current.src);
          }
        }
        
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        const audio = new Audio(audioUrl);
        audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
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
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleToggleDescription = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDescriptionExpanded(prev => !prev);
  }
  
  return (
    <>
        {/* Header - Back button */}
        <div className={cn(
            "absolute top-0 left-0 right-0 p-4 z-30 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent transition-opacity duration-300",
            isUIVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
             <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white pointer-events-auto" asChild>
                <Link href={`/cave/${spot.caveId}`}>
                    <ChevronLeft className="mr-2 h-5 w-5" />
                    Kembali
                </Link>
            </Button>
        </div>

        {/* Spot Navigation */}
        <SpotNavigation currentSpotId={spot.id} allSpots={allSpots} isVisible={isUIVisible} />

        {/* Footer Controls */}
        <div 
            className={cn(
                "absolute bottom-0 left-0 right-0 p-6 z-20 text-white bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300",
                isUIVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-end justify-between gap-4">
                <div className="flex items-start gap-4">
                    <Button size="lg" className="rounded-full h-16 w-16 bg-white/30 text-white backdrop-blur-sm hover:bg-white/50 flex-shrink-0" onClick={handleTogglePlay} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold font-headline mb-1">{spot.title}</h1>
                         <p className={cn("text-base text-white/80 max-w-prose", !isDescriptionExpanded && "line-clamp-1")}>
                            {spot.description}
                        </p>
                        <Button 
                            variant="link" 
                            onClick={handleToggleDescription}
                            className="text-accent hover:text-accent/80 p-0 h-auto text-sm mt-1"
                        >
                            {isDescriptionExpanded ? "Sembunyikan" : "Selanjutnya"}
                        </Button>
                    </div>
                </div>

                <Button size="icon" variant="ghost" className="rounded-full h-12 w-12 bg-white/20 text-white backdrop-blur-sm hover:bg-white/40 flex-shrink-0" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
                </Button>
            </div>
        </div>
    </>
  );
}
