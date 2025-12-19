'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import SpotPageClient from './client';
import { getSpotClient, getSpots } from '@/lib/firestore';
import { Spot, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, getDoc } from 'firebase/firestore';

export default function SpotPage() {
  const params = useParams();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const spotId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [spot, setSpot] = useState<Spot | null>(null);
  const [allSpots, setAllSpots] = useState<Spot[]>([]);
  const [isSpotLoading, setIsSpotLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setIsProfileLoading(false);
      return;
    }
    
    setIsProfileLoading(true);
    const ref = doc(firestore, 'users', user.uid);
    getDoc(ref)
      .then(snap => {
        if (snap.exists()) {
          setUserProfile({ id: snap.id, ...snap.data() } as UserProfile);
        } else {
          setUserProfile(null);
        }
      })
      .finally(() => setIsProfileLoading(false));
  }, [user, firestore]);

  useEffect(() => {
      if (!spotId) {
        setError(true);
        return;
      };

      const fetchSpotData = async () => {
          try {
              setIsSpotLoading(true);
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
              setIsSpotLoading(false);
          }
      };

      fetchSpotData();

  }, [spotId]);

  const isLoading = isUserLoading || isSpotLoading || isProfileLoading;

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
