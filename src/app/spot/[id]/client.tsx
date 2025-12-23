
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spot } from '@/lib/types';
import LockedScreen from '@/app/components/locked-screen';
import SpotPlayerUI from '@/app/components/spot-player-ui';
import HybridViewer from '@/app/components/hybrid-viewer';
import PanoramaViewer from '@/components/viewer-panorama';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

interface SpotPageClientProps {
  initialSpot: Spot;
  allSpotsInLocation: Spot[];
}

export default function SpotPageClient({ initialSpot, allSpotsInLocation }: SpotPageClientProps) {
  const [spot, setSpot] = useState<Spot>(initialSpot);
  const [vrMode, setVrMode] = useState(false);
  const router = useRouter();
  const { userProfile, isUserLoading, isProfileLoading } = useUser();
  
  // When the initialSpot prop changes (due to navigation), update the state
  useEffect(() => {
    setSpot(initialSpot);
    setVrMode(false); // Exit VR mode on spot change
  }, [initialSpot]);

  const goToSpot = (id: string) => {
    router.push(`/spot/${id}`);
  };

  const isDataLoading = isUserLoading || isProfileLoading;
  const role = userProfile?.role || 'free';

  if (isDataLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  if (spot.isPro && role === 'free') {
    return <LockedScreen spot={spot} />;
  }

  // Use a different key for PanoramaViewer to force a re-mount when the spot changes
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
