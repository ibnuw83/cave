
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Spot, KioskSettings } from '@/lib/types';
import { getOfflineLocationData } from '@/lib/offline';
import { enterKioskLock, exitKioskLock } from '@/lib/kiosk';
import KioskPlayer from './player';
import { doc } from 'firebase/firestore';
import { useKioskHeartbeat, useKioskControl } from '@/hooks/use-kiosk';
import { useFirestore } from '@/app/layout';
import { getKioskSettings } from '@/lib/firestore-client';

type PlaylistSpot = Spot & { duration: number };

async function fetchSpotData(spotId: string, locationId?: string): Promise<Spot | null> {
    // Note: This function might not be ideal as it tries to fetch from an API route.
    // A better approach for kiosk would be to have all data available offline first.
    // For now, we rely on the offline fallback.
    try {
        const offline = await getOfflineLocationData(locationId || '');
        const cachedSpot = offline?.spots.find(s => s.id === spotId);
        if (cachedSpot) {
            return cachedSpot;
        }
    } catch (e) {
        console.warn(`Offline fetch failed for ${spotId}.`, e);
    }
    return null;
}


export default function KiosClient() {
  const router = useRouter();
  const firestore = useFirestore();
  const [settings, setSettings] = useState<KioskSettings | null>(null);
  const [spots, setSpots] = useState<PlaylistSpot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch settings on the client
  useEffect(() => {
    getKioskSettings(firestore)
      .then(s => {
        if (s) {
          setSettings(s);
        } else {
          setError('Pengaturan kios tidak ditemukan.');
        }
      })
      .catch(err => {
        setError('Gagal memuat pengaturan kios.');
        console.error(err);
      });
  }, [firestore]);


  // Kiosk lock (fullscreen, no-sleep) and exit pin logic
  useEffect(() => {
    if (!settings) return;

    enterKioskLock();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 'r') || e.key === 'F11') {
        e.preventDefault();
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        const input = prompt('Masukkan PIN untuk keluar dari mode Kios:');
        if (input === settings.exitPin) {
          exitKioskLock();
          router.push('/admin/kiosk');
        } else if (input !== null) {
          alert('PIN salah.');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => { 
        window.removeEventListener('keydown', handleKeyDown);
        exitKioskLock(); 
    };
  }, [settings, router]);

  // Load spots once settings are available
  useEffect(() => {
    if (!settings) return;

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
          console.error(`Spot ${item.spotId} not found offline.`);
          return null;
      });

      const loadedSpots = (await Promise.all(spotPromises)).filter(Boolean) as PlaylistSpot[];
      
      if (loadedSpots.length === 0) {
        setError('Semua spot di daftar putar gagal dimuat. Pastikan lokasi telah diunduh untuk mode offline.');
      } else {
        setSpots(loadedSpots);
      }
      
      setLoading(false);
    }

    loadSpots();
  }, [settings]);

  const kioskDeviceRef = useMemo(() => firestore ? doc(firestore, 'kioskDevices', 'kiosk-001') : null, [firestore]);
  const kioskControlRef = useMemo(() => firestore ? doc(firestore, 'kioskControl', 'global') : null, [firestore]);
  const currentSpotId = useMemo(() => spots.length > 0 ? spots[0]?.id : undefined, [spots]);

  // These hooks will only run when the refs are not null
  useKioskHeartbeat(kioskDeviceRef, currentSpotId);
  useKioskControl(kioskControlRef, (ctrl) => {
      // Handle control commands if any
  });


  if (loading || !settings) {
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
            <p className="text-lg text-gray-300">{error}</p>
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
