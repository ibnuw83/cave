'use client';

import { useEffect, useState } from 'react';
import { getKioskSettings, getSpots, getCave } from '@/lib/firestore';
import { Spot, KioskSettings, Cave } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import KioskPlayer from './player';
import ExitPin from './exit-pin';

export default function KiosPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<(Spot & { duration: number })[]>([]);
  const [mode, setMode] = useState<'loop' | 'shuffle'>('loop');
  const [cave, setCave] = useState<Cave | null>(null);
  const [settings, setSettings] = useState<KioskSettings | null>(null);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const settingsData = await getKioskSettings();
        if (!settingsData || !settingsData.playlist || settingsData.playlist.length === 0) {
          setError('Kios belum dikonfigurasi. Silakan atur daftar putar di Panel Admin.');
          setLoading(false);
          return;
        }
        
        setSettings(settingsData);
        setMode(settingsData.mode);
        
        const caveData = await getCave(settingsData.caveId);
        if (!caveData) {
            setError(`Gua dengan ID "${settingsData.caveId}" tidak ditemukan.`);
            setLoading(false);
            return;
        }
        setCave(caveData);

        const allSpots = await getSpots(settingsData.caveId);
        
        if (allSpots.length === 0) {
            setError('Spot tidak ditemukan untuk gua yang dikonfigurasi.');
            setLoading(false);
            return;
        }

        const orderedPlaylist = settingsData.playlist
          .map(p => {
            const spot = allSpots.find(s => s.id === p.spotId);
            if (spot) {
              return { ...spot, duration: p.duration };
            }
            return null;
          })
          .filter(Boolean) as (Spot & { duration: number })[];
        
        if (orderedPlaylist.length === 0) {
             setError('Spot yang dikonfigurasi dalam daftar putar tidak dapat ditemukan.');
             setLoading(false);
             return;
        }

        setPlaylist(orderedPlaylist);
      } catch(err) {
        console.error("Failed to load kiosk data:", err);
        setError("Gagal memuat data kios.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-white p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Mode Kios Tidak Dapat Dimuat</h1>
            <p className="text-xl text-muted-foreground">{error}</p>
      </div>
    );
  }
  
  if (!cave || !settings || playlist.length === 0) {
    return (
        <div className="h-screen flex items-center justify-center bg-black text-white p-8 text-center">
             <h1 className="text-3xl font-bold mb-4">Mode Kios Tidak Dapat Dimuat</h1>
             <p className="text-xl text-muted-foreground">Data yang diperlukan tidak lengkap.</p>
        </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden">
        <KioskPlayer
            spots={playlist}
            playlist={settings.playlist}
            mode={settings.mode}
            onExitRequested={() => setShowPin(true)}
        />
        {showPin && <ExitPin onClose={() => setShowPin(false)} />}
    </div>
  );
}
