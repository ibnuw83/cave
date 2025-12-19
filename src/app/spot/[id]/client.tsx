
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Spot } from '@/lib/types';
import LockedScreen from '@/app/components/locked-screen';
import SpotPlayerUI from '@/app/components/spot-player-ui';
import PanoramaViewer from '@/app/components/panorama-viewer';
import { detectViewType } from '@/lib/view-type';
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
  const [effectiveViewType, setEffectiveViewType] = useState(spot?.viewType || 'auto');
  const [isDetecting, setIsDetecting] = useState(spot?.viewType === 'auto');

  useEffect(() => {
    if (spot) return;
    findSpotOffline(spotId).then(setSpot);
  }, [spot, spotId]);

  useEffect(() => {
    async function checkViewType() {
      if (spot && spot.viewType === 'auto') {
        setIsDetecting(true);
        const detectedType = await detectViewType(spot.imageUrl);
        setEffectiveViewType(detectedType);
        setIsDetecting(false);
      } else if (spot) {
        setEffectiveViewType(spot.viewType || 'flat');
        setIsDetecting(false);
      }
    }
    checkViewType();
  }, [spot]);

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

  if (isDetecting) {
    return <Skeleton className="h-screen w-screen" />;
  }
  
  const usePanorama = effectiveViewType === 'panorama' || effectiveViewType === 'full360';

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
        {usePanorama ? (
            <PanoramaViewer imageUrl={spot.imageUrl} />
        ) : (
            <Image
                src={spot.imageUrl}
                alt={spot.title}
                fill
                className="object-cover"
                quality={100}
            />
        )}
        <SpotPlayerUI spot={spot} userRole={userRole} />
    </div>
  );
}
