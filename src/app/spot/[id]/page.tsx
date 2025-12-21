
import { getSpot, getSpots } from '@/lib/firestore-admin';
import { useUser } from '@/firebase/auth/use-user-server'; // Server-side user hook
import SpotPageClient from './client';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const spot = await getSpot(params.id);
 
  if (!spot) {
    // Jangan panggil notFound() di sini.
    // Cukup kembalikan metadata default.
    return {
      title: 'Spot Tidak Ditemukan',
      description: 'Data untuk spot ini tidak dapat dimuat.',
    };
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
  
  const spot = await getSpot(spotId);
  
  if (!spot) {
     // Komponen fallback ini sekarang akan ditampilkan dengan benar.
     return (
        <div className="flex items-center justify-center min-h-screen p-8 text-center text-white">
            <div>
                <h1 className="text-2xl font-bold">Spot tidak tersedia</h1>
                <p className="opacity-70 mt-2">
                    Data untuk spot ini tidak dapat dimuat. Mungkin sedang ada masalah pada server atau data telah dihapus.
                </p>
            </div>
        </div>
    );
  }

  // Fetch all spots in the same location to allow for client-side navigation
  const allSpotsInLocation = await getSpots(spot.locationId);

  const { userProfile } = await useUser();
  const role = userProfile?.role || 'free';
  
  return (
    <SpotPageClient
      spot={spot}
      allSpotsInLocation={allSpotsInLocation}
      userRole={role}
    />
  );
}
