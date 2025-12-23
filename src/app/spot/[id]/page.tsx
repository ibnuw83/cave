'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Spot } from '@/lib/types';
import LockedScreen from '@/app/components/locked-screen';
import SpotPlayerUI from '@/app/components/spot-player-ui';
import HybridViewer from '@/app/components/hybrid-viewer';
import PanoramaViewer from '@/components/viewer-panorama';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ServerCrash, Info } from 'lucide-react';
import { useUser } from '@/firebase';
import { getSpotClient, getSpotsForLocation } from '@/lib/firestore-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function SpotPageFallback() {
    return <Skeleton className="w-screen h-screen" />;
}

export default function SpotPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile, isUserLoading, isProfileLoading } = useUser();
  
  const [spot, setSpot] = useState<Spot | null>(null);
  const [allSpotsInLocation, setAllSpotsInLocation] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vrMode, setVrMode] = useState(false);
  
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (!id) {
      setError("ID Spot tidak valid.");
      setLoading(false);
      return;
    }
    
    // Don't fetch until we know the user's role
    if (isUserLoading || isProfileLoading) return;

    async function fetchData() {
        setLoading(true);
        setError(null);
        try {
            const spotData = await getSpotClient(id);
            if (!spotData) {
                setError("Spot tidak ditemukan.");
                setLoading(false);
                return;
            }
            
            const allSpots = await getSpotsForLocation(spotData.locationId);
            setSpot(spotData);
            setAllSpotsInLocation(allSpots);

        } catch (err) {
            console.error(err);
            setError("Gagal memuat data spot. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    }
    
    fetchData();

  }, [id, isUserLoading, isProfileLoading]);

  const goToSpot = (spotId: string) => {
    router.push(`/spot/${spotId}`);
  };

  const role = userProfile?.role || 'free';
  
  if (loading || isUserLoading || isProfileLoading) return <SpotPageFallback />;
  
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

  if (spot.isPro && role === 'free') {
    return <LockedScreen spot={spot} />;
  }

  const viewerKey = `viewer-${spot.id}`;

  const sortedSpots = allSpotsInLocation.sort((a, b) => a.order - b.order);

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
