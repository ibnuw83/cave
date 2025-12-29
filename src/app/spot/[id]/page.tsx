
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Spot } from '@/lib/types';
import LockedScreen from '@/app/components/locked-screen';
import SpotPlayerUI from '@/app/components/spot-player-ui';
import HybridViewer from '@/app/components/hybrid-viewer';
import PanoramaViewer from '@/components/viewer-panorama';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ServerCrash, Info } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getSpotClient, getSpotsForLocation } from '@/lib/firestore-client';

function SpotPageFallback() {
    return <Skeleton className="w-screen h-screen" />;
}

export default function SpotPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [vrMode, setVrMode] = useState(false);
  
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [spot, setSpot] = useState<Spot | null>(null);
  const [allSpotsInLocation, setAllSpotsInLocation] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchSpotData() {
      try {
        setLoading(true);
        const spotData = await getSpotClient(firestore, id);
        if (spotData) {
          setSpot(spotData);
          const otherSpots = await getSpotsForLocation(firestore, spotData.locationId);
          setAllSpotsInLocation(otherSpots);
        } else {
          setError('Spot tidak ditemukan.');
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat data spot.');
      } finally {
        setLoading(false);
      }
    }
    fetchSpotData();
  }, [id, firestore]);

  
  const isLoading = isUserLoading || loading;
  
  const role = userProfile?.role ?? 'free';
  const isPro = role.startsWith('pro') || role === 'vip' || role === 'admin';

  const goToSpot = (spotId: string) => {
    router.push(`/spot/${spotId}`);
  };

  if (isLoading) return <SpotPageFallback />;
  
  if (error) {
     return (
      <div className="h-screen w-screen flex items-center justify-center p-4 bg-background">
        <Alert variant="destructive" className="w-full max-w-lg">
          <ServerCrash className="h-4 w-4" />
          <AlertTitle>Gagal Memuat</AlertTitle>
          <AlertDescription>
            {error}
            <Button variant="link" asChild className="mt-2 block p-0">
                <Link href="/">Kembali ke Halaman Utama</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!spot) {
      return (
      <div className="h-screen w-screen flex items-center justify-center p-4 bg-background">
        <Alert className="w-full max-w-lg">
          <Info className="h-4 w-4" />
          <AlertTitle>Tidak Ditemukan</AlertTitle>
          <AlertDescription>
            Spot yang Anda cari tidak ada.
             <Button variant="link" asChild className="mt-2 block p-0">
                <Link href="/">Kembali ke Halaman Utama</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (spot.isPro && !isPro) {
    return <LockedScreen spot={spot} />;
  }

  const viewerKey = `viewer-${spot.id}`;

  const sortedSpots = allSpotsInLocation ? [...allSpotsInLocation].sort((a, b) => a.order - b.order) : [];

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
              allSpots={sortedSpots}
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
        <SpotPlayerUI spot={spot} userRole={role} allSpots={sortedSpots} />
    </HybridViewer>
  );
}
