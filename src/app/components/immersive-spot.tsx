'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Spot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Waves, VolumeX, Play, Droplets } from 'lucide-react';
import { vibrate, VIBRATION_PATTERNS } from '@/lib/haptics';

export default function ImmersiveSpot({ spot }: { spot: Spot }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (spot.audioUrl) {
      audioRef.current = new Audio(spot.audioUrl);
      audioRef.current.loop = true;
    }
    
    // Cleanup on component unmount
    return () => {
      audioRef.current?.pause();
    }
  }, [spot.audioUrl]);

  const toggleExperience = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play().catch(e => console.error("Audio play failed:", e));
      if (spot.effects?.vibrationPattern) {
        vibrate(spot.effects.vibrationPattern);
      } else {
        vibrate(VIBRATION_PATTERNS.START_EXPERIENCE);
      }
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleRumble = () => {
    vibrate(VIBRATION_PATTERNS.RUMBLE);
  };
  
  const handleDrip = () => {
    vibrate(VIBRATION_PATTERNS.DRIP);
  };

  return (
    <div className="h-screen w-screen overflow-hidden">
      <Image
        src={spot.imageUrl}
        alt={spot.title}
        fill
        className="object-cover z-0"
        quality={100}
        priority
        data-ai-hint="cave background"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10 z-10"></div>
      
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-end z-20">
        <Button variant="ghost" size="icon" className="bg-black/30 hover:bg-black/50 text-white" asChild>
          <Link href={`/cave/${spot.caveId}`}>
            <X className="h-6 w-6" />
          </Link>
        </Button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 flex flex-col justify-end z-20 text-white">
        <Card className="bg-black/50 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-headline text-white">{spot.title}</CardTitle>
            <CardDescription className="text-base text-white/80 pt-2">{spot.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 md:gap-4 pt-4">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2 bg-white/10 text-white hover:bg-white/20"
              onClick={toggleExperience}
            >
              {isPlaying ? <VolumeX /> : <Play />}
              <span className="text-xs md:text-sm">{isPlaying ? 'Hentikan' : 'Mulai'}</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2 bg-white/10 text-white hover:bg-white/20"
              onClick={handleRumble}
            >
              <Waves className="rotate-90" />
              <span className="text-xs md:text-sm">Gemuruh</span>
            </Button>
             <Button
              variant="outline"
              className="h-20 flex-col gap-2 bg-white/10 text-white hover:bg-white/20"
              onClick={handleDrip}
            >
              <Droplets />
              <span className="text-xs md:text-sm">Tetesan Air</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
