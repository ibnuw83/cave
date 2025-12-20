import { getSpotClient, getSpots } from '@/lib/firestore';
import { useUser } from '@/firebase/auth/use-user-server'; // Server-side user hook
import SpotPageClient from './client';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const spot = await getSpotClient(params.id);
 
  if (!spot) {
    return {
      title: 'Spot Tidak Ditemukan',
    }
  }

  return {
    title: `${spot.title} - Penjelajahan 4D`,
    description: spot.description,
    openGraph: {
      title: spot.title,
      description: spot.description,
      images: [spot.imageUrl],
    },
  }
}

export default async function SpotPage({ params }: Props) {
  const spotId = params.id;
  const { userProfile } = await useUser();

  const spot = await getSpotClient(spotId);

  if (!spot) {
    notFound();
  }

  const allSpotsInLocation = await getSpots(spot.locationId);
  const role = userProfile?.role || 'free';

  return (
    <SpotPageClient
      spotId={spotId}
      initialSpot={spot}
      initialAllSpots={allSpotsInLocation}
      userRole={role}
    />
  );
}
