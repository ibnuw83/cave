'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import SpotPageClient from './client';
import { getSpotClient, getSpots } from '@/lib/firestore';
import { Spot, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { doc } from 'firebase/firestore';

export default function SpotPage() {
  const params = useParams();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const spotId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [spot, setSpot] = useState<Spot | null>(null);
  const [allSpots, setAllSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

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


  if (isUserLoading || loading || isProfileLoading) {
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
