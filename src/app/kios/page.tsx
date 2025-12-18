
'use client';

import { useEffect, useState } from 'react';
import { getKioskSettings, getCave, getSpots } from '@/lib/firestore';
import { Cave, Spot, KioskSettings } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import KioskPlayer from './player';

export default function KiosPage() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<KioskSettings | null>(null);
  const [playlist, setPlaylist] = useState<(Spot & { duration: number })[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const kiosk = await getKioskSettings();
        if (!kiosk || !kiosk.playlist || kiosk.playlist.length === 0) {
          setError('Kios belum dikonfigurasi. Silakan atur daftar putar di Panel Admin.');
          return;
        }

        setSettings(kiosk);

        const allSpots = await getSpots(kiosk.caveId);

        if (allSpots.length === 0) {
            setError('Spot tidak ditemukan untuk gua yang dikonfigurasi.');
            return;
        }

        const orderedPlaylist = kiosk.playlist
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

  if (error || !settings) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-white p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Mode Kios Tidak Dapat Dimuat</h1>
            <p className="text-xl text-muted-foreground">{error || 'Gagal memuat pengaturan.'}</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black text-white overflow-hidden">
      <KioskPlayer playlist={playlist} mode={settings.mode} />
    </div>
  );
}
