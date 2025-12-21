'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spot } from '@/lib/types';
import LockedScreen from '@/app/components/locked-screen';
import SpotPlayerUI from '@/app/components/spot-player-ui';
import HybridViewer from '@/app/components/hybrid-viewer';
import { getSpotClient } from '@/lib/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import PanoramaViewer from '@/components/viewer-panorama';

async function findSpotOffline(spotId: string): Promise<{ spot: Spot | null, spots: Spot[] }> {
  try {
    const cache = await caches.open('penjelajah-gua-offline-v1');
    const indexRes = await cache.match('offline-index');
    if (!indexRes) return { spot: null, spots: [] };

    const index = await indexRes.json();
    const locationId = index[spotId];
    if (!locationId) return { spot: null, spots: [] };

    const dataRes = await cache.match(`location-data-${locationId}`);
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
  initialSpot,
  initialAllSpots,
  userRole,
}: {
  spotId: string;
  initialSpot: Spot | null;
  initialAllSpots: Spot[];
  userRole: string;
}) {
  const [spot, setSpot] = useState<Spot | null>(initialSpot);
  const [allSpotsInLocation, setAllSpotsInLocation] = useState<Spot[]>(initialAllSpots.sort((a, b) => a.order - b.order));
  const [loading, setLoading] = useState(!initialSpot);
  const [vrMode, setVrMode] = useState(false);
  const router = useRouter();


  useEffect(() => {
    if (!initialSpot) {
      setLoading(true);
      const fetchSpotAndSiblings = async () => {
        try {
          const onlineSpot = await getSpotClient(spotId);
          if (onlineSpot) {
            setSpot(onlineSpot);
          } else {
            const { spot: offlineSpot, spots: offlineSiblings } = await findSpotOffline(spotId);
            setSpot(offlineSpot);
            setAllSpotsInLocation(offlineSiblings.sort((a, b) => a.order - b.order));
          }
        } catch (error) {
          console.error("Client-side fallback failed:", error);
          setSpot(null);
        } finally {
          setLoading(false);
        }
      };
      
      fetchSpotAndSiblings();
    }
  }, [spotId, initialSpot]);

  const goToSpot = (id: string) => {
    router.push(`/spot/${id}`);
  };

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

  if (spot.viewType === 'panorama') {
    return (
        <PanoramaViewer
            imageUrl={spot.imageUrl}
            hotspots={spot.hotspots || []}
            spotId={spot.id}
            onNavigate={goToSpot}
            vrMode={vrMode}
        >
            <SpotPlayerUI 
              spot={spot} 
              userRole={userRole} 
              allSpots={allSpotsInLocation}
              vrMode={vrMode}
              onVrModeChange={setVrMode}
            />
        </PanoramaViewer>
    );
  }


  return (
    <HybridViewer
      imageUrl={spot.imageUrl}
      forcedType={spot.viewType !== 'auto' ? spot.viewType : undefined}
    >
        <SpotPlayerUI spot={spot} userRole={userRole} allSpots={allSpotsInLocation} />
    </HybridViewer>
  );
}
