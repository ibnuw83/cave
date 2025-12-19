'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import SpotPageClient from './client';
import { getSpotClient, getSpots, getUserProfileClient } from '@/lib/firestore';
import { Spot, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function SpotPage() {
  const params = useParams();
  const { user, isUserLoading } = useUser();
  
  const spotId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [spot, setSpot] = useState<Spot | null>(null);
  const [allSpots, setAllSpots] = useState<Spot[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!spotId) {
      setError(true);
      setLoading(false);
      return;
    }
    
    // Wait for user loading to finish
    if (isUserLoading) {
      return;
    }

    setLoading(true);

    const fetchData = async () => {
      try {
        const spotData = await getSpotClient(spotId);
        if (!spotData) {
          setError(true);
          return;
        }
        
        const siblingSpotsPromise = getSpots(spotData.caveId);
        const userProfilePromise = user ? getUserProfileClient(user.uid) : Promise.resolve(null);
        
        const [siblingSpots, profile] = await Promise.all([siblingSpotsPromise, userProfilePromise]);

        setSpot(spotData);
        setAllSpots(siblingSpots);
        setUserProfile(profile);

      } catch (err) {
        console.error("Failed to fetch spot data", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

  }, [spotId, user, isUserLoading]);

  if (loading) {
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
