'use client';

import SpotPageClient from './client';
import { useUser } from '@/firebase';
import { useParams } from 'next/navigation';

export default function SpotPage() {
  const params = useParams();
  const { user, isUserLoading } = useUser();
  const spotId = Array.isArray(params.id) ? params.id[0] : params.id;

  if (isUserLoading) {
      // You can return a loading skeleton here if you want
      return <div className="h-screen w-screen bg-black" />;
  }

  // Determine user role, default to 'free' if not logged in or no profile
  // The client component will handle the detailed role check and potential server fetch
  const role = 'free'; // This will be replaced by the client-side logic fetching profile

  return (
    <SpotPageClient
      spotId={spotId}
      initialSpot={null} // We will always fetch on the client now
      initialAllSpots={[]}
      userRole={user?.uid ? 'pro' : 'free'} // Pass a simple role, client will verify
    />
  );
}
