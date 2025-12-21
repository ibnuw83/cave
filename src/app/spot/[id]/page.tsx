import { getSpot } from '@/lib/firestore-admin';
import { useUser } from '@/firebase/auth/use-user-server'; // Server-side user hook
import SpotPageClient from './client';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Metadata fetching must remain on the server.
  const spot = await getSpot(params.id);
 
  if (!spot) {
    return {
      title: 'Spot Tidak Ditemukan',
    }
  }

  return {
    title: `${spot.title} - Cave Explorer 4D`,
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
  const role = userProfile?.role || 'free';
  
  // We no longer check for spot existence here.
  // The client component will fetch its own data and handle the not found case.
  // This prevents calling admin-sdk functions in a public page component.
  
  return (
    <SpotPageClient
      spotId={spotId}
      userRole={role}
    />
  );
}

    