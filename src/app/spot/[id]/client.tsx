'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spot } from '@/lib/types';
import LockedScreen from '@/app/components/locked-screen';
import SpotPlayerUI from '@/app/components/spot-player-ui';
import HybridViewer from '@/app/components/hybrid-viewer';
import PanoramaViewer from '@/components/viewer-panorama';

export default function SpotPageClient({
  spot,
  allSpotsInLocation,
  userRole,
}: {
  spot: Spot;
  allSpotsInLocation: Spot[];
  userRole: string;
}) {
  const [vrMode, setVrMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If a new spot is loaded, potentially exit VR mode
    setVrMode(false);
  }, [spot.id]);

  const goToSpot = (id: string) => {
    router.push(`/spot/${id}`);
  };

  // The server has already validated that the spot exists.
  // We just need to check for access rights on the client.
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
