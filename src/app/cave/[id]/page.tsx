
import type { Metadata } from 'next';
import { getLocation, getSpots } from '@/lib/firestore-admin';
import CaveClient from './client';
import { notFound } from 'next/navigation';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const location = await getLocation(params.id);

  if (!location) {
    // This is correct because if metadata fails, the page should be a 404.
    notFound();
  }

  return {
    title: `${location.name} - Cave Explorer 4D`,
    description: location.description,
  };
}

export default async function CavePage({ params }: Props) {
  const location = await getLocation(params.id);
  
  if (!location) {
    // This is the user-facing fallback UI when the backend fails or data is missing.
    return (
        <div className="flex items-center justify-center min-h-screen p-8 text-center text-white">
            <div>
                <h1 className="text-2xl font-bold">Lokasi tidak tersedia</h1>
                <p className="opacity-70 mt-2">
                    Data untuk lokasi ini tidak dapat dimuat. Mungkin sedang ada masalah pada server atau data telah dihapus.
                </p>
            </div>
        </div>
    );
  }

  const spots = await getSpots(params.id);

  return <CaveClient location={location} spots={spots} />;
}
