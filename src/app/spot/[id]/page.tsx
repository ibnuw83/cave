'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useUser } from '@/firebase';
import SpotPageClient from './client';
import { getSpotClient, getSpots } from '@/lib/firestore';
import { Spot } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function SpotPage() {
  const params = useParams();
  const { user, userProfile, isUserLoading, isProfileLoading } = useUser();
  
  const spotId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [spot, setSpot] = useState<Spot | null>(null);
  const [allSpots, setAllSpots] = useState<Spot[]>([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!spotId) {
      setError(true);
      setDataLoading(false);
      return;
    }
    
    setDataLoading(true);

    const fetchData = async () => {
      try {
        const spotData = await getSpotClient(spotId);
        if (!spotData) {
          setError(true);
          return;
        }
        
        const siblingSpots = await getSpots(spotData.caveId);

        setSpot(spotData);
        setAllSpots(siblingSpots);

      } catch (err) {
        console.error("Failed to fetch spot data", err);
        setError(true);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();

  }, [spotId]);

  const isLoading = isUserLoading || isProfileLoading || dataLoading;

  if (isLoading) {
    return <Skeleton className="h-screen w-screen bg-black" />;
  }
  
  if (error || !spot) {
      notFound();
  }

  // Determine user role, default to 'free' if not logged in or no profile
  const role = userProfile?.role || 'free';

  return (
    <SpotPageClient
      spotId={spotId}
      initialSpot={spot}
      initialAllSpots={allSpots}
      userRole={role}
    />
  );
}
