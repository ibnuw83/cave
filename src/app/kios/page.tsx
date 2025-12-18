
import { getKioskSettings, getSpot } from "@/lib/firestore";
import { getOfflineCaveData } from "@/lib/offline";
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
            // A more robust fetching logic. Prioritize network, use cache as fallback.
            const spotPromises = settingsData.playlist.map(async (item) => {
                try {
                    // 1. Try to fetch from network first
                    const spot = await getSpot(item.spotId);
                    if (spot) {
                        return { ...spot, duration: item.duration };
                    }
                } catch (networkError) {
                    console.warn(`Network fetch for spot ${item.spotId} failed, trying offline.`, networkError);
                }

                // 2. If network fails or spot is null, try to find it in ANY offline cache
                try {
                    const cachesKeys = await caches.keys();
                    for (const key of cachesKeys) {
                        if (key.startsWith('penjelajah-gua-offline-v1')) {
                            const cache = await caches.open(key);
                            const response = await cache.match(`cave-data-${settingsData!.caveId}`); // Check specific cave cache
                            if (response) {
                                const data: OfflineCaveData = await response.json();
                                const foundSpot = data.spots.find(s => s.id === item.spotId);
                                if (foundSpot) {
                                    return { ...foundSpot, duration: item.duration };
                                }
                            }
                        }
                    }
                } catch (cacheError) {
                    console.error(`Cache lookup for spot ${item.spotId} failed.`, cacheError);
                }

                // 3. If it's not found anywhere, return null
                console.warn(`Spot with ID ${item.spotId} could not be found online or in cache.`);
                return null;
            });
            
            playlistSpots = (await Promise.all(spotPromises)).filter(Boolean) as (Spot & { duration: number })[];

            if (playlistSpots.length === 0) {
                 error = 'Spot yang dikonfigurasi dalam daftar putar tidak dapat ditemukan baik online maupun di cache offline.';
            } else if (playlistSpots.length < settingsData.playlist.length) {
                console.warn("Beberapa spot dari daftar putar tidak dapat dimuat.");
                // We can still proceed with the spots that were found.
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

    // This check is redundant if the error above is set, but it's a good safeguard.
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
