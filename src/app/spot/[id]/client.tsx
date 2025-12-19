
'use client';

import { useEffect, useState } from 'react';
import { Spot } from '@/lib/types';
import LockedScreen from '@/app/components/locked-screen';
import SpotPlayerUI from '@/app/components/spot-player-ui';
import HybridViewer from '@/app/components/hybrid-viewer';
import { getSpotClient } from '@/lib/firestore'; // Import the client-side fetcher

async function findSpotOffline(spotId: string): Promise<Spot | null> {
  try {
    const cache = await caches.open('penjelajah-gua-offline-v1');
    const indexRes = await cache.match('offline-index');
    if (!indexRes) return null;

    const index = await indexRes.json();
    const caveId = index[spotId];
    if (!caveId) return null;

    const dataRes = await cache.match(`cave-data-${caveId}`);
    if (!dataRes) return null;

    const data = await dataRes.json();
    return data.spots.find((s: Spot) => s.id === spotId) || null;
  } catch {
    return null;
  }
}

export default function SpotPageClient({
  spotId,
  initialSpot,
  userRole,
}: {
  spotId: string;
  initialSpot: Spot | null;
  userRole: 'free' | 'pro' | 'admin';
}) {
  const [spot, setSpot] = useState<Spot | null>(initialSpot);
  const [loading, setLoading] = useState(!initialSpot);

  useEffect(() => {
    async function fetchSpot() {
      if (spot) return; // Already have the spot

      // 1. Try fetching with the client SDK
      try {
        const onlineSpot = await getSpotClient(spotId);
        if (onlineSpot) {
          setSpot(onlineSpot);
          setLoading(false);
          return;
        }
      } catch (e) {
         console.warn("Client-side online fetch failed, trying offline.", e);
      }

      // 2. Fallback to offline cache
      const offlineSpot = await findSpotOffline(spotId);
      if (offlineSpot) {
        setSpot(offlineSpot);
      }
      
      setLoading(false);
    }
    
    fetchSpot();
  }, [spot, spotId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <p>Memuat spot...</p>
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <p>Spot tidak ditemukan</p>
      </div>
    );
  }

  if (spot.isPro && userRole === 'free') {
    return <LockedScreen spot={spot} />;
  }

  return (
    <HybridViewer
      imageUrl={spot.imageUrl}
      forcedType={spot.viewType !== 'auto' ? spot.viewType : undefined}
    >
        <SpotPlayerUI spot={spot} userRole={userRole} />
    </HybridViewer>
  );
}
