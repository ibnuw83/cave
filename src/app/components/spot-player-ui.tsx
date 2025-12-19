
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Spot, Artifact } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Play, Pause, Loader2, Maximize, Minimize, ScanSearch, Sparkles, Trophy } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { findArtifactForSpot, foundArtifact } from '@/lib/firestore';
import { speak, stopSpeaking } from '@/lib/tts';


function SpotNavigation({ currentSpotId, allSpots, isUIVisible }: { currentSpotId: string, allSpots: Spot[], isUIVisible: boolean }) {
    if (allSpots.length <= 1) {
        return null;
    }

    const currentSpotIndex = allSpots.findIndex(s => s.id === currentSpotId);

    return (
        <div 
            className={cn(
                "absolute top-16 left-1/2 -translate-x-1/2 w-full max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg z-30 transition-opacity duration-300",
                isUIVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={(e) => e.stopPropagation()}
        >
            <Carousel opts={{
                align: "start",
                startIndex: currentSpotIndex >= 0 ? currentSpotIndex : 0,
            }}>
                <CarouselContent className="-ml-1">
                    {allSpots.map((spot) => (
                        <CarouselItem key={spot.id} className="basis-1/5 pl-1 group">
                             <Link href={`/spot/${spot.id}`} scroll={false} className="pointer-events-auto">
                                <div className={cn(
                                    "relative aspect-square w-full overflow-hidden rounded-md transition-all",
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
  const { user } = useUser();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isUIVisible, setIsUIVisible] = useState(true);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const isProUser = userRole === 'pro' || userRole === 'admin';

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

  const showUI = useCallback((e: Event) => {
    // If the click is on a carousel control, don't hide the UI
    if (e.target instanceof Element && e.target.closest('[class*="carousel"]')) {
       resetUiTimeout();
       return;
    }
    setIsUIVisible(true);
    resetUiTimeout();
  }, [resetUiTimeout]);

  // Handle various events to show UI
  useEffect(() => {
    const handleActivity = (e: Event) => showUI(e);
    const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!document.fullscreenElement) {
            router.push(`/cave/${spot.caveId}`);
        }
      } else {
        handleActivity(event); 
      }
    };
    window.addEventListener('keydown', handleKeyDown);

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

  
  useEffect(() => {
    // Cleanup function when the spot ID changes
    return () => {
      stopSpeaking(); // This now handles both audio element and speech synthesis
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
    if (!isProUser) return;

    // If something is playing, stop it.
    if (isPlaying) {
      stopSpeaking();
      handlePlaybackEnd();
      return;
    }

    setIsLoading(true);
    try {
        const response = await fetch('/api/narrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spotId: spot.id }),
        });

        if (!response.ok) {
            // Throw an error to be caught by the catch block for fallback
            throw new Error(`Narasi AI gagal dimuat (status: ${response.status})`);
        }
        
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        const audio = new Audio(audioUrl);
        audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            handlePlaybackEnd();
        };
        
        // This is a bit of a hack to make the new audio element available to stopSpeaking
        (window as any).currentAudio = audio;
        
        await audio.play();
        setIsPlaying(true);
        setIsLoading(false);

        if (spot.effects?.vibrationPattern && spot.effects.vibrationPattern.length > 0) {
          vibrate(spot.effects.vibrationPattern);
        }

    } catch (error) {
        console.warn("Gagal memutar narasi AI, beralih ke TTS browser:", error);
        toast({
            variant: 'default', 
            title: 'Narasi Fallback', 
            description: 'Menggunakan suara browser karena narasi AI tidak tersedia.'
        });

        // Fallback to browser's TTS
        speak(spot.description, handlePlaybackEnd);
        setIsPlaying(true); // Assume it starts playing
        setIsLoading(false);
    }
  };
  
  const handleScanArea = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
        toast({ variant: 'destructive', title: 'Harus Login', description: 'Anda harus login untuk mencari artefak.'});
        return;
    }

    setIsScanning(true);
    toast({
        title: 'Memindai Area...',
        description: 'Mencari artefak tersembunyi...',
        duration: 2000
    });

    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const artifact = await findArtifactForSpot(spot.id);

    if (artifact) {
        foundArtifact(user.uid, artifact);
        vibrate([100, 50, 100, 50, 200]);
        toast({
            title: 'Artefak Ditemukan!',
            description: `Anda menemukan: ${artifact.name}`,
            action: (
                <div className='flex items-center gap-2'>
                    <Trophy className='h-5 w-5 text-yellow-400' />
                    <Button variant="secondary" size="sm" onClick={() => router.push('/profile')}>
                        Lihat Koleksi
                    </Button>
                </div>
            )
        });
    } else {
        toast({
            title: 'Tidak Ada Apapun',
            description: 'Tidak ada artefak yang ditemukan di area ini.',
        });
        vibrate(50);
    }
    
    setIsScanning(false);
  };

  const handleToggleDescription = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDescriptionExpanded(prev => !prev);
  }
  
  return (
    <>
        <div 
            className={cn(
                "absolute top-0 left-0 right-0 p-4 z-30 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent transition-opacity duration-300",
                isUIVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
        >
             <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white pointer-events-auto" asChild>
                <Link href={`/cave/${spot.caveId}`}>
                    <ChevronLeft className="mr-2 h-5 w-5" />
                    Kembali
                </Link>
            </Button>
        </div>

        <SpotNavigation currentSpotId={spot.id} allSpots={allSpots} isUIVisible={isUIVisible} />

        <div 
            className={cn(
                "absolute bottom-0 left-0 right-0 p-6 z-20 text-white bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300",
                isUIVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-end justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="flex flex-col gap-2">
                        {isProUser && (
                            <Button size="icon" className="rounded-full h-16 w-16 bg-white/30 text-white backdrop-blur-sm hover:bg-white/50 flex-shrink-0" onClick={handleTogglePlay} disabled={isLoading || isScanning}>
                                {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                            </Button>
                        )}
                        <Button size="icon" className="rounded-full h-16 w-16 bg-primary/80 text-primary-foreground backdrop-blur-sm hover:bg-primary flex-shrink-0" onClick={handleScanArea} disabled={isScanning || isLoading}>
                            {isScanning ? <Loader2 className="h-8 w-8 animate-spin" /> : <ScanSearch className="h-8 w-8" />}
                        </Button>
                    </div>
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

    