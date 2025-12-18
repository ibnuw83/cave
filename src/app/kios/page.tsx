
import { getKioskSettings, getSpots, getCave } from '@/lib/firestore';
import { Spot, KioskSettings, Cave } from '@/lib/types';
import { getOfflineCaveData } from '@/lib/offline';
import { Loader2 } from 'lucide-react';
import KiosClient from './client';

async function KioskDataContainer() {
    let settingsData: KioskSettings | null = null;
    let caveData: Cave | null = null;
    let allSpots: Spot[] = [];
    let error: string | null = null;
    
    try {
        settingsData = await getKioskSettings();
        
        if (!settingsData || !settingsData.playlist || settingsData.playlist.length === 0) {
           error = 'Kios belum dikonfigurasi. Silakan atur daftar putar di Panel Admin.';
        } else {
             // Try to load from offline cache first
            const offlineData = await getOfflineCaveData(settingsData.caveId);
            if (offlineData) {
                caveData = offlineData.cave;
                allSpots = offlineData.spots;
            } else {
                // Fetch from network if not offline
                caveData = await getCave(settingsData.caveId);
                if (caveData) {
                  allSpots = await getSpots(settingsData.caveId);
                }
            }

            if (!caveData) {
                error = `Gua dengan ID "${settingsData.caveId}" tidak ditemukan.`;
            } else if (allSpots.length === 0) {
                error = 'Spot tidak ditemukan untuk gua yang dikonfigurasi.';
            }
        }
    } catch (err) {
        console.error("Failed to load kiosk data:", err);
        error = "Gagal memuat data kios.";
    }

    if (error) {
        return (
          <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-white p-8 text-center">
                <h1 className="text-3xl font-bold mb-4">Mode Kios Tidak Dapat Dimuat</h1>
                <p className="text-xl text-muted-foreground">{error}</p>
          </div>
        );
    }

    if (!settingsData || allSpots.length === 0) {
         return (
            <div className="h-screen flex items-center justify-center bg-black text-white p-8 text-center">
                 <h1 className="text-3xl font-bold mb-4">Mode Kios Tidak Dapat Dimuat</h1>
                 <p className="text-xl text-muted-foreground">Data yang diperlukan tidak lengkap.</p>
            </div>
        );
    }
    
    // Filter and order spots based on the playlist from settings
    const playlistSpots = settingsData.playlist
        .map(p => {
            const spot = allSpots.find(s => s.id === p.spotId);
            if (spot) {
                return { ...spot, duration: p.duration };
            }
            return null;
        })
        .filter(Boolean) as (Spot & { duration: number })[];
        
    if (playlistSpots.length === 0) {
        return (
            <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-white p-8 text-center">
                <h1 className="text-3xl font-bold mb-4">Mode Kios Tidak Dapat Dimuat</h1>
                <p className="text-xl text-muted-foreground">Spot yang dikonfigurasi dalam daftar putar tidak dapat ditemukan.</p>
          </div>
        );
    }


    return <KiosClient settings={settingsData} spots={playlistSpots} />;
}


export default function KiosPage() {
    return (
        <div className="h-screen w-screen bg-black text-white overflow-hidden">
            <KioskDataContainer />
        </div>
    )
}
