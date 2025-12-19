
'use client';

import { useEffect, useState } from 'react';
import { Spot } from '@/lib/types';
import LockedScreen from '@/app/components/locked-screen';
import SpotPlayerUI from '@/app/components/spot-player-ui';
import HybridViewer from '@/app/components/hybrid-viewer';
import { getSpotClient, getSpots } from '@/lib/firestore'; // Import the client-side fetcher
import { Skeleton } from '@/components/ui/skeleton';


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
  const [allSpotsInCave, setAllSpotsInCave] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(!initialSpot);

  useEffect(() => {
    async function fetchSpotAndSiblings() {
      if (loading === false && spot) return;

      let currentSpot: Spot | null = spot;

      // 1. Fetch the primary spot if not already available
      if (!currentSpot) {
        try {
          currentSpot = await getSpotClient(spotId);
        } catch (e) {
          console.warn("Client-side online fetch failed, trying offline.", e);
          currentSpot = await findSpotOffline(spotId);
        }
      }
      
      setSpot(currentSpot);

      // 2. Fetch all other spots from the same cave for navigation
      if (currentSpot) {
        try {
          const siblingSpots = await getSpots(currentSpot.caveId);
          setAllSpotsInCave(siblingSpots.sort((a, b) => a.order - b.order));
        } catch (error) {
          console.error("Failed to fetch sibling spots:", error);
        }
      }
      
      setLoading(false);
    }
    
    fetchSpotAndSiblings();
  }, [spotId, spot, loading]);


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
