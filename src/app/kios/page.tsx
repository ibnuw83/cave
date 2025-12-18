
import { getKioskSettings, getSpot, getOfflineCaveData } from "@/lib/firestore";
import { Spot, KioskSettings } from '@/lib/types';
import KiosClient from './client';

async function KioskDataContainer() {
    let settingsData: KioskSettings | null = null;
    let playlistSpots: (Spot & { duration: number })[] = [];
    let error: string | null = null;
    
    try {
        settingsData = await getKioskSettings();
        
        if (!settingsData || !settingsData.playlist || settingsData.playlist.length === 0) {
           error = 'Kios belum dikonfigurasi. Silakan atur daftar putar di Panel Admin.';
        } else {
            // Coba muat semua data dari cache gua yang relevan jika tersedia
            const offlineData = await getOfflineCaveData(settingsData.caveId);

            if (offlineData) {
                // Jika data offline tersedia, filter dan urutkan berdasarkan playlist
                const spotMap = new Map(offlineData.spots.map(s => [s.id, s]));
                playlistSpots = settingsData.playlist.map(item => {
                    const spot = spotMap.get(item.spotId);
                    return spot ? { ...spot, duration: item.duration } : null;
                }).filter(Boolean) as (Spot & { duration: number })[];

                if (playlistSpots.length !== settingsData.playlist.length) {
                    console.warn("Beberapa spot dari playlist tidak ditemukan di cache offline. Lanjutkan dengan data yang ada.");
                }

            } else {
                // Jika tidak ada data offline, ambil setiap spot dari jaringan
                const spotPromises = settingsData.playlist.map(async (item) => {
                    const spot = await getSpot(item.spotId);
                    if (spot) {
                        return { ...spot, duration: item.duration };
                    }
                    return null;
                });
                
                playlistSpots = (await Promise.all(spotPromises)).filter(Boolean) as (Spot & { duration: number })[];
            }

            if (playlistSpots.length === 0) {
                 error = 'Spot yang dikonfigurasi dalam daftar putar tidak dapat ditemukan.';
            }
        }
    } catch (err) {
        console.error("Failed to load kiosk data:", err);
        error = "Gagal memuat data kios. Periksa koneksi dan konfigurasi.";
    }

    if (error) {
        return (
          <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-white p-8 text-center">
                <h1 className="text-3xl font-bold mb-4">Mode Kios Tidak Dapat Dimuat</h1>
                <p className="text-xl text-muted-foreground">{error}</p>
          </div>
        );
    }

    if (!settingsData || playlistSpots.length === 0) {
         return (
            <div className="h-screen flex items-center justify-center bg-black text-white p-8 text-center">
                 <h1 className="text-3xl font-bold mb-4">Mode Kios Tidak Dapat Dimuat</h1>
                 <p className="text-xl text-muted-foreground">Data yang diperlukan tidak lengkap atau spot tidak ditemukan.</p>
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
