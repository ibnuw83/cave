
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Spot, KioskSettings } from '@/lib/types';
import { getSpotClient } from '@/lib/firestore';
import { getOfflineLocationData } from '@/lib/offline';
import { enterKioskLock, exitKioskLock } from '@/lib/kiosk';
import KioskPlayer from './player';

type PlaylistSpot = Spot & { duration: number };

export default function KiosClient({ settings }: { settings: KioskSettings }) {
  const router = useRouter();
  const [spots, setSpots] = useState<PlaylistSpot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Kiosk lock (fullscreen, no-sleep) and exit pin logic
  useEffect(() => {
    enterKioskLock();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+R, F11, etc.
      if ((e.ctrlKey && e.key === 'r') || e.key === 'F11') {
        e.preventDefault();
      }
      
      // Handle Exit PIN on Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        const input = prompt('Masukkan PIN untuk keluar dari mode Kios:');
        if (input === settings.exitPin) {
          exitKioskLock();
          router.push('/admin/kiosk');
        } else if (input !== null) { // User entered something incorrect
          alert('PIN salah.');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => { 
        window.removeEventListener('keydown', handleKeyDown);
        // Ensure we exit lock if component unmounts unexpectedly
        exitKioskLock(); 
    };
  }, [settings.exitPin, router]);

  useEffect(() => {
    async function loadSpots() {
      setLoading(true);
      setError(null);
      
      if (!settings.playlist || settings.playlist.length === 0) {
        setError('Daftar putar kosong. Silakan atur di Panel Admin.');
        setLoading(false);
        return;
      }
      
      const spotPromises = settings.playlist.map(async (item) => {
          try {
              // 1. Try online first
              const onlineSpot = await getSpotClient(item.spotId);
              if (onlineSpot) {
                  return { ...onlineSpot, duration: item.duration };
              }
          } catch (e) {
             console.warn(`Online fetch failed for ${item.spotId}, trying offline.`, e);
          }

          // 2. Fallback to offline
          try {
              if(settings.locationId) {
                const offline = await getOfflineLocationData(settings.locationId);
                const cachedSpot = offline?.spots.find(s => s.id === item.spotId);
                if (cachedSpot) {
                    return { ...cachedSpot, duration: item.duration };
                }
              }
          } catch (e) {
              console.warn(`Offline fetch failed for ${item.spotId}.`, e);
          }
          
          console.error(`Spot ${item.spotId} not found online or offline.`);
          return null; // Return null if spot is not found anywhere
      });

      const loadedSpots = (await Promise.all(spotPromises)).filter(Boolean) as PlaylistSpot[];
      
      if (loadedSpots.length === 0) {
        setError('Semua spot di daftar putar gagal dimuat. Periksa konfigurasi dan koneksi.');
      } else if (loadedSpots.length < settings.playlist.length) {
        console.warn('Beberapa spot di daftar putar tidak dapat dimuat.');
        setSpots(loadedSpots);
      } else {
        setSpots(loadedSpots);
      }
      
      setLoading(false);
    }

    loadSpots();
  }, [settings]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <p className="text-xl animate-pulse">Memuat konten kios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white text-center p-8">
        <div>
            <h1 className="text-2xl font-bold mb-2">Gagal Memuat Kios</h1>
            <p className="text-lg text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <KioskPlayer
        spots={spots}
        mode={settings.mode || 'loop'}
        kioskId={settings.locationId || 'unknown_kiosk'}
      />
  );
}
