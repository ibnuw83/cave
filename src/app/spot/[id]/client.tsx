
'use client';

import { useEffect, useState } from 'react';
import { Spot } from '@/lib/types';
import LockedScreen from '@/app/components/locked-screen';
import SpotPlayerUI from '@/app/components/spot-player-ui';
import HybridViewer from '@/app/components/hybrid-viewer';
import { getSpotClient, getSpots } from '@/lib/firestore';
import { Skeleton } from '@/components/ui/skeleton';


async function findSpotOffline(spotId: string): Promise<{ spot: Spot | null, spots: Spot[] }> {
  try {
    const cache = await caches.open('penjelajah-gua-offline-v1');
    const indexRes = await cache.match('offline-index');
    if (!indexRes) return { spot: null, spots: [] };

    const index = await indexRes.json();
    const caveId = index[spotId];
    if (!caveId) return { spot: null, spots: [] };

    const dataRes = await cache.match(`cave-data-${caveId}`);
    if (!dataRes) return { spot: null, spots: [] };

    const data = await dataRes.json();
    const currentSpot = data.spots.find((s: Spot) => s.id === spotId) || null;
    return { spot: currentSpot, spots: data.spots || [] };
  } catch {
    return { spot: null, spots: [] };
  }
}

export default function SpotPageClient({
  spotId,
  initialSpot, // This might be null if server-side fetch failed
  userRole,
}: {
  spotId: string;
  initialSpot: Spot | null;
  userRole: 'free' | 'pro' | 'admin';
}) {
  const [spot, setSpot] = useState<Spot | null>(initialSpot);
  const [allSpotsInCave, setAllSpotsInCave] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(!initialSpot);

  useEffect(() => {
    async function fetchSpotAndSiblings() {
      setLoading(true);
      let currentSpot: Spot | null = null;
      let siblingSpots: Spot[] = [];

      try {
        // First, try to get data using the reliable Firestore call
        currentSpot = await getSpotClient(spotId);
        if (currentSpot) {
          siblingSpots = await getSpots(currentSpot.caveId);
        }
      } catch (e) {
        console.warn("Client-side online fetch failed, trying offline.", e);
        // If online fails, try to get everything from offline cache
        const offlineData = await findSpotOffline(spotId);
        currentSpot = offlineData.spot;
        siblingSpots = offlineData.spots;
      }

      setSpot(currentSpot);
      setAllSpotsInCave(siblingSpots.sort((a, b) => a.order - b.order));
      setLoading(false);
    }
    
    // We only need to run this on the initial load or if the spotId changes.
    // The initialSpot from SSR is just a performance optimization.
    fetchSpotAndSiblings();

  }, [spotId]);


  if (loading) {
    return (
      <Skeleton className="h-screen w-screen" />
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
        <SpotPlayerUI spot={spot} userRole={userRole} allSpots={allSpotsInCave} />
    </HybridViewer>
  );
}
