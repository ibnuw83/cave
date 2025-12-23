'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spot } from '@/lib/types';
import LockedScreen from '@/app/components/locked-screen';
import SpotPlayerUI from '@/app/components/spot-player-ui';
import HybridViewer from '@/app/components/hybrid-viewer';
import PanoramaViewer from '@/components/viewer-panorama';
import { getSpotClient } from '@/lib/firestore-client';
import { useUser, useFirestore } from '@/firebase';
import { Loader2, ServerCrash, ChevronLeft } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SpotPageClient({ spotId }: { spotId: string; }) {
  const [spot, setSpot] = useState<Spot | null>(null);
  const [allSpotsInLocation, setAllSpotsInLocation] = useState<Spot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vrMode, setVrMode] = useState(false);
  const router = useRouter();
  const { userProfile, isUserLoading, isProfileLoading } = useUser();
  const firestore = useFirestore();
  const role = userProfile?.role || 'free';

  useEffect(() => {
    // If a new spot is loaded, potentially exit VR mode
    setVrMode(false);
  }, [spotId]);
  
  useEffect(() => {
    async function fetchSpotData() {
        if (!spotId) {
            setError("ID Spot tidak valid.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const currentSpot = await getSpotClient(spotId);
            if (!currentSpot) {
                setError("Spot tidak ditemukan.");
                setIsLoading(false);
                return;
            }
            setSpot(currentSpot);

            // Fetch all other spots in the same location
            const spotsQuery = query(collection(firestore, 'spots'), where('locationId', '==', currentSpot.locationId));
            const spotsSnapshot = await getDocs(spotsQuery);
            const fetchedSpots = spotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Spot));
            setAllSpotsInLocation(fetchedSpots);

        } catch (err) {
            console.error("Failed to fetch spot data:", err);
            setError("Gagal memuat data untuk spot ini.");
        } finally {
            setIsLoading(false);
        }
    }
    fetchSpotData();
  }, [spotId, firestore]);

  const goToSpot = (id: string) => {
    router.push(`/spot/${id}`);
  };

  const isDataLoading = isLoading || isUserLoading || isProfileLoading;

  if (isDataLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  if (error || !spot) {
      return (
         <div className="container mx-auto min-h-screen max-w-5xl p-4 md:p-8 flex items-center justify-center text-center">
            <div>
                <ServerCrash className="h-16 w-16 mx-auto text-destructive mb-4" />
                <h1 className="text-2xl font-bold mb-2">Gagal Memuat Spot</h1>
                <p className="text-muted-foreground mb-6">{error || 'Data untuk spot ini tidak dapat dimuat.'}</p>
                <Button asChild>
                    <Link href="/">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Kembali ke Halaman Utama
                    </Link>
                </Button>
            </div>
        </div>
      )
  }

  if (spot.isPro && role === 'free') {
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
      imageUrl={spot.imageUrl}
      forcedType={spot.viewType !== 'auto' ? spot.viewType : undefined}
    >
        <SpotPlayerUI spot={spot} userRole={role} allSpots={allSpotsInLocation} />
    </HybridViewer>
  );
}

    