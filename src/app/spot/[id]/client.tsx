
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spot } from '@/lib/types';
import LockedScreen from '@/app/components/locked-screen';
import SpotPlayerUI from '@/app/components/spot-player-ui';
import HybridViewer from '@/app/components/hybrid-viewer';
import PanoramaViewer from '@/components/viewer-panorama';

interface SpotPageClientProps {
    initialSpot: Spot;
    initialAllSpots: Spot[];
    userRole: string;
}

export default function SpotPageClient({ initialSpot, initialAllSpots, userRole }: SpotPageClientProps) {
  const [spot] = useState<Spot>(initialSpot);
  const [allSpotsInLocation] = useState<Spot[]>(initialAllSpots);
  const [vrMode, setVrMode] = useState(false);
  const router = useRouter();

  const goToSpot = (id: string) => {
    router.push(`/spot/${id}`);
  };

  const role = userRole;

  if (spot.isPro && role === 'free') {
    return <LockedScreen spot={spot} />;
  }

  const viewerKey = `viewer-${spot.id}`;

  if (spot.viewType === 'panorama') {
    return (
        <PanoramaViewer
            key={viewerKey}
            imageUrl={spot.imageUrl}
            hotspots={spot.hotspots || []}
            spotId={spot.id}
            onNavigate={goToSpot}
            vrMode={vrMode}
        >
            <SpotPlayerUI 
              spot={spot} 
              userRole={role} 
              allSpots={allSpotsInLocation}
              vrMode={vrMode}
              onVrModeChange={setVrMode}
            />
        </PanoramaViewer>
    );
  }

  return (
    <HybridViewer
      key={viewerKey}
      imageUrl={spot.imageUrl}
      forcedType={spot.viewType !== 'auto' ? spot.viewType : undefined}
    >
        <SpotPlayerUI spot={spot} userRole={role} allSpots={allSpotsInLocation} />
    </HybridViewer>
  );
}
