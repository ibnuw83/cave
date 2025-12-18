
'use client';

import { useState, useEffect } from 'react';
import { Spot } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { canVibrate, vibrate } from '@/lib/haptics';
import { speakLocal, speakPro, stopSpeaking } from '@/lib/tts';

export default function SpotPlayerUI({ spot }: { spot: Spot }) {
  const { userProfile, loading } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const role = userProfile?.role || 'free';
  const canUseProFeatures = role === 'pro' || role === 'admin';
  const hasAudio = !!spot.audioUrl || !!spot.description;

  // Cleanup audio and vibration on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (canVibrate()) {
        vibrate(0);
      }
    };
  }, []);
  
  const handleTogglePlay = () => {
    if (isPlaying) {
      stopSpeaking();
      if (canVibrate()) {
          vibrate(0); // Stop any ongoing vibration
      }
      setIsPlaying(false);
    } else {
      if (hasAudio) {
        const textToSpeak = spot.description;
        if (canUseProFeatures) {
          speakPro(textToSpeak);
        } else {
          speakLocal(textToSpeak);
        }
      }
      if (spot.effects?.vibrationPattern) {
        vibrate(spot.effects.vibrationPattern);
      }
      setIsPlaying(true);
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
            {/* Can add more header controls here */}
        </div>

        {/* Footer Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white bg-gradient-to-t from-black/70 to-transparent">
            <h1 className="text-3xl font-bold font-headline mb-1">{spot.title}</h1>
            <p className="text-base text-white/80 max-w-prose">{spot.description}</p>
            
            <div className="mt-6 flex items-center gap-4">
                <Button size="lg" className="rounded-full h-16 w-16 bg-white/30 text-white backdrop-blur-sm hover:bg-white/50" onClick={handleTogglePlay} disabled={!hasAudio}>
                    {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                </Button>

                 {/* Mute button could be added here in the future */}
            </div>
        </div>
    </>
  );
}

