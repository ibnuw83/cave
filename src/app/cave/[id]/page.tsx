
import type { Metadata } from 'next';
import { getLocation, getSpots } from '@/lib/firestore-admin';
import CaveClient from './client';
import { notFound } from 'next/navigation';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const location = await getLocation(params.id);

    if (!location) {
      return {
        title: 'Lokasi Tidak Ditemukan',
        description: 'Lokasi ini tidak tersedia.',
      };
    }

    return {
      title: `${location.name} - Cave Explorer 4D`,
      description: location.description,
    };
  } catch (error) {
    console.error(`[generateMetadata] Failed for /cave/${params.id}:`, error);
    return {
      title: 'Error Memuat Lokasi',
      description: 'Gagal memuat metadata untuk lokasi ini.',
    };
  }
}

export default async function CavePage({ params }: Props) {
  const location = await getLocation(params.id);

  if (!location) {
    notFound();
  }

  const spots = await getSpots(params.id);

  return <CaveClient location={location} spots={spots} />;
}
