
import { getSpot, getSpotsForLocation } from '@/lib/firestore-admin';
import { notFound } from 'next/navigation';
import SpotPageClient from './client';
import { Metadata } from 'next';
import { useUser as useUserServer } from '@/firebase/auth/use-user-server';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const spot = await getSpot(params.id);
    if (!spot) {
      return { title: 'Spot Tidak Ditemukan' };
    }
    return {
      title: `${spot.title} | Cave Explorer 4D`,
      description: spot.description,
    };
  } catch (error) {
    console.error("Failed to generate metadata for spot page:", error);
    return { title: 'Error', description: 'Gagal memuat metadata untuk spot ini.' };
  }
}

function SpotPageFallback() {
    return <Skeleton className="w-screen h-screen" />;
}

export default async function SpotPage({ params }: Props) {
  const { id } = params;
  const { userProfile } = await useUserServer();

  const spot = await getSpot(id);

  if (!spot) {
    notFound();
  }
  
  // For navigation purposes in the player UI, we need all spots in the same location.
  const allSpotsInLocation = await getSpotsForLocation(spot.locationId);

  return (
    <Suspense fallback={<SpotPageFallback />}>
      <SpotPageClient 
          initialSpot={spot}
          initialAllSpots={allSpotsInLocation}
          userRole={userProfile?.role || 'free'}
      />
    </Suspense>
  );
}
