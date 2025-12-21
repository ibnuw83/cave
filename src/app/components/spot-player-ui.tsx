
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Spot } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Play, Pause, Loader2, Maximize, Minimize, Orbit, SkipForward, Gem, Languages } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { stopSpeechSynthesis } from '@/lib/tts';
import { Skeleton } from '@/components/ui/skeleton';


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

/**
 * Creates a WAV file header for PCM audio data.
 * @param pcmData The raw PCM audio data.
 * @param channels Number of audio channels.
 * @param sampleRate The sample rate of the audio.
 * @param bitDepth The bit depth of the audio.
 * @returns A buffer containing the WAV header.
 */
function createWavHeader(pcmData: ArrayBuffer, channels: number, sampleRate: number, bitDepth: number): ArrayBuffer {
    const bytesPerSample = bitDepth / 8;
    const blockAlign = channels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcmData.byteLength;

    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    
    // "fmt " sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Sub-chunk size (16 for PCM)
    view.setUint16(20, 1, true);  // Audio format (1 for PCM)
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    
    // "data" sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    return buffer;
}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}

/**
 * Converts raw PCM audio data (in base64) to a WAV audio blob URL.
 * This is done entirely on the client-side.
 * @param base64PcmData The base64 encoded string of raw PCM audio.
 * @returns A promise that resolves to an object URL for the WAV audio.
 */
async function convertPcmToWavUrl(base64PcmData: string): Promise<string> {
    // Decode base64 to an ArrayBuffer
    const pcmData = Uint8Array.from(atob(base64PcmData), c => c.charCodeAt(0)).buffer;
    
    // Define audio parameters (should match the output of the TTS model)
    const channels = 1;
    const sampleRate = 24000;
    const bitDepth = 16;
    
    // Create the WAV header
    const header = createWavHeader(pcmData, channels, sampleRate, bitDepth);
    
    // Combine header and PCM data into a single Blob
    const wavBlob = new Blob([header, pcmData], { type: 'audio/wav' });

    // Create a URL for the Blob
    return URL.createObjectURL(wavBlob);
}

// A list of some common languages for the selector
const supportedLanguages = [
    { code: 'en-US', name: 'English' },
    { code: 'id-ID', name: 'Bahasa Indonesia' },
    { code: 'es-ES', name: 'Español' },
    { code: 'fr-FR', name: 'Français' },
    { code: 'de-DE', name: 'Deutsch' },
    { code: 'ja-JP', name: '日本語' },
    { code: 'ko-KR', name: '한국어' },
    { code: 'zh-CN', name: '中文 (简体)' },
];

export default function SpotPlayerUI({ spot, userRole, allSpots, vrMode = false, onVrModeChange }: { spot: Spot, userRole: string, allSpots: Spot[], vrMode?: boolean; onVrModeChange?: (active: boolean) => void }) {
  const { user } = useUser();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUIVisible, setIsUIVisible] = useState(true);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const [selectedLanguage, setSelectedLanguage] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.language : 'id-ID'
  );
  
  const [translatedTitle, setTranslatedTitle] = useState(spot.title);
  const [translatedDescription, setTranslatedDescription] = useState(spot.description);
  const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const isProUser = userRole.startsWith('pro') || userRole === 'vip' || userRole === 'admin';
  const isFreeUser = !isProUser;

  const stopSpeaking = useCallback(() => {
    // Stop browser TTS
    stopSpeechSynthesis();
    // Stop and cleanup the Audio element
    if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
            URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current = null;
    }
  }, []);

  useEffect(() => {
    const translateContent = async () => {
      const targetLanguage = selectedLanguage;
      // Assuming the original content is in Indonesian or a neutral language.
      // For a robust system, the source language should ideally be stored with the content.
      const sourceLanguage = 'id'; 

      // Do not translate if the target is the same as the source
      if (targetLanguage.startsWith(sourceLanguage)) {
        setTranslatedTitle(spot.title);
        setTranslatedDescription(spot.description);
        return;
      }
      
      setIsTranslating(true);
      
      try {
        const [titleRes, descriptionRes] = await Promise.all([
          fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: spot.title, targetLanguage, sourceLanguage }),
          }),
          fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: spot.description, targetLanguage, sourceLanguage }),
          }),
        ]);

        if (titleRes.ok) {
          const { translatedText } = await titleRes.json();
          setTranslatedTitle(translatedText);
        } else {
          setTranslatedTitle(spot.title); // fallback to original
        }
         if (descriptionRes.ok) {
          const { translatedText } = await descriptionRes.json();
          setTranslatedDescription(translatedText);
        } else {
          setTranslatedDescription(spot.description); // fallback to original
        }

      } catch (error) {
        console.error('Text translation failed, using original text:', error);
        setTranslatedTitle(spot.title);
        setTranslatedDescription(spot.description);
      } finally {
        setIsTranslating(false);
      }
    };

    translateContent();
  }, [spot.id, spot.title, spot.description, selectedLanguage]);


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
    if (e.target instanceof Element && e.target.closest('[class*="carousel"]')) {
       resetUiTimeout();
       return;
    }
    setIsUIVisible(true);
    resetUiTimeout();
  }, [resetUiTimeout]);

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
            router.push(`/cave/${spot.locationId}`);
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
  }, [router, spot.locationId, showUI, resetUiTimeout]);

  
  useEffect(() => {
    // Cleanup function when spot.id changes or component unmounts
    return () => {
      stopSpeaking();
      if (canVibrate()) {
        vibrate(0);
      }
    };
  }, [spot.id, stopSpeaking]);

  const handlePlaybackEnd = () => {
    setIsPlaying(false);
    if (canVibrate()) {
        vibrate(0);
    }
    const currentSpotIndex = allSpots.findIndex(s => s.id === spot.id);
    const hasNextSpot = currentSpotIndex !== -1 && currentSpotIndex < allSpots.length - 1;

    if (hasNextSpot) {
        const nextSpot = allSpots[currentSpotIndex + 1];
        if (isProUser || !nextSpot.isPro) { 
            router.push(`/spot/${nextSpot.id}`);
        } else {
            toast({
                title: "Mode Misi Khusus PRO",
                description: "Upgrade ke PRO untuk melanjutkan tur otomatis ke semua spot.",
                action: (
                    <Button asChild><Link href="/pricing"><Gem className="mr-2"/>Upgrade</Link></Button>
                )
            });
        }
    } else {
       toast({
        title: "Misi Selesai!",
        description: "Anda telah mencapai akhir dari penjelajahan di lokasi ini.",
      });
    }
  };

  const playAudioFromBase64 = async (base64Pcm: string, vibrationPattern?: number[]) => {
      stopSpeaking(); 
      
      const audioUrl = await convertPcmToWavUrl(base64Pcm);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
          handlePlaybackEnd();
      };
      
      audioRef.current = audio;
      await audio.play();
      
      setIsPlaying(true);
      if (vibrationPattern && vibrationPattern.length > 0) {
          vibrate(vibrationPattern);
      }
  };


  const handleTogglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation(); 

    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
      if (canVibrate()) vibrate(0);
      return;
    }

    setIsLoading(true);
    try {
        const response = await fetch('/api/narrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                spotId: spot.id,
                language: selectedLanguage 
            }),
        });

        if (!response.ok) {
            throw new Error(`AI narration failed (status: ${response.status})`);
        }
        
        const base64Pcm = await response.text();
        
        if (!base64Pcm || base64Pcm.length < 100) {
            throw new Error('Invalid or empty narration payload received from API.');
        }
        
        await playAudioFromBase64(base64Pcm, spot.effects?.vibrationPattern);

    } catch (error) {
        console.warn("Failed to play AI narration, falling back to browser TTS:", error);
        toast({
            variant: 'default', 
            title: 'Narasi Fallback', 
            description: 'Menggunakan suara browser karena narasi AI tidak tersedia.'
        });
        
        const u = new SpeechSynthesisUtterance(translatedDescription);
        u.lang = selectedLanguage;
        u.onend = handlePlaybackEnd;
        stopSpeechSynthesis(); // Ensure no prior utterance is queued
        window.speechSynthesis.speak(u);

        setIsPlaying(true);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleToggleDescription = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDescriptionExpanded(prev => !prev);
  };

    const canVibrate = () => typeof window !== 'undefined' && 'vibrate' in navigator;
    const vibrate = (pattern: number | number[]) => {
        if (canVibrate()) {
            navigator.vibrate(pattern);
        }
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
                <Link href={`/cave/${spot.locationId}`}>
                    <ChevronLeft className="mr-2 h-5 w-5" />
                    Kembali
                </Link>
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                     <Button variant="ghost" className="text-white hover:bg-white/20 hover:text-white pointer-events-auto">
                        <Languages className="mr-2 h-5 w-5" />
                        <span>{supportedLanguages.find(l => l.code === selectedLanguage)?.name || selectedLanguage}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black/70 border-white/20 text-white backdrop-blur-md">
                    {supportedLanguages.map(lang => (
                         <DropdownMenuItem key={lang.code} onSelect={() => setSelectedLanguage(lang.code)}>
                            {lang.name}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
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
                   <Button size="icon" className="rounded-full h-16 w-16 bg-white/30 text-white backdrop-blur-sm hover:bg-white/50 flex-shrink-0" onClick={handleTogglePlay} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                    </Button>
                    
                    <div>
                        {isTranslating ? (
                            <Skeleton className="h-9 w-64 mb-1" />
                        ) : (
                            <h1 className="text-3xl font-bold font-headline mb-1">{translatedTitle}</h1>
                        )}
                        {isTranslating ? (
                            <Skeleton className="h-5 w-full max-w-lg mt-2" />
                        ) : (
                            <>
                                <p className={cn("text-base text-white/80 max-w-prose", !isDescriptionExpanded && "line-clamp-1")}>
                                    {translatedDescription}
                                </p>
                                <Button 
                                    variant="link" 
                                    onClick={handleToggleDescription}
                                    className="text-accent hover:text-accent/80 p-0 h-auto text-sm mt-1"
                                >
                                    {isDescriptionExpanded ? "Sembunyikan" : "Selanjutnya"}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                <div className='flex items-center gap-2'>
                  {onVrModeChange && (
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="rounded-full h-12 w-12 bg-white/20 text-white backdrop-blur-sm hover:bg-white/40 flex-shrink-0" 
                        onClick={() => onVrModeChange(!vrMode)}
                    >
                        <Orbit className="h-6 w-6" />
                        <span className="sr-only">{vrMode ? 'Keluar dari Mode VR' : 'Masuk ke Mode VR'}</span>
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="rounded-full h-12 w-12 bg-white/20 text-white backdrop-blur-sm hover:bg-white/40 flex-shrink-0" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
                  </Button>
                </div>
            </div>
        </div>
    </>
  );
}

    

    

