
'use client';

import { useState, useEffect } from 'react';
import { Spot } from '@/lib/types';
import { getOfflineCaveData } from '@/lib/offline';
import { GyroViewer } from '@/app/components/gyro-viewer';
import SpotPlayerUI from '@/app/components/spot-player-ui';
import { Skeleton } from '@/components/ui/skeleton';

interface SpotPageClientProps {
  spotId: string;
  initialSpot: Spot | null;
  userRole: 'free' | 'pro' | 'admin';
}

async function getOfflineSpot(spotId: string): Promise<Spot | null> {
    // We don't know the caveId here, so we have to iterate through all cached caves.
    // This is not super efficient but necessary given the data structure.
    try {
        const cache = await caches.open('penjelajah-gua-offline-v1');
        const keys = await cache.keys();
        for (const key of keys) {
            const response = await cache.match(key);
            if (response) {
                const data = await response.json();
                if (data && data.spots) {
                    const foundSpot = data.spots.find((s: Spot) => s.id === spotId);
                    if (foundSpot) {
                        return foundSpot;
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error searching for offline spot:", error);
    }
    return null;
}


export default function SpotPageClient({ spotId, initialSpot, userRole }: SpotPageClientProps) {
  const [spot, setSpot] = useState<Spot | null>(initialSpot);
  const [loading, setLoading] = useState(!initialSpot);

  useEffect(() => {
    // If the server didn't provide the spot, it might be in the offline cache.
    if (!initialSpot) {
      setLoading(true);
      getOfflineSpot(spotId).then(offlineSpot => {
        if (offlineSpot) {
          setSpot(offlineSpot);
        }
        // If still not found, it will remain null and show an error/not found message.
        setLoading(false);
      });
    }
  }, [initialSpot, spotId]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!spot) {
    // This can happen if the spot is not found online or offline.
    return (
        <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white text-center p-4">
            <h1 className="text-2xl font-bold">Spot Tidak Ditemukan</h1>
            <p className="text-muted-foreground mt-2">Spot ini mungkin tidak ada atau belum tersedia untuk diakses secara offline.</p>
        </div>
    )
  }
  
  // The lock check is now done on the server, but we can double-check here.
  const isLocked = spot.isPro && userRole === 'free';
  if (isLocked) {
      // This should ideally not be reached if server-side check works.
      return (
           <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white text-center p-4">
                <h1 className="text-2xl font-bold">Akses Ditolak</h1>
                <p className="text-muted-foreground mt-2">Anda tidak memiliki izin untuk melihat spot ini.</p>
            </div>
      )
  }

  return (
    <GyroViewer imageUrl={spot.imageUrl}>
       <SpotPlayerUI spot={spot} />
    </GyroViewer>
  );
}
