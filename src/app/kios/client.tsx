
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Spot, KioskSettings } from '@/lib/types';
import { getSpot } from '@/lib/firestore-admin';
import { getOfflineLocationData } from '@/lib/offline';
import { enterKioskLock, exitKioskLock } from '@/lib/kiosk';
import KioskPlayer from './player';
import { doc } from 'firebase/firestore';
import { useKioskHeartbeat, useKioskControl } from '@/hooks/use-kiosk';
import { useFirestore } from '@/firebase';

type PlaylistSpot = Spot & { duration: number };

async function fetchSpotData(spotId: string, locationId?: string): Promise<Spot | null> {
    try {
        const response = await fetch(`/api/spots/${spotId}`);
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.warn(`Online fetch failed for ${spotId}, trying offline.`, e);
    }
    
    // Fallback to offline if online fails
    try {
        if (locationId) {
            const offline = await getOfflineLocationData(locationId);
            const cachedSpot = offline?.spots.find(s => s.id === spotId);
            if (cachedSpot) {
                return cachedSpot;
            }
        }
    } catch (e) {
        console.warn(`Offline fetch failed for ${spotId}.`, e);
    }

    return null;
}


export default function KiosClient({ settings }: { settings: KioskSettings }) {
  const router = useRouter();
  const firestore = useFirestore();
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
          const spotData = await fetchSpotData(item.spotId, settings.locationId);
          if (spotData) {
            return { ...spotData, duration: item.duration };
          }
          console.error(`Spot ${item.spotId} not found online or offline.`);
          return null;
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

  const kioskDeviceRef = useMemo(() => doc(firestore, 'kioskDevices', 'kiosk-001'), [firestore]);
  const kioskControlRef = useMemo(() => doc(firestore, 'kioskControl', 'global'), [firestore]);
  const currentSpotId = useMemo(() => spots.length > 0 ? spots[0]?.id : undefined, [spots]);

  useKioskHeartbeat(kioskDeviceRef, currentSpotId);
  useKioskControl(kioskControlRef, (ctrl) => {
      // Handle control commands
  });


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
