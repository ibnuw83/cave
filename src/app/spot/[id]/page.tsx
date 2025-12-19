
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
  const { user, isUserLoading } = useUser();
  
  const spotId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [spot, setSpot] = useState<Spot | null>(null);
  const [allSpots, setAllSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
      if (!spotId) return;

      const fetchSpotData = async () => {
          try {
              setLoading(true);
              const spotData = await getSpotClient(spotId);
              if (spotData) {
                  setSpot(spotData);
                  // Fetch all spots in the same cave for navigation
                  const siblingSpots = await getSpots(spotData.caveId);
                  setAllSpots(siblingSpots);
              } else {
                  setError(true);
              }
          } catch (err) {
              console.error("Failed to fetch spot data", err);
              setError(true);
          } finally {
              setLoading(false);
          }
      };

      fetchSpotData();

  }, [spotId]);


  if (isUserLoading || loading) {
    return <Skeleton className="h-screen w-screen bg-black" />;
  }
  
  if (error || !spot) {
      notFound();
  }

  // Determine user role, default to 'free' if not logged in or no profile
  // The client component will handle the detailed role check and potential server fetch
  const role = user?.uid ? 'pro' : 'free'; // Simple check, client will verify with profile

  return (
    <SpotPageClient
      spotId={spotId}
      initialSpot={spot}
      initialAllSpots={allSpots}
      userRole={role}
    />
  );
}
